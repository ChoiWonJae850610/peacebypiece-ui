import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

type Props = {
  readonly children?: ReactNode;
  readonly editable: boolean;
  readonly label: string;
  readonly placeholder?: boolean;
  readonly value?: string;
};

/** Shared overview metric surface; editability is communicated only by the value underline. */
export default function WaflMetricField({ children, editable, label, placeholder = false, value }: Props) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View
      accessibilityLabel={`${label} 값`}
      accessibilityState={{ disabled: !editable }}
      style={styles.valueSurface}
      testID="wafl-metric-value-surface"
    >
      {children ?? <Text numberOfLines={2} style={[styles.value, placeholder && styles.placeholder]}>{value}</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: WAFL_THEME.color.fabricBeige,
    borderRadius: WAFL_THEME.radius.field,
    justifyContent: "center",
    minHeight: WAFL_THEME.layout.metricCellMinHeight,
    paddingHorizontal: WAFL_THEME.layout.controlGap,
    paddingVertical: WAFL_THEME.layout.tightGap,
    width: "100%",
  },
  label: {
    color: "#7a6c5c",
    fontFamily: WAFL_FONTS.medium,
    fontSize: WAFL_THEME.typography.badge.fontSize,
  },
  valueSurface: {
    backgroundColor: WAFL_THEME.color.paper,
    borderRadius: WAFL_THEME.radius.field,
    justifyContent: "center",
    marginTop: WAFL_THEME.layout.tightGap,
    minHeight: WAFL_THEME.layout.metricValueSurfaceMinHeight,
    paddingHorizontal: WAFL_THEME.layout.metricValueSurfaceInset,
    paddingVertical: 3,
  },
  value: {
    color: WAFL_THEME.color.deepNavy,
    fontFamily: WAFL_FONTS.bold,
    fontSize: 11,
    lineHeight: 15,
  },
  placeholder: { color: "#9b9288" },
});
