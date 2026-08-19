import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type NativeSyntheticEvent,
  type StyleProp,
  type TextInputChangeEventData,
  type TextInputEndEditingEventData,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Check, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import {
  WAFL_EDITABLE_VALUE_FOCUSED_SURFACE,
  WAFL_EDITABLE_VALUE_SURFACE,
  WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE,
  WAFL_TABLE_EDITABLE_CELL_SURFACE,
} from "@/components/waflEditableValueSurface";
import {
  createInlineEditFinalizationController,
  decideInlineEditCommit,
  type InlineEditValueSemantics,
} from "@/lib/inlineEditFinalization";
import {
  normalizeNumericCommitValue,
  normalizeNumericDraft,
  prepareNumericDraftOnFocus,
} from "@/lib/mobileDisplay";

type Props = {
  readonly accessibilityLabel: string;
  readonly active: boolean;
  readonly editable: boolean;
  readonly displayValue: string;
  readonly value: string;
  readonly placeholder: string;
  readonly displayPlaceholder?: string;
  readonly onActivate: () => void;
  readonly onChange: (value: string) => void;
  readonly onSave: (finalizedValue: string) => void;
  readonly onCancel: () => void;
  readonly saving?: boolean;
  readonly dirty?: boolean;
  readonly invalid?: boolean;
  readonly errorMessage?: string | null;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly maxLength?: number;
  readonly multiline?: boolean;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly displayStyle?: StyleProp<TextStyle>;
  readonly inputStyle?: StyleProp<TextStyle>;
  readonly numberOfLines?: number | null;
  readonly testID?: string;
  readonly onFocusTarget?: (target: TextInput) => void;
  readonly commitMode?: "explicit" | "blur-submit";
  readonly valueSemantics?: InlineEditValueSemantics;
  readonly presentation?: "default" | "tableCell";
};

