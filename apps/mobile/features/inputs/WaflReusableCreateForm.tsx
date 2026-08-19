import type { ReactNode, Ref } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type TextInput, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import WaflSheetValueField from "./WaflSheetValueField";

type Props = {
  readonly backLabel: string;
  readonly fieldLabel: string;
  readonly helpText?: string;
  readonly inputRef?: Ref<TextInput>;
  readonly maxLength: number;
  readonly placeholder: string;
  readonly value: string;
  readonly pending: boolean;
  readonly children?: ReactNode;
  readonly onBack: () => void;
  readonly onChange: (value: string) => void;
  readonly onCreate: () => void;
};

export default function WaflReusableCreateForm(props: Props) {
  const disabled = props.pending || !props.value.trim();
  return <View style={styles.root}>
    <Pressable accessibilityLabel={`${props.backLabel}으로 돌아가기`} onPress={props.onBack} style={styles.backButton}>
      <ChevronLeft color={WAFL_THEME.color.navyInk} size={18} />
      <Text style={styles.backText}>{props.backLabel}</Text>
    </Pressable>
    <WaflSheetValueField
      helpText={props.helpText}
      inputRef={props.inputRef}
      label={props.fieldLabel}
      maxLength={props.maxLength}
      onChange={props.onChange}
      placeholder={props.placeholder}
      value={props.value}
    />
    {props.children}
    <Pressable accessibilityLabel="추가" accessibilityRole="button" accessibilityState={{ busy: props.pending, disabled }} disabled={disabled} onPress={props.onCreate} style={({ pressed }) => [styles.createButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}>
      {props.pending ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>추가</Text>}
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { gap: WAFL_THEME.layout.controlGap, paddingTop: WAFL_THEME.spacing.sm },
  backButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", minHeight: WAFL_THEME.touch.minimum, paddingRight: WAFL_THEME.spacing.md },
  backText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  createButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: WAFL_THEME.radius.field, justifyContent: "center", minHeight: 46, width: "100%" },
  createText: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.76 },
});
