import { Pressable, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export type WaflChoiceOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

export default function WaflChoiceButtons<T extends string>(props: {
  readonly accessibilityLabel: string;
  readonly options: readonly WaflChoiceOption<T>[];
  readonly selectedValue: T;
  readonly disabled?: boolean;
  readonly onSelect: (value: T) => void;
}) {
  return <View accessibilityLabel={props.accessibilityLabel} accessibilityRole="radiogroup" style={styles.group}>
    {props.options.map((option) => {
      const selected = option.value === props.selectedValue;
      return <Pressable
        accessibilityRole="radio"
        accessibilityState={{ disabled: props.disabled, selected }}
        disabled={props.disabled}
        key={option.value}
        onPress={() => props.onSelect(option.value)}
        style={({ pressed }) => [styles.button, selected && styles.buttonSelected, props.disabled && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={[styles.text, selected && styles.textSelected]}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", gap: 8 },
  button: { alignItems: "center", backgroundColor: "#f4ede3", borderColor: "#d7cabc", borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  buttonSelected: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  text: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 12, textAlign: "center" },
  textSelected: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
