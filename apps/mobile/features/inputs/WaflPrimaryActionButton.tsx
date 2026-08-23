import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export default function WaflPrimaryActionButton({
  accessibilityLabel,
  disabled = false,
  label,
  onPress,
  pending = false,
  testID,
}: {
  readonly accessibilityLabel: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly pending?: boolean;
  readonly testID?: string;
}) {
  const blocked = disabled || pending;
  return <Pressable
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="button"
    accessibilityState={{ busy: pending, disabled: blocked }}
    disabled={blocked}
    onPress={onPress}
    style={({ pressed }) => [styles.button, blocked && styles.disabled, pressed && !blocked && styles.pressed]}
    testID={testID}
  >
    {pending ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  button: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: WAFL_THEME.radius.field, justifyContent: "center", minHeight: 48, width: "100%" },
  label: { color: "#fff", fontFamily: WAFL_FONTS.bold, fontSize: WAFL_THEME.typography.bodyText.fontSize },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.76 },
});
