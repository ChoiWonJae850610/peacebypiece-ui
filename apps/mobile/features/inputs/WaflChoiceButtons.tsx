import { Pressable, StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export type WaflChoiceOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

type CommonProps<T extends string> = {
  readonly accessibilityLabel: string;
  readonly options: readonly WaflChoiceOption<T>[];
  readonly disabled?: boolean;
  readonly layout?: "row" | "wrap";
  readonly presentation?: "form" | "compact";
};

type SingleChoiceProps<T extends string> = CommonProps<T> & {
  readonly selectionMode?: "single";
  readonly selectedValue: T;
  readonly onSelect: (value: T) => void;
};

type MultipleChoiceProps<T extends string> = CommonProps<T> & {
  readonly selectionMode: "multiple";
  readonly selectedValues: readonly T[];
  readonly onToggle: (value: T) => void;
};

export default function WaflChoiceButtons<T extends string>(props: SingleChoiceProps<T> | MultipleChoiceProps<T>) {
  const multiple = props.selectionMode === "multiple";
  const compact = props.presentation === "compact";
  return <View accessibilityLabel={props.accessibilityLabel} accessibilityRole={multiple ? undefined : "radiogroup"} style={[styles.group, compact && styles.groupCompact, props.layout === "wrap" && styles.groupWrap]}>
    {props.options.map((option, index) => {
      const selected = multiple ? props.selectedValues.includes(option.value) : option.value === props.selectedValue;
      return <Pressable
        accessibilityRole={multiple ? "checkbox" : "radio"}
        accessibilityState={{ checked: multiple ? selected : undefined, disabled: props.disabled, selected: multiple ? undefined : selected }}
        disabled={props.disabled}
        hitSlop={compact ? WAFL_THEME.segmentedControl.compactTouchInset : undefined}
        key={option.value}
        onPress={() => multiple ? props.onToggle(option.value) : props.onSelect(option.value)}
        style={({ pressed }) => [styles.button, compact && styles.buttonCompact, compact && index === 0 && styles.buttonCompactFirst, compact && index === props.options.length - 1 && styles.buttonCompactLast, props.layout === "wrap" && styles.buttonWrap, selected && styles.buttonSelected, props.disabled && styles.disabled, pressed && styles.pressed]}
      >
        <Text style={[styles.text, compact && styles.textCompact, selected && styles.textSelected]}>{option.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: "row", gap: 8 },
  groupCompact: { alignSelf: "flex-start", gap: 0, minHeight: WAFL_THEME.segmentedControl.compactHeight },
  groupWrap: { flexWrap: "wrap" },
  button: { alignItems: "center", backgroundColor: "#f4ede3", borderColor: "#d7cabc", borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 10 },
  buttonCompact: { borderRadius: 0, flex: 0, height: WAFL_THEME.segmentedControl.compactHeight, minHeight: WAFL_THEME.segmentedControl.compactHeight, paddingHorizontal: 4, width: WAFL_THEME.segmentedControl.compactSegmentWidth },
  buttonCompactFirst: { borderBottomLeftRadius: WAFL_THEME.segmentedControl.compactRadius, borderTopLeftRadius: WAFL_THEME.segmentedControl.compactRadius },
  buttonCompactLast: { borderBottomRightRadius: WAFL_THEME.segmentedControl.compactRadius, borderLeftWidth: 0, borderTopRightRadius: WAFL_THEME.segmentedControl.compactRadius },
  buttonWrap: { flexBasis: "30%", flexGrow: 1 },
  buttonSelected: { backgroundColor: WAFL_THEME.color.navyInk, borderColor: WAFL_THEME.color.navyInk },
  text: { color: "#5d5147", fontFamily: WAFL_FONTS.semibold, fontSize: 12, textAlign: "center" },
  textCompact: { fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight },
  textSelected: { color: "#fffdf8", fontFamily: WAFL_FONTS.bold },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
