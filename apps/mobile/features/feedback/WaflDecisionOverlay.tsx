import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { createWaflDecisionGuard } from "@/domain/waflDecisionPolicy";

export type WaflDecisionOverlayState = {
  readonly title: string;
  readonly helper: string;
  readonly safeLabel: string;
  readonly actionLabel: string;
  readonly destructive?: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export default function WaflDecisionOverlay(props: {
  readonly decision: WaflDecisionOverlayState | null;
  readonly pending?: boolean;
  readonly testID?: string;
}) {
  if (!props.decision) return null;
  return <WaflDecisionOverlaySession decision={props.decision} pending={props.pending} testID={props.testID} />;
}

function WaflDecisionOverlaySession(props: {
  readonly decision: WaflDecisionOverlayState;
  readonly pending?: boolean;
  readonly testID?: string;
}) {
  const decision = props.decision;
  const pending = props.pending === true;
  const guard = useMemo(() => createWaflDecisionGuard(decision.onCancel, decision.onConfirm), [decision]);
  return <View
    accessibilityLabel={decision.title}
    accessibilityViewIsModal
    pointerEvents="auto"
    style={styles.root}
    testID={props.testID ?? "wafl-decision-overlay"}
  >
    <View style={styles.card}>
      <Text style={styles.title}>{decision.title}</Text>
      <Text style={styles.helper}>{decision.helper}</Text>
      <View accessibilityRole="radiogroup" style={styles.actions}>
        <Pressable
          accessibilityLabel={decision.safeLabel}
          accessibilityRole="button"
          disabled={pending}
          onPress={() => guard.dismiss()}
          style={({ pressed }) => [styles.action, pressed && styles.pressed, pending && styles.disabled]}
        ><Text style={styles.safeText}>{decision.safeLabel}</Text></Pressable>
        <Pressable
          accessibilityLabel={decision.actionLabel}
          accessibilityRole="button"
          disabled={pending}
          onPress={() => guard.apply("action")}
          style={({ pressed }) => [styles.action, styles.confirmAction, decision.destructive && styles.destructiveAction, pressed && styles.pressed, pending && styles.disabled]}
        ><Text style={[styles.confirmText, decision.destructive && styles.destructiveText]}>{decision.actionLabel}</Text></Pressable>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { alignItems: "center", backgroundColor: "rgba(23,38,61,0.34)", bottom: 0, justifyContent: "center", left: 0, padding: WAFL_THEME.spacing.lg, position: "absolute", right: 0, top: 0, zIndex: 90 },
  card: { backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, gap: WAFL_THEME.spacing.md, maxWidth: 360, minWidth: 260, paddingHorizontal: WAFL_THEME.spacing.xl, paddingVertical: WAFL_THEME.spacing.lg, width: "100%" },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 16, lineHeight: 23, textAlign: "center" },
  helper: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "center" },
  actions: { flexDirection: "row", gap: WAFL_THEME.spacing.sm },
  action: { alignItems: "center", backgroundColor: WAFL_THEME.color.paperMuted, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.actionTile, borderWidth: WAFL_THEME.border.hairline, flex: 1, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.spacing.sm },
  confirmAction: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  destructiveAction: { backgroundColor: "#fff4f2", borderColor: WAFL_THEME.color.error },
  safeText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  confirmText: { color: WAFL_THEME.color.paper, fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.actionLabel.fontSize },
  destructiveText: { color: WAFL_THEME.color.error },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.45 },
});
