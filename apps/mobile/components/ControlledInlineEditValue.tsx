import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Check, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { normalizeNumericDraft, prepareNumericDraftOnFocus } from "@/lib/mobileDisplay";

type Props = {
  readonly accessibilityLabel: string;
  readonly active: boolean;
  readonly editable: boolean;
  readonly displayValue: string;
  readonly value: string;
  readonly placeholder: string;
  readonly onActivate: () => void;
  readonly onChange: (value: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly saving?: boolean;
  readonly dirty?: boolean;
  readonly invalid?: boolean;
  readonly errorMessage?: string | null;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly maxLength?: number;
  readonly multiline?: boolean;
  readonly selectTextOnFocus?: boolean;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly displayStyle?: StyleProp<TextStyle>;
  readonly inputStyle?: StyleProp<TextStyle>;
  readonly numberOfLines?: number;
  readonly testID?: string;
  readonly onFocusTarget?: (target: TextInput) => void;
};

export default function ControlledInlineEditValue({
  accessibilityLabel,
  active,
  editable,
  displayValue,
  value,
  placeholder,
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
  selectTextOnFocus = false,
  containerStyle,
  displayStyle,
  inputStyle,
  numberOfLines = 2,
  testID,
  onFocusTarget,
}: Props) {
  const inputRef = useRef<TextInput>(null);
  const numeric = keyboardType === "number-pad" || keyboardType === "decimal-pad" || keyboardType === "numeric";
  const activationRef = useRef({ numeric, onChange, value });

  useEffect(() => {
    activationRef.current = { numeric, onChange, value };
  }, [numeric, onChange, value]);

  useEffect(() => {
    if (!active) return undefined;
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
  const saveDisabled = !dirty || saving || emptyNumericDraft;

  if (!active) {
    if (!editable) {
      return (
        <View style={containerStyle} testID={testID}>
          <Text numberOfLines={numberOfLines} style={displayStyle}>{displayValue || placeholder}</Text>
        </View>
      );
    }
    return (
      <Pressable
        accessibilityHint="값을 같은 위치에서 수정합니다"
        accessibilityLabel={`${accessibilityLabel}, 수정 가능`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onActivate}
        style={({ pressed }) => [styles.editable, containerStyle, pressed && styles.pressed]}
        testID={testID}
      >
        <Text numberOfLines={numberOfLines} style={[displayStyle, !displayValue && styles.placeholder]}>{displayValue || placeholder}</Text>
      </Pressable>
    );
  }

  return (
    <View accessibilityLabel={`${accessibilityLabel} 입력 중`} style={[styles.active, containerStyle]} testID={testID}>
      <TextInput
        ref={inputRef}
        accessibilityLabel={`${accessibilityLabel} 입력`}
        editable={!saving}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={(nextValue) => onChange(numeric ? normalizeNumericDraft(nextValue) : nextValue)}
        onFocus={() => {
          if (inputRef.current) onFocusTarget?.(inputRef.current);
        }}
        placeholder={emptyNumericDraft ? "0" : placeholder}
        returnKeyType={multiline ? "default" : "done"}
        selectTextOnFocus={selectTextOnFocus}
        style={[styles.input, styles.inputWithActions, multiline && styles.inputMultiline, displayStyle, inputStyle, invalid && styles.inputInvalid]}
        textAlignVertical={multiline ? "top" : "center"}
        value={value}
      />
      {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityHint={`${accessibilityLabel} 입력을 취소합니다`} accessibilityLabel="변경 취소" accessibilityRole="button" disabled={saving} onPress={onCancel} style={styles.cancel}>
          <X color="#554a40" size={18} strokeWidth={2.4} />
        </Pressable>
        <Pressable
          accessibilityHint={`${accessibilityLabel} 입력을 저장합니다`}
          accessibilityLabel="변경 저장"
          accessibilityRole="button"
          accessibilityState={{ disabled: saveDisabled }}
          disabled={saveDisabled}
          onPress={onSave}
          style={[styles.save, saveDisabled && styles.disabled]}
        >
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Check color="#fff" size={18} strokeWidth={2.5} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editable: { backgroundColor: "#fffaf2", borderBottomColor: "#b98c5a", borderBottomWidth: 1, borderRadius: 5, minHeight: 36, paddingHorizontal: 4, paddingVertical: 3 },
  pressed: { backgroundColor: "#f7ead9", opacity: 0.82 },
  placeholder: { color: "#9b9288" },
  active: { backgroundColor: "#fff9ed", borderColor: "#8b5e3c", borderRadius: 7, borderWidth: 1, minHeight: 54, minWidth: 0, padding: 4, position: "relative", width: "100%" },
  input: { color: "#17263d", minHeight: 44, minWidth: 0, paddingHorizontal: 6, paddingVertical: 4 },
  inputWithActions: { paddingRight: 98 },
  inputMultiline: { minHeight: 76, paddingTop: 8 },
  inputInvalid: { borderBottomColor: "#b74b43", borderBottomWidth: 1 },
  error: { color: "#a13933", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 14 },
  actions: { alignItems: "center", flexDirection: "row", gap: 4, position: "absolute", right: 4, top: 4 },
  cancel: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#baa997", borderRadius: 7, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  save: { alignItems: "center", backgroundColor: "#23375a", borderRadius: 7, height: 44, justifyContent: "center", width: 44 },
  disabled: { opacity: 0.4 },
});
