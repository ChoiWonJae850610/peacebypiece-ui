import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { WaflAlertState } from "./waflFeedbackStore";

const TONE = {
  success: { color: "#35512f", Icon: CircleCheck },
  warning: { color: "#8a5b24", Icon: TriangleAlert },
  error: { color: WAFL_THEME.color.error, Icon: CircleAlert },
} as const;

export default function WaflAlertHost(props: { readonly alert: WaflAlertState | null; readonly onDismiss: (id: number) => void; readonly durationMs?: number }) {
  const { alert, onDismiss } = props;
  const durationMs = props.durationMs ?? 1200;
  useEffect(() => {
    if (!alert) return undefined;
    const timer = setTimeout(() => onDismiss(alert.id), durationMs);
    return () => clearTimeout(timer);
  }, [alert, durationMs, onDismiss]);
  if (!alert) return null;
  const tone = TONE[alert.tone];
  const Icon = tone.Icon;
  return <View pointerEvents="none" style={styles.root} testID="wafl-alert-host">
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.card}>
      <Icon color={tone.color} size={22} />
      <Text style={[styles.message, { color: tone.color }]}>{alert.message}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { alignItems: "center", bottom: 0, justifyContent: "center", left: 0, padding: WAFL_THEME.spacing.lg, position: "absolute", right: 0, top: 0, zIndex: 120 },
  card: { alignItems: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, elevation: 4, gap: WAFL_THEME.spacing.sm, maxWidth: 360, minWidth: 240, paddingHorizontal: WAFL_THEME.spacing.xl, paddingVertical: WAFL_THEME.spacing.lg, shadowColor: WAFL_THEME.color.deepNavy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 5 },
  message: { fontFamily: WAFL_FONTS.bold, fontSize: 14, lineHeight: 21, textAlign: "center" },
});
