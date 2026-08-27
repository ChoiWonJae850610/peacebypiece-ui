import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export type WaflActionConfirmationState = {
  readonly title: string;
  readonly helper: string;
  readonly cancelAccessibilityLabel: string;
  readonly confirmAccessibilityLabel: string;
  readonly destructive?: boolean;
  readonly safeOptionLabel?: string;
  readonly actionOptionLabel?: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
};

export default function WaflActionConfirmationCard(props: {
  readonly processingMessage?: string | null;
  readonly processingHelper?: string | null;
  readonly testID?: string;
}) {
  const processingMessage = props.processingMessage ?? null;
  if (!processingMessage) return null;
  const label = processingMessage;
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityViewIsModal
      pointerEvents="auto"
      style={styles.root}
      testID={props.testID ?? "wafl-action-confirmation-card"}
    >
      <View style={styles.card}>
        {processingMessage ? <ActivityIndicator color={WAFL_THEME.color.brickOrange} size="large" /> : null}
        <Text style={styles.title}>{label}</Text>
        {props.processingHelper ? (
          <Text style={styles.helper}>{props.processingHelper}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", backgroundColor: "rgba(23,38,61,0.34)", bottom: 0, justifyContent: "center", left: 0, padding: WAFL_THEME.spacing.lg, position: "absolute", right: 0, top: 0, zIndex: 100 },
  card: { backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.border, borderRadius: WAFL_THEME.radius.cardMajor, borderWidth: WAFL_THEME.border.hairline, gap: WAFL_THEME.spacing.md, maxWidth: 360, minWidth: 260, paddingHorizontal: WAFL_THEME.spacing.xl, paddingVertical: WAFL_THEME.spacing.lg, width: "100%" },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.bold, fontSize: 16, lineHeight: 23, textAlign: "center" },
  helper: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "center" },
});
