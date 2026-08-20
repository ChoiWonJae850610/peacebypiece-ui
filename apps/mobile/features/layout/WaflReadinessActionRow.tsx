import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly issueCount: number;
  readonly onPress?: () => void;
};

export default function WaflReadinessActionRow({ issueCount, onPress }: Props) {
  const ready = issueCount === 0;
  const content = <>
    {ready
      ? <CheckCircle2 color={WAFL_THEME.color.olive} size={WAFL_THEME.icon.small} />
      : <AlertCircle color={WAFL_THEME.color.brickOrange} size={WAFL_THEME.icon.small} />}
    <Text style={[styles.label, ready && styles.labelReady]}>{ready ? "발행 준비 완료" : `발행 전 확인 ${issueCount}건`}</Text>
    <View style={styles.spacer} />
    {!ready ? <ChevronRight color={WAFL_THEME.color.readOnly} size={WAFL_THEME.icon.small} /> : null}
  </>;
  if (ready) return <View accessibilityLabel="발행 준비 완료" style={[styles.row, styles.ready]} testID="overview-preissue-ready-row">{content}</View>;
  return <Pressable accessibilityLabel={`발행 전 확인 ${issueCount}건`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, styles.active, pressed && styles.pressed]} testID="overview-preissue-action-row">{content}</Pressable>;
}

const styles = StyleSheet.create({
  row: { alignItems: "center", borderRadius: WAFL_THEME.radius.cardCompact, flexDirection: "row", gap: WAFL_THEME.layout.controlGap, minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.layout.compactCardInsetHorizontal },
  active: { backgroundColor: WAFL_THEME.color.fabricBeige, borderColor: WAFL_THEME.color.border, borderWidth: WAFL_THEME.border.hairline },
  ready: { backgroundColor: WAFL_THEME.color.paperMuted },
  label: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight },
  labelReady: { color: WAFL_THEME.color.olive },
  spacer: { flex: 1 },
  pressed: { opacity: 0.68 },
});
