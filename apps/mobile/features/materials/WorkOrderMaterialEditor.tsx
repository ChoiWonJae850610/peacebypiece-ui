import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, Save, SlidersVertical, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { MaterialEditorFieldErrors } from "@/domain/workOrderValidation";
import type { MaterialDraftFields, MaterialPartnerOption, MaterialType } from "@/domain/mobileContract";
import MaterialPartnerPickerSheet from "@/features/materials/MaterialPartnerPickerSheet";
import WaflReelPickerSheet from "@/features/inputs/reel-picker/WaflReelPickerSheet";
import WaflSheetTextInput, { WaflSheetFocusBlock } from "@/features/inputs/WaflSheetTextInput";
import WaflCharacterCounter from "@/features/inputs/WaflCharacterCounter";
import { MATERIAL_MEMO_MAX_LENGTH, MATERIAL_USAGE_AREA_MAX_LENGTH } from "@/domain/materialTextPolicy";
import MaterialQuantityValue from "@/features/materials/MaterialQuantityValue";
import { MOBILE_MATERIAL_FIELD_LABELS } from "@/features/materials/materialFieldPolicy";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import { materialReelDraftPatch, type MaterialReelField } from "@/features/materials/materialReelAdapter";
import {
  calculateMaterialAmount,
  calculateOrderQuantity,
  formatQuantity,
  formatWon,
  normalizeNumericCommitValue,
  normalizeNumericDraft,
  prepareNumericDraftOnFocus,
} from "@/lib/mobileDisplay";

export type MaterialEditorMode = "create" | "edit";
export type MaterialEditorSaveState = "editing" | "saving" | "validation-error" | "conflict" | "locked" | "save-error" | "refresh-error";
export type { MaterialEditorFieldErrors } from "@/domain/workOrderValidation";

export type MaterialEditorViewState = {
  readonly token: number;
  readonly mode: MaterialEditorMode;
  readonly workOrderId: string;
  readonly materialLineId: string | null;
  readonly materialType: MaterialType;
  readonly base: MaterialDraftFields;
  readonly draft: MaterialDraftFields;
  readonly fieldErrors: MaterialEditorFieldErrors;
  readonly saveState: MaterialEditorSaveState;
  readonly saveMessage: string | null;
  readonly conflictVersion: number | null;
  readonly idempotencyKey: string;
  readonly committedNextVersion: number | null;
};

type Props = {
  readonly state: MaterialEditorViewState;
  readonly dirty: boolean;
  readonly onChange: (field: keyof MaterialDraftFields, value: string) => void;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onReloadLatest: () => void;
  readonly partnerOptions: readonly MaterialPartnerOption[];
  readonly showChrome?: boolean;
};

type FieldProps = {
  readonly label: string;
  readonly field: keyof MaterialDraftFields;
  readonly state: MaterialEditorViewState;
  readonly onChange: Props["onChange"];
  readonly keyboardType?: "default" | "decimal-pad" | "number-pad";
  readonly multiline?: boolean;
  readonly placeholder: string;
  readonly maxLength: number;
};

type ReelEditorTarget = { readonly field: MaterialReelField; readonly label: string; readonly value: string };

function EditorField({ label, field, state, onChange, keyboardType = "default", multiline = false, placeholder, maxLength }: FieldProps) {
  const disabled = state.saveState === "saving" || state.saveState === "locked" || state.saveState === "refresh-error";
  const numeric = keyboardType === "number-pad" || keyboardType === "decimal-pad";
  return (
    <WaflSheetFocusBlock style={[styles.field, multiline && styles.fieldWide]}>
      <Text style={styles.label}>{label}</Text>
      <WaflSheetTextInput
        accessibilityLabel={`${label} 입력`}
        editable={!disabled}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onBlur={() => {
          if (numeric && !state.draft[field].trim()) onChange(field, normalizeNumericCommitValue(state.draft[field]));
        }}
        onChangeText={(value) => onChange(field, numeric ? normalizeNumericDraft(value) : value)}
        onFocus={() => {
          if (numeric) onChange(field, prepareNumericDraftOnFocus(state.draft[field]));
        }}
        placeholder={placeholder}
        placeholderTextColor="#a09387"
        style={[styles.input, multiline && styles.inputMultiline, state.fieldErrors[field] && styles.inputInvalid]}
        value={state.draft[field]}
      />
      {state.fieldErrors[field] ? <Text style={styles.fieldError}>{state.fieldErrors[field]}</Text> : null}
      {(field === "usageArea" || field === "memo") ? <WaflCharacterCounter current={state.draft[field].length} maximum={maxLength} /> : null}
    </WaflSheetFocusBlock>
  );
}