export default function ControlledInlineEditValue({
  accessibilityLabel,
  active,
  editable,
  displayValue,
  value,
  placeholder,
  displayPlaceholder,
  onActivate,
  onChange,
  onSave,
  onCancel,
  saving = false,
  dirty = false,
  invalid = false,
  errorMessage = null,
  keyboardType = "default",
  maxLength,
  multiline = false,
  containerStyle,
  displayStyle,
  inputStyle,
  numberOfLines = 2,
  testID,
  onFocusTarget,
  commitMode = "explicit",
  valueSemantics,
  presentation = "default",
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const finalizationRef = useRef(createInlineEditFinalizationController(value));
  const cancelingRef = useRef(false);
  const wasSavingRef = useRef(saving);
  const activationValueRef = useRef(value);
  const [finalizing, setFinalizing] = useState(false);
  const [nativeDirty, setNativeDirty] = useState(false);
  const numeric = keyboardType === "number-pad" || keyboardType === "decimal-pad" || keyboardType === "numeric";
  const semantics = valueSemantics ?? (numeric ? "numeric" : "text");
  const inlineCommit = commitMode === "blur-submit";
  const activationRef = useRef({ numeric, onChange, value });

  useEffect(() => {
    activationRef.current = { numeric, onChange, value };
    finalizationRef.current.observe(value);
  }, [numeric, onChange, value]);

  useEffect(() => {
    if (wasSavingRef.current && !saving && active) {
      finalizationRef.current.reset(value);
    }
    wasSavingRef.current = saving;
  }, [active, saving, value]);

  useEffect(() => {
    if (!active) {
      cancelingRef.current = false;
      return undefined;
    }
    let focusFrame: number | null = null;
    const prepareFrame = requestAnimationFrame(() => {
      const activation = activationRef.current;
      const preparedValue = activation.numeric ? prepareNumericDraftOnFocus(activation.value) : activation.value;
      if (preparedValue !== activation.value) {
        activation.onChange(preparedValue);
        focusFrame = requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      inputRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(prepareFrame);
      if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    };
  }, [active]);

  const emptyNumericDraft = numeric && value.trim() === "";
  const saveDisabled = (!dirty && !nativeDirty) || saving || finalizing;
  const displayLineLimit = numberOfLines === null ? undefined : numberOfLines;

  function normalizedNativeText(nextValue: string) {
    if (!numeric) return nextValue;
    const normalized = normalizeNumericDraft(nextValue);
    return /^\d*(?:\.\d*)?$/u.test(normalized) ? normalized : value;
  }

  function finalizePendingSave(nativeValue: string) {
    const finalizedValue = numeric ? normalizeNumericCommitValue(nativeValue) : nativeValue;
    finalizationRef.current.observe(finalizedValue);
    if (finalizedValue !== value) onChange(finalizedValue);
    const result = finalizationRef.current.finalize(finalizedValue);
    setFinalizing(false);
    setNativeDirty(false);
    if (!result.shouldSave) return;
    const decision = decideInlineEditCommit({
      activationValue: activationValueRef.current,
      draftValue: result.value,
      semantics,
    });
    if (!decision.changed) {
      onCancel();
      return;
    }
    onSave(decision.value);
  }

  function handleNativeChange(event: NativeSyntheticEvent<TextInputChangeEventData>) {
    const nativeValue = normalizedNativeText(event.nativeEvent.text);
    finalizationRef.current.observe(nativeValue);
    setNativeDirty(nativeValue !== activationValueRef.current);
  }

  function handleEndEditing(event: NativeSyntheticEvent<TextInputEndEditingEventData>) {
    if (cancelingRef.current) {
      cancelingRef.current = false;
      return;
    }
    if (inlineCommit) finalizationRef.current.requestSave();
    finalizePendingSave(event.nativeEvent.text);
  }

  function handleSaveRequest() {
    if (!finalizationRef.current.requestSave()) return;
    setFinalizing(true);
    if (inputRef.current?.isFocused()) {
      inputRef.current.blur();
      return;
    }
    finalizePendingSave(value);
  }

  function handleSubmitEditing() {
    if (!inlineCommit || multiline) return;
    if (!finalizationRef.current.requestSave()) return;
    if (inputRef.current?.isFocused()) {
      inputRef.current.blur();
      return;
    }
    finalizePendingSave(value);
  }

  function handleCancel() {
    cancelingRef.current = true;
    finalizationRef.current.cancel();
    setFinalizing(false);
    setNativeDirty(false);
    inputRef.current?.blur();
    onCancel();
  }

  function handleActivate() {
    activationValueRef.current = value;
    finalizationRef.current.reset(value);
    cancelingRef.current = false;
    setFinalizing(false);
    setNativeDirty(false);
    onActivate();
  }

  if (!active) {
    if (!editable) {
      return (
        <View style={containerStyle} testID={testID}>
          <Text numberOfLines={displayLineLimit} style={[displayStyle, !displayValue && styles.placeholder]}>{displayValue || displayPlaceholder || placeholder}</Text>
        </View>
      );
    }
    return (
      <Pressable
        accessibilityHint="값을 같은 위치에서 수정합니다"
        accessibilityLabel={`${accessibilityLabel}, 수정 가능`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={handleActivate}
        style={({ pressed }) => [presentation === "tableCell" ? WAFL_TABLE_EDITABLE_CELL_SURFACE : styles.editable, containerStyle, pressed && styles.pressed]}
        testID={testID}
      >
        <Text numberOfLines={displayLineLimit} style={[displayStyle, !displayValue && styles.placeholder]}>{displayValue || displayPlaceholder || placeholder}</Text>
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={`${accessibilityLabel} 입력 중`} style={[presentation === "tableCell" ? WAFL_TABLE_EDITABLE_CELL_FOCUSED_SURFACE : multiline ? styles.activeMultiline : WAFL_EDITABLE_VALUE_FOCUSED_SURFACE, containerStyle]} testID={testID}>
      <TextInput
        ref={inputRef}
        accessibilityLabel={`${accessibilityLabel} 입력`}
        editable={!saving}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChange={handleNativeChange}
        onChangeText={(nextValue) => {
          const normalizedValue = normalizedNativeText(nextValue);
          finalizationRef.current.observe(normalizedValue);
          onChange(normalizedValue);
        }}
        onEndEditing={handleEndEditing}
        onFocus={() => {
          if (inputRef.current) onFocusTarget?.(inputRef.current);
        }}
        onSubmitEditing={inlineCommit && !multiline ? handleSubmitEditing : undefined}
        placeholder={emptyNumericDraft ? "0" : placeholder}
        returnKeyType={numeric ? undefined : multiline ? "default" : "done"}
        submitBehavior={numeric ? undefined : multiline ? "newline" : inlineCommit ? "blurAndSubmit" : "submit"}
        style={[styles.input, !multiline && styles.inputSingleLine, presentation === "tableCell" && styles.tableCellInput, !inlineCommit && styles.inputWithActions, multiline && styles.inputMultiline, displayStyle, inputStyle, invalid && styles.inputInvalid]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
      {!inlineCommit ? <View style={styles.actions}>
        <Pressable accessibilityHint={`${accessibilityLabel} 입력을 취소합니다`} accessibilityLabel="변경 취소" accessibilityRole="button" disabled={saving || finalizing} onPress={handleCancel} style={styles.cancel}>
          <X color="#554a40" size={18} strokeWidth={2.4} />
        </Pressable>
        <Pressable
          accessibilityHint={`${accessibilityLabel} 입력을 저장합니다`}
          accessibilityLabel="변경 저장"
          accessibilityRole="button"
          accessibilityState={{ disabled: saveDisabled }}
          disabled={saveDisabled}
          onPress={handleSaveRequest}
          style={[styles.save, saveDisabled && styles.disabled]}
        >
          {saving || finalizing ? <ActivityIndicator color="#fff" size="small" /> : <Check color="#fff" size={18} strokeWidth={2.5} />}
        </Pressable>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editable: WAFL_EDITABLE_VALUE_SURFACE,
  pressed: { backgroundColor: "#f7ead9", opacity: 0.82 },
  placeholder: { color: "#9b9288" },
  activeMultiline: { backgroundColor: "#fff9ed", borderBottomColor: WAFL_THEME.color.editActive, borderBottomWidth: WAFL_THEME.border.hairline, borderRadius: WAFL_THEME.radius.field, minHeight: 76, minWidth: 0, paddingHorizontal: WAFL_THEME.spacing.xs, paddingVertical: 3, position: "relative", width: "100%" },
  input: { color: WAFL_THEME.color.deepNavy, minWidth: 0 },
  inputSingleLine: { minHeight: 30, paddingHorizontal: 0, paddingVertical: 0 },
  tableCellInput: { height: WAFL_THEME.layout.frozenTableEditableValueHeight, minHeight: WAFL_THEME.layout.frozenTableEditableValueHeight, paddingHorizontal: WAFL_THEME.spacing.xs, paddingVertical: 0, width: "100%" },
  inputWithActions: { paddingRight: 98 },
  inputMultiline: { minHeight: 76, paddingTop: 8 },
  inputInvalid: { borderBottomColor: "#b74b43", borderBottomWidth: 1 },
  error: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.regular, fontSize: WAFL_THEME.typography.caption, lineHeight: 14 },
  actions: { alignItems: "center", flexDirection: "row", gap: 4, position: "absolute", right: 4, top: 4 },
  cancel: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#baa997", borderRadius: 7, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  save: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: WAFL_THEME.radius.field, height: 44, justifyContent: "center", width: 44 },
  disabled: { opacity: 0.4 },
});
