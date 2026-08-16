import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly icon: ReactNode;
  readonly label?: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

/** Canonical compact action for a section-card header, with an optional short visible label. */
export default function WaflSectionHeaderAction({ accessibilityLabel, disabled = false, icon, label, onPress, testID }: Props) {
  return <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.action, !label && styles.iconOnly, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    testID={testID}
  >
    {icon}
    {label ? <Text style={styles.label}>{label}</Text> : null}
  </Pressable>;
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    borderColor: WAFL_THEME.color.border,
    borderRadius: WAFL_THEME.radius.actionTile,
    borderWidth: WAFL_THEME.border.hairline,
    flexDirection: "row",
    gap: WAFL_THEME.layout.tightGap,
    justifyContent: "center",
    minHeight: WAFL_THEME.touch.minimum,
    paddingHorizontal: WAFL_THEME.layout.controlGap,
  },
  iconOnly: { paddingHorizontal: 0, width: WAFL_THEME.touch.minimum },
  label: {
    color: WAFL_THEME.color.navyInk,
    fontFamily: WAFL_FONTS.bold,
    fontSize: WAFL_THEME.typography.actionLabel.fontSize,
    lineHeight: WAFL_THEME.typography.actionLabel.lineHeight,
  },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
});
