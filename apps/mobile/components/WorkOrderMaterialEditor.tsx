import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowLeft, Save } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import type { MaterialDraftFields } from "@/lib/apiTypes";
import { calculateMaterialAmount, calculateOrderQuantity, formatQuantity, formatWon } from "@/lib/mobileDisplay";

export type MaterialEditorMode = "create" | "edit";
export type MaterialEditorSaveState = "editing" | "saving" | "validation-error" | "conflict" | "locked" | "save-error" | "refresh-error";
export type MaterialEditorFieldErrors = Partial<Record<keyof MaterialDraftFields, string>>;

export type MaterialEditorViewState = {
  readonly token: number;
  readonly mode: MaterialEditorMode;
  readonly workOrderId: string;
  readonly materialLineId: string | null;
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

function EditorField({ label, field, state, onChange, keyboardType = "default", multiline = false, placeholder, maxLength }: FieldProps) {
  const disabled = state.saveState === "saving" || state.saveState === "locked" || state.saveState === "refresh-error";
  return (
    <View style={[styles.field, multiline && styles.fieldWide]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={`${label} 입력`}
        editable={!disabled}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={(value) => onChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#a09387"
        style={[styles.input, multiline && styles.inputMultiline, state.fieldErrors[field] && styles.inputInvalid]}
        value={state.draft[field]}
      />
      {state.fieldErrors[field] ? <Text style={styles.fieldError}>{state.fieldErrors[field]}</Text> : null}
    </View>
  );
}

export default function WorkOrderMaterialEditor({ state, dirty, onChange, onCancel, onSave, onReloadLatest }: Props) {
  const saving = state.saveState === "saving";
  const saveBlocked = !dirty || saving || state.saveState === "locked" || state.saveState === "conflict" || state.saveState === "refresh-error";
  const reloadAvailable = state.saveState === "conflict" || state.saveState === "locked" || state.saveState === "refresh-error";
  const calculatedOrderQuantity = calculateOrderQuantity(state.draft);
  const calculatedAmount = calculateMaterialAmount(calculatedOrderQuantity, state.draft.unitPrice);

  return (
    <View testID="material-draft-editor" style={styles.editor}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="원단 편집 취소" accessibilityRole="button" disabled={saving} onPress={onCancel} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ArrowLeft color="#3f352d" size={18} />
          <Text style={styles.backText}>취소</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{state.mode === "create" ? "원단 추가" : "원단 수정"}</Text>
          <Text style={styles.caption}>draft 작업지시서에 명시적으로 저장합니다.</Text>
        </View>
        <Text style={styles.unsavedBadge}>{dirty ? "저장 전" : "변경 없음"}</Text>
      </View>

      <View style={styles.fields}>
        <EditorField field="name" label="원단명" maxLength={200} onChange={onChange} placeholder="원단명을 입력하세요" state={state} />
        <EditorField field="colorOption" label="색상·옵션" maxLength={200} onChange={onChange} placeholder="예: NAVY" state={state} />
        <EditorField field="unitCode" label="단위" maxLength={32} onChange={onChange} placeholder="예: yd" state={state} />
        <EditorField field="requiredQuantity" keyboardType="decimal-pad" label="필요수량" maxLength={16} onChange={onChange} placeholder="0" state={state} />
        <EditorField field="allowanceQuantity" keyboardType="decimal-pad" label="로스·여유" maxLength={16} onChange={onChange} placeholder="0" state={state} />
        <EditorField field="inventoryUsageQuantity" keyboardType="decimal-pad" label="재고사용" maxLength={16} onChange={onChange} placeholder="0" state={state} />
        <View accessibilityLabel="발주수량, 자동 계산, 읽기 전용" style={styles.field}>
          <Text style={styles.label}>발주수량</Text>
          <View style={styles.calculatedValue}><Text style={styles.calculatedText}>{formatQuantity(calculatedOrderQuantity, state.draft.unitCode)}</Text></View>
        </View>
        <EditorField field="unitPrice" keyboardType="number-pad" label="단가" maxLength={16} onChange={onChange} placeholder="0" state={state} />
        <View accessibilityLabel="금액, 자동 계산, 읽기 전용" style={styles.field}>
          <Text style={styles.label}>금액</Text>
          <View style={styles.calculatedValue}><Text style={styles.calculatedText}>{formatWon(calculatedAmount)}</Text></View>
        </View>
        <EditorField field="usageArea" label="사용부위" maxLength={1000} multiline onChange={onChange} placeholder="사용부위를 입력하세요" state={state} />
        <EditorField field="memo" label="메모" maxLength={2000} multiline onChange={onChange} placeholder="메모를 입력하세요" state={state} />
      </View>

      {state.saveMessage ? (
        <Text accessibilityRole="alert" style={[styles.message, state.saveState === "conflict" && styles.conflictMessage]}>{state.saveMessage}</Text>
      ) : null}
      {reloadAvailable ? (
        <Pressable accessibilityRole="button" onPress={onReloadLatest} style={styles.reloadButton}>
          <Text style={styles.reloadText}>{state.saveState === "refresh-error" ? "저장 결과 다시 확인" : "최신 내용 불러오기"}</Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={saving} onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>{state.mode === "create" ? "추가 취소" : "취소"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={saveBlocked} onPress={onSave} style={[styles.saveButton, saveBlocked && styles.saveButtonDisabled]}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Save color="#fff" size={16} />}
          <Text style={styles.saveText}>{saving ? "저장 중" : "저장"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { backgroundColor: "#fffdf8", padding: 12 },
  header: { alignItems: "center", borderBottomColor: "#eadfce", borderBottomWidth: 1, flexDirection: "row", gap: 9, paddingBottom: 10 },
  backButton: { alignItems: "center", flexDirection: "row", gap: 3, minHeight: 44, paddingRight: 5 },
  backText: { color: "#3f352d", fontFamily: WAFL_FONTS.semibold, fontSize: 12 },
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
  calculatedValue: { backgroundColor: "#f4efe7", borderColor: "#ddd2c5", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  calculatedText: { color: "#5f554c", fontFamily: WAFL_FONTS.bold, fontSize: 13 },
  fieldError: { color: "#a33b35", fontFamily: WAFL_FONTS.medium, fontSize: 10, lineHeight: 15, marginTop: 3 },
  message: { color: "#8b4526", fontFamily: WAFL_FONTS.semibold, fontSize: 11, lineHeight: 17, paddingVertical: 5 },
  conflictMessage: { color: "#9a352f" },
  reloadButton: { alignItems: "center", alignSelf: "flex-start", borderColor: "#b9aa9a", borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 40, paddingHorizontal: 12 },
  reloadText: { color: "#584b41", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", paddingTop: 10 },
  cancelButton: { alignItems: "center", borderColor: "#cfc2b4", borderRadius: 9, borderWidth: 1, justifyContent: "center", minHeight: 44, minWidth: 96, paddingHorizontal: 14 },
  cancelText: { color: "#5d5147", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  saveButton: { alignItems: "center", backgroundColor: "#17263d", borderRadius: 9, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 44, minWidth: 108, paddingHorizontal: 16 },
  saveButtonDisabled: { opacity: 0.42 },
  saveText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  pressed: { opacity: 0.68 },
});
