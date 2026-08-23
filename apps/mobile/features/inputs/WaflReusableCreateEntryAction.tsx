import { Pressable, StyleSheet, Text } from "react-native";
import { Plus } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly disabled?: boolean;
  readonly label?: string;
  readonly onPress: () => void;
  readonly testID?: string;
};

/** Canonical parent-catalog entry for Size, Color, and Spec reusable creation. */
export default function WaflReusableCreateEntryAction({ disabled = false, label = "직접 만들기", onPress, testID }: Props) {
  return <Pressable
    accessibilityLabel={`+ ${label}`}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => [styles.action, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    testID={testID}
  >
    <Plus color={WAFL_THEME.color.navyInk} size={WAFL_THEME.icon.small} />
    <Text style={styles.label}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: WAFL_THEME.layout.controlGap,
    minHeight: WAFL_THEME.touch.minimum,
    paddingHorizontal: WAFL_THEME.spacing.sm,
  },
  label: {
    color: WAFL_THEME.color.navyInk,
    fontFamily: WAFL_FONTS.bold,
    fontSize: WAFL_THEME.typography.actionLabel.fontSize,
    lineHeight: WAFL_THEME.typography.actionLabel.lineHeight,
  },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
});
