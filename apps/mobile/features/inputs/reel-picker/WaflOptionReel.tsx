import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  Vibration,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import type { ReelOption } from "./reelPickerModel";
import { createSelectionHapticAdapter } from "./reelPickerHaptics";
import { WAFL_REEL_ROW_HEIGHT, WAFL_REEL_VIEWPORT_HEIGHT } from "./waflReelSheetSizingPolicy";

const ITEM_HEIGHT = WAFL_REEL_ROW_HEIGHT;
const REEL_HEIGHT = WAFL_REEL_VIEWPORT_HEIGHT;
export const platformReelHaptics = createSelectionHapticAdapter((durationMs) => Vibration.vibrate(durationMs));

function scrollIndex(event: NativeSyntheticEvent<NativeScrollEvent>, itemCount: number) {
  return Math.max(0, Math.min(itemCount - 1, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)));
}

export function ReelColumn({
  accessibilityLabel,
  options,
  selectedIndex,
  onSelect,
  recenterIndex,
  compact = false,
  accessibilityValue,
}: {
  readonly accessibilityLabel: string;
  readonly options: readonly ReelOption[];
  readonly selectedIndex: number;
  readonly onSelect: (index: number) => void;
  readonly recenterIndex?: (index: number) => number | null;
  readonly compact?: boolean;
  readonly accessibilityValue?: { readonly text: string; readonly now: number; readonly min: number; readonly max: number };
}) {
  const ref = useRef<FlatList<ReelOption>>(null);
  const selectedIndexRef = useRef(selectedIndex);
  const lastCommittedIndexRef = useRef(selectedIndex);
  const [visibleSelectedIndex, setVisibleSelectedIndex] = useState(selectedIndex);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
  useEffect(() => {
    if (options.length === 0) {
      selectedIndexRef.current = 0;
      lastCommittedIndexRef.current = 0;
      return undefined;
    }
    const nextIndex = selectedIndexRef.current;
    lastCommittedIndexRef.current = nextIndex;
    const frame = requestAnimationFrame(() => {
      setVisibleSelectedIndex(nextIndex);
      ref.current?.scrollToIndex({ animated: false, index: nextIndex });
    });
    return () => cancelAnimationFrame(frame);
  }, [options]);
  function commitScrollIndex(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = scrollIndex(event, options.length);
    if (lastCommittedIndexRef.current === nextIndex) return;
    lastCommittedIndexRef.current = nextIndex;
    setVisibleSelectedIndex(nextIndex);
    onSelect(nextIndex);
    const recentered = recenterIndex?.(nextIndex) ?? null;
    if (recentered !== null && recentered !== nextIndex) {
      lastCommittedIndexRef.current = recentered;
      setVisibleSelectedIndex(recentered);
      requestAnimationFrame(() => ref.current?.scrollToIndex({ animated: false, index: recentered }));
    }
  }
  return <View accessibilityLabel={accessibilityLabel} style={[styles.reelColumn, compact && styles.unitColumn]}>
    <FlatList
      ref={ref}
      accessibilityRole="adjustable"
      accessibilityValue={accessibilityValue}
      contentContainerStyle={styles.reelContent}
      data={options}
      decelerationRate="normal"
      extraData={visibleSelectedIndex}
      getItemLayout={(_data, index) => ({ index, length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index })}
      initialScrollIndex={options.length ? selectedIndex : undefined}
      keyExtractor={(item) => item.key}
      onMomentumScrollEnd={commitScrollIndex}
      onScrollEndDrag={(event) => { if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.08) commitScrollIndex(event); }}
      renderItem={({ item, index }) => {
        const distance = Math.abs(index - visibleSelectedIndex);
        return <View style={styles.reelItem}>
          {item.swatchHex ? <View style={[styles.optionSwatch, { backgroundColor: item.swatchHex }]} /> : null}
          {item.label ? <View style={styles.optionReelCopy}>
            <Text numberOfLines={2} style={[styles.reelText, distance === 0 ? styles.reelTextSelected : distance === 1 ? styles.reelTextNear : styles.reelTextFar, styles.optionReelText]}>{item.label}</Text>
            {item.metadata ? <Text numberOfLines={1} style={styles.optionReelMetadata}>{item.metadata}</Text> : null}
          </View> : <Text numberOfLines={1} style={[styles.reelText, distance === 0 ? styles.reelTextSelected : distance === 1 ? styles.reelTextNear : styles.reelTextFar]}>{item.value}</Text>}
        </View>;
      }}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={ITEM_HEIGHT}
      style={styles.reelList}
      windowSize={7}
    />
    <View pointerEvents="none" style={styles.selectionBand} />
    <View pointerEvents="none" style={styles.fadeTop} />
    <View pointerEvents="none" style={styles.fadeBottom} />
  </View>;
}

