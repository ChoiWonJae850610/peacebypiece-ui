import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export default function WaflCharacterCounter({ current, maximum, style }: {
  readonly current: number;
  readonly maximum: number;
  readonly style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.counter, style]}>{current} / {maximum}</Text>;
}

const styles = StyleSheet.create({
  counter: {
    color: WAFL_THEME.color.readOnly,
    fontFamily: WAFL_FONTS.medium,
    fontSize: WAFL_THEME.typography.meta.fontSize,
    lineHeight: WAFL_THEME.typography.meta.lineHeight,
    textAlign: "right",
  },
});