export default function WorkOrderMaterialEditor({ state, dirty, onChange, onCancel, onSave, onReloadLatest, partnerOptions, showChrome = true }: Props) {
  const [reelTarget, setReelTarget] = useState<ReelEditorTarget | null>(null);
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);
  const saving = state.saveState === "saving";
  const saveBlocked = !dirty || saving || state.saveState === "locked" || state.saveState === "conflict" || state.saveState === "refresh-error";
  const reloadAvailable = state.saveState === "conflict" || state.saveState === "locked" || state.saveState === "refresh-error";
  const calculatedOrderQuantity = calculateOrderQuantity(state.draft);
  const calculatedAmount = calculateMaterialAmount(calculatedOrderQuantity, state.draft.unitPrice);
  const materialLabel = state.materialType === "accessory" ? "부자재" : "원단";
  const materialNameLabel = `${materialLabel}명`;
  const partnerName = partnerOptions.find((item) => item.id === state.draft.partnerId)?.name ?? WAFL_UNSET_PLACEHOLDER;

  return (
    <View testID="material-draft-editor" style={styles.editor}>
      {reelTarget ? (
        <WaflReelPickerSheet
          field={reelTarget.field}
          kind={reelTarget.field === "unitCode" ? "unit" : "quantity"}
          label={reelTarget.label}
          onApply={(value, unitCode) => {
            const patch = materialReelDraftPatch({ field: reelTarget.field, value, unitCode, currentUnitCode: state.draft.unitCode });
            for (const [field, nextValue] of Object.entries(patch) as [keyof MaterialDraftFields, string][]) onChange(field, nextValue);
            setReelTarget(null);
          }}
          onCancel={() => setReelTarget(null)}
          unitCode={state.draft.unitCode}
          value={reelTarget.value}
          visible
        />
      ) : null}
      <MaterialPartnerPickerSheet
        allowUnset
        items={partnerOptions}
        onCancel={() => setPartnerPickerOpen(false)}
        onSelect={(partnerId) => { onChange("partnerId", partnerId); setPartnerPickerOpen(false); }}
        onUnset={() => { onChange("partnerId", ""); setPartnerPickerOpen(false); }}
        selectedId={state.draft.partnerId}
        visible={partnerPickerOpen}
      />
      {showChrome ? <View style={styles.header}>
        <Pressable accessibilityLabel={`${materialLabel} 편집 취소`} accessibilityRole="button" disabled={saving} onPress={onCancel} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><X color="#3f352d" size={20} /></Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{state.mode === "create" ? `${materialLabel} 추가` : `${materialLabel} 수정`}</Text>
          <Text style={styles.caption}>초안 레시피에 명시적으로 저장합니다.</Text>
        </View>
        <Text style={styles.unsavedBadge}>{dirty ? "저장 전" : "변경 없음"}</Text>
      </View> : null}

      <View style={styles.fields}>
        <EditorField field="name" label={materialNameLabel} maxLength={200} onChange={onChange} placeholder={`${materialNameLabel}을 입력하세요`} state={state} />
        <EditorField field="colorOption" label={MOBILE_MATERIAL_FIELD_LABELS.colorOption} maxLength={200} onChange={onChange} placeholder="예: NAVY" state={state} />
        <View style={styles.field}>
          <Text style={styles.label}>거래처</Text>
          <Pressable
            accessibilityLabel={`거래처, ${partnerName}`}
            accessibilityRole="button"
            disabled={saving}
            onPress={() => setPartnerPickerOpen(true)}
            style={({ pressed }) => [styles.reelField, state.fieldErrors.partnerId && styles.inputInvalid, pressed && styles.pressed]}
          >
            <Text numberOfLines={1} style={styles.reelFieldValue}>{partnerName}</Text>
            <ChevronDown color="#9b4a27" size={17} />
          </Pressable>
          {state.fieldErrors.partnerId ? <Text style={styles.fieldError}>{state.fieldErrors.partnerId}</Text> : null}
        </View>
        <EditorField field="unitPrice" keyboardType="number-pad" label={MOBILE_MATERIAL_FIELD_LABELS.unitPrice} maxLength={16} onChange={onChange} placeholder="0" state={state} />
        {([
          { field: "unitCode", label: "단위", value: state.draft.unitCode || "단위 선택", reelValue: state.draft.requiredQuantity },
          { field: "requiredQuantity", label: MOBILE_MATERIAL_FIELD_LABELS.requiredQuantity, value: formatQuantity(state.draft.requiredQuantity, state.draft.unitCode), reelValue: state.draft.requiredQuantity },
          { field: "allowanceQuantity", label: MOBILE_MATERIAL_FIELD_LABELS.allowanceQuantity, value: formatQuantity(state.draft.allowanceQuantity, state.draft.unitCode), reelValue: state.draft.allowanceQuantity },
        ] as const).map((item) => (
          <View key={item.field} style={styles.field}>
            <Text style={styles.label}>{item.label}</Text>
            <Pressable
              accessibilityLabel={`${item.label}, 릴 피커로 수정`}
              accessibilityRole="button"
              disabled={saving}
              onPress={() => setReelTarget({ field: item.field, label: item.label, value: item.reelValue })}
              style={({ pressed }) => [styles.reelField, pressed && styles.pressed]}
            >
              <Text numberOfLines={1} style={styles.reelFieldValue}>{item.value}</Text>
              <SlidersVertical color="#9b4a27" size={17} />
            </Pressable>
            {state.fieldErrors[item.field] ? <Text style={styles.fieldError}>{state.fieldErrors[item.field]}</Text> : null}
          </View>
        ))}
        <View accessibilityLabel="발주수량, 자동 계산, 읽기 전용" style={styles.field}>
          <Text style={styles.label}>발주수량</Text>
          <View style={styles.calculatedValue}>
            <MaterialQuantityValue textStyle={styles.calculatedText} unitCode={state.draft.unitCode} value={calculatedOrderQuantity} />
          </View>
        </View>
        <View accessibilityLabel="금액, 자동 계산, 읽기 전용" style={styles.field}>
          <Text style={styles.label}>금액</Text>
          <View style={styles.calculatedValue}><Text style={styles.calculatedText}>{formatWon(calculatedAmount)}</Text></View>
        </View>
        <EditorField field="usageArea" label="사용부위" maxLength={MATERIAL_USAGE_AREA_MAX_LENGTH} multiline onChange={onChange} placeholder="사용부위를 입력하세요" state={state} />
        <EditorField field="memo" label="메모" maxLength={MATERIAL_MEMO_MAX_LENGTH} multiline onChange={onChange} placeholder="메모를 입력하세요" state={state} />
      </View>

      {reloadAvailable ? (
        <Pressable accessibilityRole="button" onPress={onReloadLatest} style={styles.reloadButton}>
          <Text style={styles.reloadText}>{state.saveState === "refresh-error" ? "저장 결과 다시 확인" : "최신 내용 불러오기"}</Text>
        </Pressable>
      ) : null}

      {showChrome ? <View style={styles.actions}>
        <Pressable accessibilityLabel={`${materialLabel} 변경 취소`} accessibilityRole="button" disabled={saving} onPress={onCancel} style={styles.cancelButton}><X color="#5d5147" size={20} /></Pressable>
        <Pressable accessibilityLabel={`${materialLabel} 저장`} accessibilityRole="button" disabled={saveBlocked} onPress={onSave} style={[styles.saveButton, saveBlocked && styles.saveButtonDisabled]}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Save color="#fff" size={16} />}
        </Pressable>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { backgroundColor: WAFL_THEME.color.paper, padding: WAFL_THEME.layout.cardPadding },
  header: { alignItems: "center", borderBottomColor: "#eadfce", borderBottomWidth: 1, flexDirection: "row", gap: 9, paddingBottom: 10 },
  backButton: { alignItems: "center", justifyContent: "center", minHeight: 44, width: 44 },
  headerText: { flex: 1, minWidth: 0 },
  title: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 16 },
  caption: { color: "#7c7065", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 15, marginTop: 1 },
  unsavedBadge: { backgroundColor: "#f2e6d8", borderRadius: 999, color: "#7a482d", fontFamily: WAFL_FONTS.bold, fontSize: 9, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 4 },
  fields: { flexDirection: "row", flexWrap: "wrap", gap: 9, paddingVertical: 12 },
  field: { flexBasis: "47%", flexGrow: 1, minWidth: 138 },
  fieldWide: { flexBasis: "100%" },
  label: { color: "#62574e", fontFamily: WAFL_FONTS.semibold, fontSize: 11, marginBottom: 4 },
  input: { backgroundColor: "#fff", borderColor: "#d9cdbf", borderRadius: 8, borderWidth: 1, color: "#2f2924", fontFamily: WAFL_FONTS.medium, fontSize: 13, minHeight: 44, paddingHorizontal: 10, paddingVertical: 9 },
  inputMultiline: { minHeight: 68, textAlignVertical: "top" },
  inputInvalid: { borderColor: "#b54b43", backgroundColor: "#fff9f7" },
  reelField: { alignItems: "center", backgroundColor: "#fffaf2", borderColor: "#d9cdbf", borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 10 },
  reelFieldValue: { color: "#2f2924", flex: 1, fontFamily: WAFL_FONTS.bold, fontSize: 13, minWidth: 0 },
  calculatedValue: { backgroundColor: "#f4efe7", borderColor: "#ddd2c5", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  calculatedText: { color: "#5f554c", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  fieldError: { color: "#a33b35", fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 15, marginTop: 3 },
  reloadButton: { alignItems: "center", alignSelf: "flex-start", borderColor: "#b9aa9a", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 12 },
  reloadText: { color: "#584b41", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", paddingTop: 10 },
  cancelButton: { alignItems: "center", borderColor: "#cfc2b4", borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 44, width: 48 },
  saveButton: { alignItems: "center", backgroundColor: "#17263d", borderRadius: 9, justifyContent: "center", minHeight: 44, width: 48 },
  saveButtonDisabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
});
