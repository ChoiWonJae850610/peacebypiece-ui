import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { MeasurementTemplateSummary } from "@/domain/mobileContract";
import WaflInputSheet from "@/features/inputs/WaflInputSheet";
import WaflSheetValueField from "@/features/inputs/WaflSheetValueField";
import WaflChoiceButtons from "@/features/inputs/WaflChoiceButtons";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";

type TemplateMutation = (template: MeasurementTemplateSummary) => Promise<boolean>;

function TemplateGroup(props: {
  readonly label: string;
  readonly items: readonly MeasurementTemplateSummary[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}) {
  return <View style={styles.group}>
    <Text style={styles.groupTitle}>{props.label}</Text>
    {props.items.length ? props.items.map((template) => {
      const selected = template.id === props.selectedId;
      return <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        key={template.id}
        onPress={() => props.onSelect(template.id)}
        style={[styles.option, selected && styles.optionSelected]}
      >
        <View style={styles.optionHeading}>
          <Text numberOfLines={1} style={styles.optionName}>{template.name}</Text>
          {selected ? <Check color={WAFL_THEME.color.navyInk} size={16} strokeWidth={2.5} /> : null}
        </View>
        <Text style={styles.optionMeta}>{template.sizeCount}개 사이즈 · {template.pomCount}개 스펙 항목 · {template.valueCount}개 값</Text>
      </Pressable>;
    }) : <Text style={styles.empty}>사용할 수 있는 스펙이 없습니다.</Text>}
  </View>;
}

export function MeasurementTemplatePickerSheet(props: {
  readonly visible: boolean;
  readonly templates: readonly MeasurementTemplateSummary[];
  readonly pending: boolean;
  readonly errorMessage: string | null;
  readonly onCancel: () => void;
  readonly onApply: TemplateMutation;
}) {
  const [source, setSource] = useState<"system" | "company">("system");
  const [selectedId, setSelectedId] = useState("");
  const recommended = useMemo(() => props.templates.filter((item) => item.sourceKind === "system"), [props.templates]);
  const company = useMemo(() => props.templates.filter((item) => item.sourceKind === "company"), [props.templates]);
  const selected = props.templates.find((item) => item.id === selectedId) ?? null;

  return <WaflInputSheet
    cancelAccessibilityLabel="스펙 불러오기 취소"
    confirmAccessibilityLabel="선택한 스펙 적용"
    confirmDisabled={!selected}
    contentStyle={styles.sheetContent}
    onCancel={() => { setSource("system"); setSelectedId(""); props.onCancel(); }}
    onConfirm={async () => { if (selected && await props.onApply(selected)) { setSource("system"); setSelectedId(""); } }}
    pending={props.pending}
    sizing="adaptiveExpandable"
    title="스펙 불러오기"
    visible={props.visible}
  >
    <View style={styles.scrollContent}>
      <WaflChoiceButtons
        accessibilityLabel="스펙 출처"
        onSelect={(value) => { setSource(value); setSelectedId(""); }}
        options={[{ value: "system", label: "WAFL 추천" }, { value: "company", label: "사용자 저장 스펙" }]}
        selectedValue={source}
      />
      <TemplateGroup items={source === "system" ? recommended : company} label={source === "system" ? "WAFL 추천" : "사용자 저장 스펙"} onSelect={setSelectedId} selectedId={selectedId} />
      {props.errorMessage ? <Text style={styles.error}>{props.errorMessage}</Text> : null}
    </View>
  </WaflInputSheet>;
}

export function CompanyTemplateSaveSheet(props: {
  readonly visible: boolean;
  readonly companyTemplates: readonly MeasurementTemplateSummary[];
  readonly pending: boolean;
  readonly onCancel: () => void;
  readonly onSaveNew: (name: string) => Promise<boolean>;
  readonly onUpdateExisting: TemplateMutation;
  readonly onRename: (template: MeasurementTemplateSummary, name: string) => Promise<boolean>;
  readonly onDisable: TemplateMutation;
}) {
  const [mode, setMode] = useState<"new" | "update">("new");
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [managementPending, setManagementPending] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);
  const effectiveSelectedId = selectedId || (mode === "update" ? props.companyTemplates[0]?.id ?? "" : "");
  const selected = props.companyTemplates.find((item) => item.id === effectiveSelectedId) ?? null;
  const modeOptions = [
    { value: "new", label: "새 스펙 저장" },
    { value: "update", label: "기존 스펙 업데이트" },
  ] as const;
  const disabled = mode === "new" ? !name.trim() : !selected;

  return <WaflInputSheet
    cancelAccessibilityLabel="스펙 저장 취소"
    confirmAccessibilityLabel={mode === "new" ? "새 스펙 저장" : "기존 스펙 업데이트"}
    confirmDisabled={disabled}
    contentStyle={styles.sheetContent}
    keyboardAutoExpand
    keyboardFocusRevealContext={WAFL_THEME.sheet.textEntryFocusRevealClearance}
    keyboardMode="directInput"
    onCancel={() => { setMode("new"); setName(""); setSelectedId(""); setRenameDraft(""); setManagementError(null); props.onCancel(); }}
    onConfirm={async () => {
      const saved = mode === "new"
        ? await props.onSaveNew(name.trim())
        : selected ? await props.onUpdateExisting(selected) : false;
      if (saved) { setName(""); setSelectedId(""); }
    }}
    pending={props.pending || managementPending}
    sizing="adaptiveExpandable"
    title="스펙 저장"
    visible={props.visible}
  >
    <WaflChoiceButtons
      accessibilityLabel="스펙 저장 방식"
      onSelect={(value) => {
        const nextMode = value as "new" | "update";
        const first = nextMode === "update" ? props.companyTemplates[0] : null;
        setMode(nextMode);
        setSelectedId(first?.id ?? "");
        setRenameDraft(first?.name ?? "");
        setManagementError(null);
      }}
      options={modeOptions}
      selectedValue={mode}
    />
    {mode === "new" ? <View style={styles.nameField}>
      <WaflSheetValueField
        autoCorrect={false}
        label="새 스펙 이름"
        maxLength={120}
        onChange={setName}
        placeholder="예: 남성 티셔츠 기본 스펙"
        value={name}
      />
    </View> : <View style={styles.updateFlow}>
      <TemplateGroup
        items={props.companyTemplates}
        label="업데이트할 사용자 저장 스펙"
        onSelect={(value) => { const template = props.companyTemplates.find((item) => item.id === value); setSelectedId(value); setRenameDraft(template?.name ?? ""); setManagementError(null); }}
        selectedId={effectiveSelectedId}
      />
      {selected ? <View style={styles.management}>
        <WaflSheetValueField label="사용자 저장 스펙 관리" maxLength={120} onChange={setRenameDraft} placeholder="스펙 이름" value={renameDraft} />
        <View style={styles.managementActions}>
          <Pressable disabled={managementPending || !renameDraft.trim() || renameDraft.trim() === selected.name} onPress={() => {
            setManagementError(null);
            setManagementPending(true);
            void props.onRename(selected, renameDraft.trim())
              .catch(() => { setManagementError("이름을 변경하지 못했습니다. 다시 시도해 주세요."); return false; })
              .finally(() => setManagementPending(false));
          }} style={[styles.smallButton, (managementPending || !renameDraft.trim() || renameDraft.trim() === selected.name) && styles.disabled]}><Text style={styles.smallButtonText}>이름 변경</Text></Pressable>
          <Pressable disabled={managementPending} onPress={() => confirmWaflDestructiveAction({ title: "사용자 저장 스펙 비활성화", message: `“${selected.name}”을 사용자 저장 스펙 목록에서 숨깁니다. 기존 레시피 완성 스펙은 유지됩니다.`, confirmLabel: "비활성화", onConfirm: () => {
            setManagementError(null);
            setManagementPending(true);
            void props.onDisable(selected)
              .catch(() => { setManagementError("스펙을 비활성화하지 못했습니다. 다시 시도해 주세요."); return false; })
              .finally(() => setManagementPending(false));
          } })} style={[styles.smallButton, styles.dangerButton, managementPending && styles.disabled]}><Text style={styles.dangerText}>비활성화</Text></Pressable>
        </View>
        {managementError ? <Text style={styles.error}>{managementError}</Text> : null}
      </View> : null}
    </View>}
  </WaflInputSheet>;
}

