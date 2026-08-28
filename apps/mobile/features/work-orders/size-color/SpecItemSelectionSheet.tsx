import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, type TextInput, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { CompanyWorkOrderStructureOption, WorkOrderPomColumn } from "@/domain/mobileContract";
import type { WaflSystemSpecItem } from "@/domain/systemSpecItemCatalog";
import type { WorkOrderMajorCategoryCode } from "@/domain/workOrderCategoryPolicy";
import { listWaflRecommendedSpecItems } from "@/domain/workOrderSizeSpecRecommendationPolicy.mjs";
import {
  createSpecItemCandidates,
  initialSpecItemSelection,
  normalizeSpecItemName,
  nextSpecItemPreviewKey,
  partitionSpecItemCandidatesByRecommendation,
  reconcileSpecItemPreviewKey,
  selectedSpecItems,
  toggleSpecItemSelection,
} from "@/domain/specItemSelectionPolicy";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import { useWaflNestedSheetHandoff } from "@/features/inputs/useWaflNestedSheetHandoff";
import { WAFL_REUSABLE_CATALOG_CREATE_SIZING } from "@/domain/waflSheetDetentPolicy";
import WaflReusableCreateForm from "@/features/inputs/WaflReusableCreateForm";
import WaflReusableCreateEntryAction from "@/features/inputs/WaflReusableCreateEntryAction";
import WaflOptionGrid, { type WaflOptionGridItem } from "@/features/inputs/WaflOptionGrid";
import WaflSpecMeasurementDiagram from "./WaflSpecMeasurementDiagram";
import type { WaflDecisionChoiceState } from "@/features/feedback/WaflDecisionChoiceBody";

type Props = {
  readonly busy: boolean;
  readonly decision?: WaflDecisionChoiceState | null;
  readonly categoryCode: WorkOrderMajorCategoryCode | null;
  readonly currentPoms: readonly WorkOrderPomColumn[];
  readonly itemCode: string | null;
  readonly options: readonly CompanyWorkOrderStructureOption[];
  readonly systemItems: readonly WaflSystemSpecItem[];
  readonly onApply: (items: ReturnType<typeof selectedSpecItems>) => Promise<boolean>;
  readonly onClose: () => void;
  readonly onCreate: (name: string) => Promise<CompanyWorkOrderStructureOption | null>;
  readonly onRemove: (option: CompanyWorkOrderStructureOption) => void;
  readonly onRename: (option: CompanyWorkOrderStructureOption, name: string) => Promise<boolean>;
};

