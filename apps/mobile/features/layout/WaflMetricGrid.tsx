import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { WAFL_THEME } from "@/constants/theme";

export type WaflMetricGridItem = {
  readonly key: string;
  readonly content: ReactNode;
  readonly fullWidth?: boolean;
};

type Props = {
  readonly items: readonly WaflMetricGridItem[];
  readonly testID?: string;
};

/** Canonical two-column phone / four-column comfortable-width metric grid. */
export default function WaflMetricGrid({ items, testID }: Props) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const gap = WAFL_THEME.layout.metricGridGap;
  const wideMinimum = WAFL_THEME.layout.metricGridMinColumnWidth * WAFL_THEME.layout.metricGridMaximumColumns
    + gap * (WAFL_THEME.layout.metricGridMaximumColumns - 1);
  const columns = availableWidth >= wideMinimum
    ? WAFL_THEME.layout.metricGridMaximumColumns
    : WAFL_THEME.layout.metricGridMinimumColumns;
  const boundedColumns = Math.max(1, Math.min(items.length, columns));
  const fallbackWidth = WAFL_THEME.layout.metricGridMinColumnWidth;
  const cellWidth = availableWidth > 0
    ? (availableWidth - gap * (boundedColumns - 1)) / boundedColumns
    : fallbackWidth;

  return (
    <View
      onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}
      style={styles.grid}
      testID={testID}
    >
      {items.map((item) => (
        <View key={item.key} style={item.fullWidth ? styles.fullWidth : { width: cellWidth }}>
          {item.content}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: WAFL_THEME.layout.metricGridGap,
    width: "100%",
  },
  fullWidth: { width: "100%" },
});