const styles = StyleSheet.create({
  sheetContent: { paddingTop: 10 },
  scrollContent: { gap: 14, paddingBottom: 4 },
  group: { gap: 7 },
  groupTitle: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 11, letterSpacing: 0.3 },
  option: { backgroundColor: "#fffdf9", borderColor: "#ddd0c0", borderRadius: 10, borderWidth: 1, gap: 3, padding: 11 },
  optionSelected: { backgroundColor: "#eef3fb", borderColor: "#55739f" },
  optionHeading: { alignItems: "center", flexDirection: "row", gap: 8 },
  optionName: { color: WAFL_THEME.color.navyInk, flex: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 13 },
  optionMeta: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.regular, fontSize: 10 },
  empty: { backgroundColor: "#faf7f1", borderRadius: 9, color: "#75665b", fontFamily: WAFL_FONTS.medium, fontSize: 12, padding: 12 },
  error: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  nameField: { gap: 6, marginTop: 12 },
  updateFlow: { gap: 12, marginTop: 12 },
  management: { gap: 7 },
  managementActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  smallButton: { alignItems: "center", borderColor: WAFL_THEME.color.border, borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 38, paddingHorizontal: 11 },
  smallButtonText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  dangerButton: { borderColor: "#e0b9b3" },
  dangerText: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.semibold, fontSize: 11 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