export default function SpecItemSelectionSheet(props: Props) {
  const candidates = useMemo(() => createSpecItemCandidates(props.currentPoms, props.options, props.systemItems), [props.currentPoms, props.options, props.systemItems]);
  const [selectedKeys, setSelectedKeys] = useState<readonly string[]>(() => initialSpecItemSelection(candidates));
  const [previewSpecKey, setPreviewSpecKey] = useState<string | null>(null);
  const nested = useWaflNestedSheetHandoff<"select" | "add" | "rename">("select");
  const editorInputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState("");
  const [renameTarget, setRenameTarget] = useState<CompanyWorkOrderStructureOption | null>(null);
  const selected = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectedItems = useMemo(() => selectedSpecItems(candidates, selectedKeys), [candidates, selectedKeys]);
  const recommendedSystemItems = useMemo(() => listWaflRecommendedSpecItems(props.categoryCode, props.itemCode, props.systemItems), [props.categoryCode, props.itemCode, props.systemItems]);
  const sectionItems = useMemo(() => partitionSpecItemCandidatesByRecommendation(candidates, recommendedSystemItems.map((item) => item.key)), [candidates, recommendedSystemItems]);
  const sections = [
    { key: "recommended", title: "WAFL 추천 스펙", items: sectionItems.recommended },
    { key: "additional", title: "WAFL 추가 스펙", items: sectionItems.additional },
    { key: "company", title: "우리 회사", items: sectionItems.company },
    { key: "current", title: "현재 사용 중", items: sectionItems.current },
  ] as const;
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

  useEffect(() => {
    // Preview is session-local feedback. A refreshed catalog may invalidate it,
    // but selected current rows alone never create a preview implicitly.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewSpecKey((current) => reconcileSpecItemPreviewKey(current, candidates));
  }, [candidates]);

  const closeChild = () => { setDraft(""); setRenameTarget(null); nested.transition("select"); };
  const childTitle = nested.route === "add" ? "직접 스펙 만들기" : "스펙 항목 이름 변경";
  const childDisabled = !draft.trim() || (nested.route === "rename" && normalizeSpecItemName(draft) === normalizeSpecItemName(renameTarget?.displayName ?? ""));

  if (nested.route !== "select") return <WaflInputSheet
    cancelAccessibilityLabel={`${childTitle} 취소`}
    confirmAccessibilityLabel={`${childTitle} 저장`}
    confirmDisabled={childDisabled}
    keyboardAutoExpand
    keyboardFocusRevealContext={WAFL_THEME.sheet.textEntryFocusRevealClearance}
    keyboardMode="directInput"
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
    {nested.route === "add" ? <WaflReusableCreateForm
      backLabel="기본 스펙"
      fieldLabel="스펙 항목명"
      helpText="저장하면 같은 회사의 다음 레시피에서도 선택할 수 있습니다."
      inputRef={editorInputRef}
      maxLength={80}
      onBack={closeChild}
      onChange={setDraft}
      onCreate={() => props.onCreate(draft).then((created) => { if (!created) return; setSelectedKeys((current) => [...new Set([...current, `catalog:${created.id}`])]); closeChild(); })}
      pending={props.busy}
      placeholder="예: 총장"
      value={draft}
    /> : <View style={styles.editor}>
      <WaflSheetValueField inputRef={editorInputRef} label="스펙 항목명" maxLength={80} onChange={setDraft} placeholder="예: 총장" value={draft} />
    </View>}
  </WaflInputSheet>;

  return <WaflInputSheet
    cancelAccessibilityLabel="스펙 항목 선택 취소"
    confirmAccessibilityLabel="스펙 항목 선택 적용"
    confirmDisabled={unchanged}
    decision={props.decision}
    onCancel={props.onClose}
    onAfterClose={nested.finishClose}
    onConfirm={async () => { if (await props.onApply(selectedItems)) props.onClose(); }}
    pending={props.busy}
    sizing="expandable"
    title="스펙 항목 선택"
    visible={nested.visible}
  >
    <View style={styles.content}>
      <Text style={styles.help}>항목을 고른 뒤 V를 누르면 현재 레시피 스펙을 한 번에 변경합니다.</Text>
      {recommendedSystemItems.length === 0 ? <Text style={styles.recommendationHint}>대분류와 세부품목을 선택하면 WAFL 추천 스펙 항목을 볼 수 있습니다. 직접 만든 우리 회사 항목은 추천 없이도 사용할 수 있습니다.</Text> : null}
      <WaflSpecMeasurementDiagram categoryCode={props.categoryCode} previewSpecKey={previewSpecKey} />
      {sections.map(({ key, title, items: section }) => {
        if (section.length === 0) return null;
        const gridItems: readonly WaflOptionGridItem[] = section.map((item) => ({
          editable: item.catalogOptionId !== null,
          key: item.key,
          label: item.displayName,
          removable: item.catalogOptionId !== null,
          selected: selected.has(item.key),
        }));
        return <View key={key} style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <WaflOptionGrid
            accessibilityLabel={`${title} 항목 선택`}
            columns={4}
            disabled={props.busy}
            items={gridItems}
            onEdit={(item) => {
              const candidate = section.find((entry) => entry.key === item.key);
              const option = candidate?.catalogOptionId ? props.options.find((entry) => entry.id === candidate.catalogOptionId) ?? null : null;
              if (!option) return;
              setRenameTarget(option);
              setDraft(option.displayName);
              nested.transition("rename");
            }}
            onRemove={(item) => {
              const candidate = section.find((entry) => entry.key === item.key);
              const option = candidate?.catalogOptionId ? props.options.find((entry) => entry.id === candidate.catalogOptionId) ?? null : null;
              if (option) props.onRemove(option);
            }}
            onToggle={(item) => {
              const candidate = section.find((entry) => entry.key === item.key);
              if (!candidate) return;
              const wasSelected = selected.has(item.key);
              setSelectedKeys((current) => toggleSpecItemSelection(current, item.key));
              setPreviewSpecKey((current) => nextSpecItemPreviewKey(current, candidate, wasSelected));
            }}
          />
        </View>;
      })}
      {candidates.length === 0 ? <Text style={styles.empty}>등록된 스펙 항목이 없습니다.</Text> : null}
      <WaflReusableCreateEntryAction disabled={props.busy} onPress={() => { setDraft(""); nested.transition("add"); }} testID="spec-direct-create-entry" />
    </View>
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  content: { gap: WAFL_THEME.layout.controlGap },
  section: { gap: WAFL_THEME.layout.tightGap },
  sectionTitle: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.cardTitle.fontSize, marginTop: WAFL_THEME.spacing.sm },
  editor: { gap: WAFL_THEME.layout.controlGap, paddingTop: WAFL_THEME.spacing.sm },
  help: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
  recommendationHint: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.field, color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, padding: WAFL_THEME.spacing.md },
  empty: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, paddingVertical: WAFL_THEME.spacing.lg, textAlign: "center" },
});
