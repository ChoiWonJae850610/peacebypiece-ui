import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";

export function WaflCompactField({ children, label }: { readonly children: ReactNode; readonly label: string }) {
  return <View style={waflCompactFieldStyles.field}><Text style={waflCompactFieldStyles.label}>{label}</Text>{children}</View>;
}

export function WaflCompactSelectionField({ accessibilityLabel, editable, label, numberOfLines = 2, onPress, showChevron = false, value }: {
  readonly accessibilityLabel: string;
  readonly editable: boolean;
  readonly label: string;
  readonly numberOfLines?: number;
  readonly onPress: () => void;
  readonly showChevron?: boolean;
  readonly value: string;
}) {
  return <WaflCompactField label={label}><Pressable accessibilityLabel={accessibilityLabel} accessibilityRole={editable ? "button" : undefined} disabled={!editable} onPress={onPress} style={({ pressed }) => [styles.selection, pressed && editable && styles.pressed]}><Text numberOfLines={numberOfLines} style={[styles.value, !value && styles.placeholder]}>{value || WAFL_UNSET_PLACEHOLDER}</Text>{editable && showChevron ? <ChevronRight color={WAFL_THEME.color.readOnly} size={WAFL_THEME.icon.small} /> : null}</Pressable></WaflCompactField>;
}

export const waflCompactFieldStyles = StyleSheet.create({
  field: { flex: 1, minWidth: 0 },
  label: { color: WAFL_THEME.color.disabled, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.compactCardLabel.fontSize, lineHeight: WAFL_THEME.typography.compactCardLabel.lineHeight },
  value: { color: WAFL_THEME.color.deepNavy, flexShrink: 1, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.compactCardValue.fontSize, lineHeight: WAFL_THEME.typography.compactCardValue.lineHeight, marginTop: 1, minWidth: 0 },
  memo: { color: WAFL_THEME.color.navyInk, flexShrink: 1, fontFamily: WAFL_FONTS.body, fontSize: WAFL_THEME.typography.compactCardMemo.fontSize, lineHeight: WAFL_THEME.typography.compactCardMemo.lineHeight, minWidth: 0 },
});

const styles = StyleSheet.create({
  selection: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.tightGap, minHeight: 36, minWidth: 0 },
  value: { ...waflCompactFieldStyles.value, flex: 1 },
  placeholder: { color: WAFL_THEME.color.disabled },
  pressed: { opacity: 0.68 },
});