export function FiniteOptionReelColumn(props: {
  readonly accessibilityLabel: string;
  readonly options: readonly ReelOption[];
  readonly selectedValue: string;
  readonly onSelect: (logicalIndex: number) => void;
  readonly compact?: boolean;
}) {
  const logicalIndex = Math.max(0, props.options.findIndex((option) => option.value === props.selectedValue));
  const logicalOption = props.options[logicalIndex];
  return <ReelColumn
    accessibilityLabel={props.accessibilityLabel}
    accessibilityValue={{
      text: logicalOption?.label ?? logicalOption?.value ?? "선택 없음",
      now: logicalIndex + 1,
      min: props.options.length ? 1 : 0,
      max: props.options.length,
    }}
    compact={props.compact}
    onSelect={props.onSelect}
    options={props.options}
    selectedIndex={logicalIndex}
  />;
}

export function WaflOptionReel(props: {
  readonly accessibilityLabel: string;
  readonly options: readonly ReelOption[];
  readonly selectedValue: string;
  readonly onSelect: (value: string) => void;
}) {
  if (props.options.length === 0) return null;
  return <FiniteOptionReelColumn
    accessibilityLabel={props.accessibilityLabel}
    onSelect={(index) => {
      const value = props.options[index]?.value;
      if (value === undefined || value === props.selectedValue) return;
      platformReelHaptics.selectionChanged(index);
      props.onSelect(value);
    }}
    options={props.options}
    selectedValue={props.selectedValue}
  />;
}

const styles = StyleSheet.create({
  reelColumn: { backgroundColor: "transparent", borderBottomColor: "#dfd2c2", borderBottomWidth: 1, borderTopColor: "#dfd2c2", borderTopWidth: 1, height: REEL_HEIGHT, overflow: "hidden", position: "relative" },
  unitColumn: { backgroundColor: "transparent" },
  reelList: { height: REEL_HEIGHT },
  reelContent: { paddingVertical: ITEM_HEIGHT * 2 },
  reelItem: { alignItems: "center", flexDirection: "row", gap: 8, height: ITEM_HEIGHT, justifyContent: "center", paddingHorizontal: 8 },
  optionReelCopy: { alignItems: "center", flex: 1, minWidth: 0 },
  optionReelText: { fontSize: 15, lineHeight: 17, textAlign: "center" },
  optionReelMetadata: { color: "#786d62", fontFamily: WAFL_FONTS.regular, fontSize: 9, lineHeight: 11, textAlign: "center" },
  optionSwatch: { borderColor: "#b9af9f", borderRadius: 11, borderWidth: 1, height: 22, width: 22 },
  reelText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: 18 },
  reelTextSelected: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.black, fontSize: 22 },
  reelTextNear: { opacity: 0.58 },
  reelTextFar: { opacity: 0.24 },
  selectionBand: { borderBottomColor: WAFL_THEME.color.brickOrange, borderBottomWidth: 1, borderTopColor: WAFL_THEME.color.brickOrange, borderTopWidth: 1, height: ITEM_HEIGHT, left: 8, position: "absolute", right: 8, top: ITEM_HEIGHT * 2 },
  fadeTop: { backgroundColor: "rgba(255,253,248,0.35)", height: ITEM_HEIGHT, left: 0, position: "absolute", right: 0, top: 0 },
  fadeBottom: { backgroundColor: "rgba(255,253,248,0.35)", bottom: 0, height: ITEM_HEIGHT, left: 0, position: "absolute", right: 0 },
});
