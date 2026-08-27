import { StyleSheet, Text, View, type KeyboardTypeOptions, type TextInput, type TextInputProps } from "react-native";
import type { Ref } from "react";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import WaflSheetTextInput, { WaflSheetFocusBlock } from "./WaflSheetTextInput";

type Props = {
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly editable?: boolean;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly autoFocus?: boolean;
  readonly multiline?: boolean;
  readonly maxLength?: number;
  readonly autoCorrect?: boolean;
  readonly returnKeyType?: TextInputProps["returnKeyType"];
  readonly submitBehavior?: TextInputProps["submitBehavior"];
  readonly inputAccessoryViewID?: string;
  readonly errorMessage?: string | null;
  readonly helpText?: string | null;
  readonly inputRef?: Ref<TextInput>;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
  readonly onSubmitEditing?: () => void;
  readonly onChange?: (value: string) => void;
};

export default function WaflSheetValueField({
  label,
  value,
  placeholder,
  editable = true,
  keyboardType = "default",
  autoFocus = false,
  multiline = false,
  maxLength,
  autoCorrect,
  returnKeyType,
  submitBehavior,
  inputAccessoryViewID,
  errorMessage = null,
  helpText = null,
  inputRef,
  onFocus,
  onBlur,
  onSubmitEditing,
  onChange,
}: Props) {
  return <WaflSheetFocusBlock style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {editable ? <WaflSheetTextInput
      accessibilityLabel={`${label} 입력`}
      autoCapitalize="none"
      autoFocus={autoFocus}
      autoCorrect={autoCorrect}
      keyboardType={keyboardType}
      inputAccessoryViewID={inputAccessoryViewID}
      maxLength={maxLength}
      multiline={multiline}
      onChangeText={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      onSubmitEditing={onSubmitEditing}
      placeholder={placeholder}
      placeholderTextColor={WAFL_THEME.color.disabled}
      ref={inputRef}
      returnKeyType={returnKeyType}
      submitBehavior={submitBehavior}
      style={[styles.surface, styles.editable, multiline && styles.multiline, errorMessage && styles.invalid]}
      value={value}
    /> : <View accessibilityLabel={`${label}, 읽기 전용`} style={[styles.surface, styles.readOnly]}>
      <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder}</Text>
    </View>}
    {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : helpText ? <Text style={styles.help}>{helpText}</Text> : null}
  </WaflSheetFocusBlock>;
}

const styles = StyleSheet.create({
  field: { gap: WAFL_THEME.spacing.xs },
  label: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.meta.fontSize },
  surface: { backgroundColor: WAFL_THEME.color.paperMuted, borderRadius: WAFL_THEME.radius.field, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.spacing.md },
  editable: { borderBottomColor: WAFL_THEME.color.editActive, borderBottomWidth: WAFL_THEME.border.hairline, color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.body, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  readOnly: { justifyContent: "center" },
  value: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  placeholder: { color: WAFL_THEME.color.disabled },
  multiline: { minHeight: 76, paddingTop: WAFL_THEME.spacing.sm, textAlignVertical: "top" },
  invalid: { backgroundColor: "#fff9f7", borderBottomColor: WAFL_THEME.color.error },
  error: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.caption, lineHeight: 16 },
  help: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.regular, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
});
