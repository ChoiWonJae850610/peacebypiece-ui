import { useRef, type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";

export type WaflFrozenAxisColumn = {
  readonly key: string;
  readonly label: ReactNode;
};

export type WaflFrozenAxisRow = {
  readonly cells: readonly ReactNode[];
  readonly emphasized?: boolean;
  readonly key: string;
  readonly label: ReactNode;
};

type Props = {
  readonly columns: readonly WaflFrozenAxisColumn[];
  readonly cornerLabel: ReactNode;
  readonly fullView?: boolean;
  readonly rows: readonly WaflFrozenAxisRow[];
  readonly testID: string;
};

/**
 * Shared presentation-only table owner for mobile data with a frozen label axis.
 * Main cards scroll only on x. Full view additionally synchronizes body y with
 * the frozen label column while keeping the corner and header outside that y axis.
 */
export default function WaflFrozenAxisTable({ columns, cornerLabel, fullView = false, rows, testID }: Props) {
  const headerRef = useRef<ScrollView>(null);
  const leftRef = useRef<ScrollView>(null);

  const syncHorizontal = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    headerRef.current?.scrollTo({ animated: false, x: event.nativeEvent.contentOffset.x });
  };
  const syncVertical = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    leftRef.current?.scrollTo({ animated: false, y: event.nativeEvent.contentOffset.y });
  };

  const frozenLabels = rows.map((row) => (
    <View key={row.key} style={[styles.labelCell, row.emphasized && styles.emphasizedCell]}>
      {row.label}
    </View>
  ));
  const bodyRows = rows.map((row) => (
    <View key={row.key} style={styles.row}>
      {row.cells.map((cell, index) => (
        <View key={`${row.key}:${columns[index]?.key ?? index}`} style={[styles.dataCell, row.emphasized && styles.emphasizedCell]}>
          {cell}
        </View>
      ))}
    </View>
  ));

  return <View style={styles.table} testID={testID}>
    <View style={styles.row}>
      <View style={[styles.cornerCell, styles.headerCell]}>{typeof cornerLabel === "string" ? <Text style={styles.headerText}>{cornerLabel}</Text> : cornerLabel}</View>
      <ScrollView
        horizontal
        ref={headerRef}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollingPane}
      >
        <View style={styles.row}>{columns.map((column) => (
          <View key={column.key} style={[styles.dataCell, styles.headerCell]}>{typeof column.label === "string" ? <Text numberOfLines={1} style={styles.headerText}>{column.label}</Text> : column.label}</View>
        ))}</View>
      </ScrollView>
    </View>
    {fullView ? <View style={[styles.row, styles.fullBodyViewport]}>
      <ScrollView ref={leftRef} scrollEnabled={false} showsVerticalScrollIndicator={false} style={styles.frozenColumn}>{frozenLabels}</ScrollView>
      <ScrollView horizontal onScroll={syncHorizontal} scrollEventThrottle={16} showsHorizontalScrollIndicator style={styles.scrollingPane}>
        <ScrollView nestedScrollEnabled onScroll={syncVertical} scrollEventThrottle={16} showsVerticalScrollIndicator>{bodyRows}</ScrollView>
      </ScrollView>
    </View> : <View style={styles.row}>
      <View style={styles.frozenColumn}>{frozenLabels}</View>
      <ScrollView horizontal onScroll={syncHorizontal} scrollEventThrottle={16} showsHorizontalScrollIndicator style={styles.scrollingPane}>
        <View>{bodyRows}</View>
      </ScrollView>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  table: { alignSelf: "stretch", borderColor: WAFL_THEME.color.border, borderLeftWidth: WAFL_THEME.border.hairline, borderTopWidth: WAFL_THEME.border.hairline, minWidth: 0 },
  row: { flexDirection: "row" },
  scrollingPane: { flex: 1, minWidth: 0 },
  frozenColumn: { flexGrow: 0, flexShrink: 0, width: WAFL_THEME.layout.frozenTableLabelWidth },
  fullBodyViewport: { maxHeight: WAFL_THEME.layout.frozenTableFullBodyMaxHeight },
  cornerCell: { alignItems: "center", flexShrink: 0, justifyContent: "center", minHeight: WAFL_THEME.layout.frozenTableRowHeight, width: WAFL_THEME.layout.frozenTableLabelWidth },
  labelCell: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, borderRightColor: WAFL_THEME.color.border, borderRightWidth: WAFL_THEME.border.hairline, flexDirection: "row", justifyContent: "flex-start", minHeight: WAFL_THEME.layout.frozenTableRowHeight, paddingHorizontal: WAFL_THEME.layout.controlGap, width: WAFL_THEME.layout.frozenTableLabelWidth },
  dataCell: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, borderRightColor: WAFL_THEME.color.border, borderRightWidth: WAFL_THEME.border.hairline, justifyContent: "center", minHeight: WAFL_THEME.layout.frozenTableRowHeight, paddingHorizontal: WAFL_THEME.layout.tightGap, width: WAFL_THEME.layout.frozenTableCellWidth },
  headerCell: { backgroundColor: WAFL_THEME.color.paperMuted, borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, borderRightColor: WAFL_THEME.color.border, borderRightWidth: WAFL_THEME.border.hairline },
  headerText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.meta.fontSize, lineHeight: WAFL_THEME.typography.meta.lineHeight, textAlign: "center" },
  emphasizedCell: { backgroundColor: WAFL_THEME.color.fabricBeige },
});
