import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type TextInput, View } from "react-native";
import { Check, ChevronLeft, Pencil, Plus, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { CompanyWorkOrderStructureOption, WorkOrderPomColumn } from "@/domain/mobileContract";
import type { WaflSystemSpecItem } from "@/domain/systemSpecItemCatalog";
import {
  createSpecItemCandidates,
  initialSpecItemSelection,
  normalizeSpecItemName,
  selectedSpecItems,
  toggleSpecItemSelection,
} from "@/domain/specItemSelectionPolicy";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";
import { WAFL_REUSABLE_CATALOG_CREATE_SIZING } from "@/domain/waflSheetDetentPolicy";

type Props = {
  readonly busy: boolean;
  readonly currentPoms: readonly WorkOrderPomColumn[];
  readonly options: readonly CompanyWorkOrderStructureOption[];
  readonly systemItems: readonly WaflSystemSpecItem[];
  readonly recommendationAvailable: boolean;
  readonly onApply: (items: ReturnType<typeof selectedSpecItems>) => Promise<boolean>;
  readonly onClose: () => void;
  readonly onCreate: (name: string) => Promise<CompanyWorkOrderStructureOption | null>;
  readonly onRemove: (option: CompanyWorkOrderStructureOption) => void;
  readonly onRename: (option: CompanyWorkOrderStructureOption, name: string) => Promise<boolean>;
};

export default function SpecItemSelectionSheet(props: Props) {
  const candidates = useMemo(() => createSpecItemCandidates(props.currentPoms, props.options, props.systemItems), [props.currentPoms, props.options, props.systemItems]);
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>(() => initialSpecItemSelection(candidates));
  const nested = useWaflNestedSheetHandoff<"select" | "add" | "rename">("select");
  const editorInputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState("");
  const [renameTarget, setRenameTarget] = useState<CompanyWorkOrderStructureOption | null>(null);
  const selected = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectedItems = useMemo(() => selectedSpecItems(candidates, selectedKeys), [candidates, selectedKeys]);
  const initialKeys = useMemo(() => initialSpecItemSelection(candidates), [candidates]);
  const unchanged = initialKeys.length === selectedKeys.length && initialKeys.every((key) => selected.has(key));

  useEffect(() => {
    // Catalog refreshes can arrive while the staged sheet stays mounted; retain valid local choices and add current snapshot rows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedKeys((current) => {
      const valid = new Set(candidates.map((item) => item.key));
      const retained = current.filter((key) => valid.has(key));
      const currentKeys = initialSpecItemSelection(candidates);
      return [...new Set([...retained, ...currentKeys])];
    });
  }, [candidates]);

  const closeChild = () => { setDraft(""); setRenameTarget(null); nested.transition("select"); };
  const childTitle = nested.route === "add" ? "직접 스펙 만들기" : "스펙 항목 이름 변경";
  const childDisabled = !draft.trim() || (nested.route === "rename" && normalizeSpecItemName(draft) === normalizeSpecItemName(renameTarget?.displayName ?? ""));

  if (nested.route !== "select") return <WaflInputSheet
    cancelAccessibilityLabel={`${childTitle} 취소`}
    confirmAccessibilityLabel={`${childTitle} 저장`}
    confirmDisabled={childDisabled}
    onCancel={closeChild}
    onAfterClose={nested.finishClose}
    onAfterOpen={() => editorInputRef.current?.focus()}
    onConfirm={nested.route === "rename" ? async () => {
      const saved = renameTarget ? await props.onRename(renameTarget, draft) : false;
      if (saved) closeChild();
    } : undefined}
    pending={props.busy}
    sizing={WAFL_REUSABLE_CATALOG_CREATE_SIZING}
    title={childTitle}
    visible={nested.visible}
  >
    <View style={styles.editor}>
      <Pressable accessibilityLabel="기본 스펙으로 돌아가기" onPress={closeChild} style={styles.backButton}><ChevronLeft color={WAFL_THEME.color.navyInk} size={18} /><Text style={styles.backText}>기본 스펙</Text></Pressable>
      <WaflSheetValueField
        helpText="저장하면 같은 회사의 다음 작업지시서에서도 선택할 수 있습니다."
        inputRef={editorInputRef}
        label="스펙 항목명"
        maxLength={80}
        onChange={setDraft}
        placeholder="예: 총장"
        value={draft}
      />
      {nested.route === "add" ? <Pressable disabled={props.busy || childDisabled} onPress={() => { void props.onCreate(draft).then((created) => { if (!created) return; setSelectedKeys((current) => [...new Set([...current, `catalog:${created.id}`])]); closeChild(); }); }} style={[styles.createButton, (props.busy || childDisabled) && styles.disabled]}>{props.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>추가</Text>}</Pressable> : null}
    </View>
  </WaflInputSheet>;

  return <WaflInputSheet
    cancelAccessibilityLabel="스펙 항목 선택 취소"
    confirmAccessibilityLabel="스펙 항목 선택 적용"
    confirmDisabled={unchanged}
    onCancel={props.onClose}
    onAfterClose={nested.finishClose}
    onConfirm={async () => { if (await props.onApply(selectedItems)) props.onClose(); }}
    pending={props.busy}
    sizing="expandable"
    title="스펙 항목 선택"
    visible={nested.visible}
  >
    <View style={styles.content}>
      <Text style={styles.help}>항목을 고른 뒤 V를 누르면 현재 작업지시서 스펙을 한 번에 변경합니다.</Text>
      {!props.recommendationAvailable ? <Text style={styles.recommendationHint}>대분류를 선택하면 WAFL 추천 스펙 항목을 볼 수 있습니다. 직접 만든 우리 회사 항목은 대분류 없이도 사용할 수 있습니다.</Text> : null}
      {(["system", "company", "current"] as const).map((sourceKind) => {
        const section = candidates.filter((item) => item.sourceKind === sourceKind);
        if (section.length === 0) return null;
        return <View key={sourceKind} style={styles.section}>
          <Text style={styles.sectionTitle}>{sourceKind === "system" ? "WAFL 제공" : sourceKind === "company" ? "우리 회사" : "현재 사용 중"}</Text>
          {section.map((item) => {
        const option = item.catalogOptionId ? props.options.find((candidate) => candidate.id === item.catalogOptionId) ?? null : null;
        const checked = selected.has(item.key);
        return <View key={item.key} style={styles.row}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} disabled={props.busy} onPress={() => setSelectedKeys((current) => toggleSpecItemSelection(current, item.key))} style={[styles.choice, checked && styles.choiceSelected]}>
            <Text numberOfLines={2} style={styles.choiceText}>{item.displayName}</Text>
            {item.sourceKind === "current" ? <Text style={styles.legacy}>현재 스냅샷</Text> : null}
            {checked ? <Check color={WAFL_THEME.color.navyInk} size={16} /> : null}
          </Pressable>
          {option ? <Pressable accessibilityLabel={`${option.displayName} 이름 변경`} disabled={props.busy} onPress={() => { setRenameTarget(option); setDraft(option.displayName); nested.transition("rename"); }} style={styles.iconButton}><Pencil color={WAFL_THEME.color.navyInk} size={16} /></Pressable> : null}
          {option ? <Pressable accessibilityLabel={`${option.displayName} 비활성화`} disabled={props.busy} onPress={() => props.onRemove(option)} style={styles.iconButton}><X color={WAFL_THEME.color.error} size={16} /></Pressable> : null}
        </View>;
          })}
        </View>;
      })}
      {candidates.length === 0 ? <Text style={styles.empty}>등록된 스펙 항목이 없습니다.</Text> : null}
      <Pressable accessibilityLabel="직접 만들기" disabled={props.busy} onPress={() => { setDraft(""); nested.transition("add"); }} style={styles.addButton}><Plus color={WAFL_THEME.color.navyInk} size={18} /><Text style={styles.addText}>직접 만들기</Text></Pressable>
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  content: { gap: WAFL_THEME.layout.controlGap },
  section: { gap: WAFL_THEME.layout.tightGap },
  sectionTitle: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.cardTitle.fontSize, marginTop: WAFL_THEME.spacing.sm },
  editor: { gap: WAFL_THEME.layout.controlGap, paddingTop: WAFL_THEME.spacing.sm },
  backButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", minHeight: WAFL_THEME.touch.minimum, paddingRight: WAFL_THEME.spacing.md },
  backText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  help: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
  recommendationHint: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.field, color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, padding: WAFL_THEME.spacing.md },
  row: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.tightGap },
  choice: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.field, borderWidth: WAFL_THEME.border.hairline, flex: 1, flexDirection: "row", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.spacing.md },
  choiceSelected: { backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.navyInk },
  choiceText: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  legacy: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.badge.fontSize },
  iconButton: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.field, borderWidth: WAFL_THEME.border.hairline, height: WAFL_THEME.touch.minimum, justifyContent: "center", width: WAFL_THEME.touch.minimum },
  addButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.spacing.sm },
  addText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  createButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: WAFL_THEME.radius.field, justifyContent: "center", minHeight: 46 },
  createText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  disabled: { opacity: 0.4 },
  empty: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, paddingVertical: WAFL_THEME.spacing.lg, textAlign: "center" },
});
