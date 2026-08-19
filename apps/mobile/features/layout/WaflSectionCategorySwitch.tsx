import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export type WaflSectionCategoryOption<T extends string> = { readonly value: T; readonly label: string; readonly count?: number; readonly badgeTone?: { readonly background: string; readonly border: string; readonly foreground: string } };

export default function WaflSectionCategorySwitch<T extends string>({ action, onSelect, optionTestIDPrefix, options, selected, testID }: { readonly action?: ReactNode; readonly onSelect: (value: T) => void; readonly optionTestIDPrefix?: string; readonly options: readonly WaflSectionCategoryOption<T>[]; readonly selected: T; readonly testID?: string }) {
  return <View style={styles.container} testID={testID}><View style={styles.choices}>{options.map((option) => {
    const active = option.value === selected;
    return <Pressable accessibilityLabel={`${option.label}${option.count === undefined ? "" : ` ${option.count}개`}`} accessibilityRole="button" accessibilityState={{ selected: active }} key={option.value} onPress={() => onSelect(option.value)} style={({ pressed }) => [styles.choice, active && styles.choiceSelected, pressed && styles.pressed]} testID={optionTestIDPrefix ? `${optionTestIDPrefix}-${option.value}` : undefined}><Text style={[styles.label, active && styles.labelSelected]}>{option.label}</Text>{option.count === undefined ? null : <View style={[styles.badge, option.badgeTone ? { backgroundColor: option.badgeTone.background, borderColor: option.badgeTone.border } : null]}><Text style={[styles.badgeText, option.badgeTone ? { color: option.badgeTone.foreground } : null]}>{option.count}</Text></View>}</Pressable>;
  })}</View>{action}</View>;
}

const styles = StyleSheet.create({
  container: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, flexDirection: "row", justifyContent: "space-between", minHeight: WAFL_THEME.touch.minimum, paddingBottom: WAFL_THEME.layout.tightGap },
  choices: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.controlGap },
  choice: { alignItems: "center", borderBottomColor: "transparent", borderBottomWidth: WAFL_THEME.border.active, borderRadius: WAFL_THEME.radius.field, flexDirection: "row", gap: WAFL_THEME.layout.tightGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.layout.controlGap },
  choiceSelected: { backgroundColor: WAFL_THEME.color.fabricBeige, borderBottomColor: WAFL_THEME.color.editActive },
  label: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyStrong.fontSize, lineHeight: WAFL_THEME.typography.bodyStrong.lineHeight },
  labelSelected: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold },
  badge: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.pill, borderWidth: WAFL_THEME.border.hairline, justifyContent: "center", minHeight: 20, minWidth: 20, paddingHorizontal: WAFL_THEME.layout.tightGap },
  badgeText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.badge.fontSize, lineHeight: WAFL_THEME.typography.badge.lineHeight },
  pressed: { opacity: 0.68 },
});
