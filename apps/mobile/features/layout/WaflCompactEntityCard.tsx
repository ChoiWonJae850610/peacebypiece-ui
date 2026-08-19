import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export function WaflCompactEntityCard({ accentColor, children, style, testID }: { readonly accentColor?: string; readonly children: ReactNode; readonly style?: StyleProp<ViewStyle>; readonly testID?: string }) {
  return <View style={[styles.card, accentColor ? { borderLeftColor: accentColor } : null, style]} testID={testID}>{children}</View>;
}

export function WaflCompactEntityHeader({ expanded, label, onToggle, trailing }: { readonly expanded: boolean; readonly label: string; readonly onToggle: () => void; readonly trailing?: ReactNode }) {
  return <View style={styles.header}>
    <Text numberOfLines={2} style={styles.title}>{label}</Text>
    <View style={styles.headerActions}>{trailing}<Pressable accessibilityLabel={`${label} 상세 ${expanded ? "접기" : "펼치기"}`} accessibilityRole="button" accessibilityState={{ expanded }} hitSlop={8} onPress={onToggle} style={({ pressed }) => [styles.expand, pressed && styles.pressed]}>{expanded ? <ChevronUp color={WAFL_THEME.color.readOnly} size={18} /> : <ChevronDown color={WAFL_THEME.color.readOnly} size={18} />}</Pressable></View>
  </View>;
}

export function WaflCompactEntityExpanded({ children }: { readonly children: ReactNode }) {
  return <View style={styles.expanded}>{children}</View>;
}

export function WaflCompactSummary({ items }: { readonly items: readonly { readonly label: string; readonly value: string }[] }) {
  return <View style={styles.summary} testID="compact-card-summary">{items.map((item) => <View key={item.label} style={styles.summaryItem}><Text style={styles.summaryLabel}>{item.label}</Text><Text numberOfLines={1} style={styles.summaryValue}>{item.value}</Text></View>)}</View>;
}

export function WaflCompactActionRow({ actions, children, testID }: { readonly actions?: ReactNode; readonly children: ReactNode; readonly testID?: string }) {
  return <View style={styles.actionRow} testID={testID}><View style={styles.actionRowCopy}>{children}</View>{actions ? <View style={styles.actionRowActions}>{actions}</View> : null}</View>;
}

export function WaflCompactSummaryLine({ children, numberOfLines = 1, testID }: { readonly children: ReactNode; readonly numberOfLines?: number; readonly testID?: string }) {
  return <Text numberOfLines={numberOfLines} style={styles.summaryLine} testID={testID}>{children}</Text>;
}

export function WaflCompactCardAction({ accessibilityLabel, busy = false, caption, danger = false, emphasized = false, Icon, onPress }: { readonly accessibilityLabel: string; readonly busy?: boolean; readonly caption?: string; readonly danger?: boolean; readonly emphasized?: boolean; readonly Icon: LucideIcon; readonly onPress: () => void }) {
  const color = emphasized ? WAFL_THEME.color.paper : danger ? WAFL_THEME.color.error : WAFL_THEME.color.navyInk;
  return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={onPress} style={({ pressed }) => [styles.action, emphasized && styles.actionEmphasized, danger && styles.actionDanger, busy && styles.disabled, pressed && styles.pressed]}>{busy ? <ActivityIndicator color={color} size="small" /> : <Icon color={color} size={17} strokeWidth={2.25} />}{caption ? <Text style={[styles.actionCaption, emphasized && styles.actionCaptionEmphasized, danger && styles.actionCaptionDanger]}>{caption}</Text> : null}</Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderLeftWidth: WAFL_THEME.accentCard.width, borderRadius: WAFL_THEME.radius.cardCompact, borderWidth: WAFL_THEME.border.hairline, overflow: "hidden" },
  header: { alignItems: "flex-start", flexDirection: "row", gap: WAFL_THEME.layout.tightGap, justifyContent: "space-between", minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal, paddingTop: WAFL_THEME.layout.compactCardInsetVertical },
  title: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.compactCardPrimary.fontSize, lineHeight: WAFL_THEME.typography.compactCardPrimary.lineHeight, minWidth: 0 },
  headerActions: { alignItems: "center", flexDirection: "row", gap: WAFL_THEME.layout.tightGap },
  expand: { alignItems: "center", height: 34, justifyContent: "center", width: 34 },
  expanded: { borderTopColor: WAFL_THEME.color.border, borderTopWidth: WAFL_THEME.border.hairline, paddingHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal, paddingTop: 7 },
  divider: { borderTopColor: WAFL_THEME.color.border, borderTopWidth: WAFL_THEME.border.hairline },
  summary: { borderTopColor: WAFL_THEME.color.border, borderTopWidth: WAFL_THEME.border.hairline, flexDirection: "row", marginHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal, minHeight: 46, paddingVertical: WAFL_THEME.layout.tightGap },
  summaryItem: { flex: 1, justifyContent: "center", minWidth: 0 },
  summaryLabel: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.compactCardLabel.fontSize, lineHeight: WAFL_THEME.typography.compactCardLabel.lineHeight, textAlign: "center" },
  summaryValue: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.compactCardValue.fontSize, fontVariant: ["tabular-nums"], lineHeight: WAFL_THEME.typography.compactCardValue.lineHeight, textAlign: "center" },
  actionRow: { alignItems: "center", borderTopColor: WAFL_THEME.color.border, borderTopWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: WAFL_THEME.layout.controlGap, justifyContent: "space-between", marginHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal, minHeight: 38, paddingVertical: WAFL_THEME.layout.tightGap },
  actionRowCopy: { flex: 1, justifyContent: "center", minWidth: 0 },
  actionRowActions: { alignItems: "center", flexDirection: "row", flexShrink: 0, gap: 3, marginLeft: "auto" },
  summaryLine: { color: WAFL_THEME.color.brickOrange, flexShrink: 1, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.compactCardValue.fontSize, fontVariant: ["tabular-nums"], lineHeight: WAFL_THEME.typography.compactCardValue.lineHeight, minWidth: 0 },
  action: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: 8, borderWidth: WAFL_THEME.border.hairline, flexDirection: "row", gap: 3, height: 30, justifyContent: "center", minWidth: 36, paddingHorizontal: 7 },
  actionEmphasized: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  actionDanger: { backgroundColor: WAFL_THEME.compactCard.actionDangerBackground, borderColor: WAFL_THEME.compactCard.actionDangerBorder },
  actionCaption: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  actionCaptionEmphasized: { color: WAFL_THEME.color.paper },
  actionCaptionDanger: { color: WAFL_THEME.color.error },
  disabled: { opacity: 0.46 },
  pressed: { opacity: 0.68 },
});
