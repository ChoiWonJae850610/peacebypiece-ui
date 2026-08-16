import { Keyboard, RotateCcw } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export type WaflInputMode = "picker" | "direct";

export function waflInputModeSwitchLabel(mode: WaflInputMode) {
  return mode === "picker" ? "직접 입력으로 변경" : "WAFL PICK으로 변경";
}

export default function WaflInputModeSwitch(props: {
  readonly mode: WaflInputMode;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly testID?: string;
}) {
  const label = waflInputModeSwitchLabel(props.mode);
  const Icon = props.mode === "picker" ? Keyboard : RotateCcw;
  return <Pressable
    accessibilityLabel={label}
    accessibilityRole="button"
    accessibilityState={{ disabled: props.disabled }}
    disabled={props.disabled}
    onPress={props.onPress}
    style={({ pressed }) => [styles.button, props.disabled && styles.disabled, pressed && !props.disabled && styles.pressed]}
    testID={props.testID}
  >
    <Icon color={WAFL_THEME.color.navyInk} size={17} />
    <Text style={styles.text}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    minHeight: 42,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  text: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
});
