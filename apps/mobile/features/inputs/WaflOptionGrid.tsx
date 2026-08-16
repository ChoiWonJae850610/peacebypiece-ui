import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";

export type WaflOptionGridItem = {
  readonly key: string;
  readonly label: string;
  readonly selected: boolean;
  readonly swatchHex?: string | null;
  readonly removable?: boolean;
};

type Props = {
  readonly accessibilityLabel: string;
  readonly columns: 3 | 4;
  readonly disabled?: boolean;
  readonly items: readonly WaflOptionGridItem[];
  readonly onRemove?: (item: WaflOptionGridItem) => void;
  readonly onToggle?: (item: WaflOptionGridItem) => void;
  readonly variant?: "selection" | "summary";
};

/** Shared compact chooser for staged size/color catalog selection. */
export default function WaflOptionGrid(props: Props) {
  const basis = props.columns === 4 ? "23%" : "31.5%";
  const summary = props.variant === "summary";
  return <View accessibilityLabel={props.accessibilityLabel} style={styles.grid}>
    {props.items.map((item) => <View key={item.key} style={[styles.cell, { flexBasis: basis }]}>
      {summary ? <View
        accessibilityLabel={item.label}
        style={[styles.main, styles.summary]}
      >
        {item.swatchHex ? <View style={[styles.swatch, { backgroundColor: item.swatchHex }]} /> : null}
        <Text numberOfLines={2} style={[styles.label, styles.summaryLabel]}>{item.label}</Text>
      </View> : <Pressable
        accessibilityLabel={`${item.label}${item.selected ? ", 선택됨" : ""}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.selected, disabled: props.disabled }}
        disabled={props.disabled}
        onPress={() => props.onToggle?.(item)}
        style={({ pressed }) => [styles.main, item.selected && styles.selected, pressed && styles.pressed, props.disabled && styles.disabled]}
      >
        {item.swatchHex ? <View style={[styles.swatch, { backgroundColor: item.swatchHex }]} /> : null}
        <Text numberOfLines={2} style={[styles.label, item.selected && styles.selectedLabel]}>{item.label}</Text>
        {item.selected ? <Check color="#17263d" size={14} /> : null}
      </Pressable>}
      {!summary && item.removable && props.onRemove ? <Pressable
        accessibilityLabel={`${item.label} 등록 선택지 제거`}
        accessibilityRole="button"
        disabled={props.disabled}
        hitSlop={5}
        onPress={() => props.onRemove?.(item)}
        style={[styles.remove, props.disabled && styles.disabled]}
      ><X color="#a94f32" size={13} /></Pressable> : null}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  cell: { minHeight: 52, position: "relative" },
  main: { alignItems: "center", backgroundColor: "#fff", borderColor: "#cbd3df", borderRadius: 9, borderWidth: 1, flex: 1, gap: 4, justifyContent: "center", minHeight: 52, paddingHorizontal: 6, paddingVertical: 7 },
  selected: { backgroundColor: "#e7ecf3", borderColor: "#53647e" },
  summary: { backgroundColor: "#f4ede4", borderColor: "#dfd5c8" },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
  label: { color: "#334561", flexShrink: 1, fontFamily: WAFL_FONTS.semibold, fontSize: 11, textAlign: "center" },
  selectedLabel: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
  summaryLabel: { color: "#17263d", fontFamily: WAFL_FONTS.bold },
  swatch: { borderColor: "#b9af9f", borderRadius: 999, borderWidth: 1, height: 18, width: 18 },
  remove: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#e2a5aa", borderRadius: 999, borderWidth: 1, height: 24, justifyContent: "center", position: "absolute", right: -4, top: -4, width: 24 },
});
