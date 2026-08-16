import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
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
import WaflInputSheet from "../WaflInputSheet";
import WaflInputModeSwitch from "../WaflInputModeSwitch";
import WaflSheetTextInput from "../WaflSheetTextInput";
import {
  normalizeNumericDraft,
  prepareNumericDraftOnFocus,
} from "@/lib/mobileDisplay";
import {
  composeQuarterQuantity,
  createReelWindow,
  decomposeQuarterQuantity,
  defaultReelStep,
  materialUnitOptions,
  normalizeReelValue,
  quarterFractionOptions,
  reelIndexForValue,
  reelStepOptions,
  reelValueAtIndex,
  type ReelOption,
  type ReelStep,
} from "./reelPickerModel";
import { createSelectionHapticAdapter } from "./reelPickerHaptics";
import { INITIAL_REEL_PICKER_STATE, reelPickerReducer } from "./reelPickerState";
import { composeInchMeasurement, decomposeInchMeasurement, inchEighthOptions } from "@/domain/measurementPolicy";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import { resolveWaflPickerRenderPath, type WaflPickerKind } from "./waflPickerRenderPolicy";
import {
  resolveWaflReelAdaptiveBodyHeight,
  WAFL_REEL_ROW_HEIGHT,
  WAFL_REEL_VIEWPORT_HEIGHT,
} from "./waflReelSheetSizingPolicy";
import { useExternalReelVisibilityLifecycle } from "./useExternalReelVisibilityLifecycle";
import {
  exceedsMaterialQuantityPrecision,
  materialQuantityPrecisionMessage,
} from "@/domain/materialQuantityPrecision";

const ITEM_HEIGHT = WAFL_REEL_ROW_HEIGHT;
const REEL_HEIGHT = WAFL_REEL_VIEWPORT_HEIGHT;
const platformReelHaptics = createSelectionHapticAdapter((durationMs) => Vibration.vibrate(durationMs));

export type ReelPickerKind = WaflPickerKind;

export type WaflPickerOption = {
  readonly value: string;
  readonly label: string;
  readonly metadata?: string | null;
};

type Props = {
  readonly visible: boolean;
  readonly field: string;
  readonly label: string;
  readonly value: string;
  readonly unitCode: string;
  readonly kind?: ReelPickerKind;
  readonly options?: readonly string[];
  readonly optionItems?: readonly WaflPickerOption[];
  readonly allowUnset?: boolean;
  readonly footer?: ReactNode;
  readonly pending?: boolean;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onApply: (value: string, unitCode: string) => Promise<unknown> | unknown;
};

function scrollIndex(event: NativeSyntheticEvent<NativeScrollEvent>, itemCount: number) {
  return Math.max(0, Math.min(itemCount - 1, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)));
}

function ReelColumn({
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
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  useEffect(() => {
    const nextIndex = selectedIndexRef.current;
    lastCommittedIndexRef.current = nextIndex;
    setVisibleSelectedIndex(nextIndex);
    const frame = requestAnimationFrame(() => ref.current?.scrollToIndex({
      animated: false,
      index: nextIndex,
    }));
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
  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.reelColumn, compact && styles.unitColumn]}>
      <FlatList
        ref={ref}
        accessibilityRole="adjustable"
        accessibilityValue={accessibilityValue}
        contentContainerStyle={styles.reelContent}
        data={options}
        decelerationRate="normal"
        extraData={visibleSelectedIndex}
        getItemLayout={(_data, index) => ({ index, length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index })}
        initialScrollIndex={selectedIndex}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={commitScrollIndex}
        onScrollEndDrag={(event) => {
          if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.08) commitScrollIndex(event);
        }}
        renderItem={({ item, index }) => {
          const distance = Math.abs(index - visibleSelectedIndex);
          return (
            <View style={styles.reelItem}>
              {item.swatchHex ? <View style={[styles.optionSwatch, { backgroundColor: item.swatchHex }]} /> : null}
              {item.label ? <View style={styles.optionReelCopy}>
                <Text numberOfLines={2} style={[styles.reelText, distance === 0 ? styles.reelTextSelected : distance === 1 ? styles.reelTextNear : styles.reelTextFar, styles.optionReelText]}>{item.label}</Text>
                {item.metadata ? <Text numberOfLines={1} style={styles.optionReelMetadata}>{item.metadata}</Text> : null}
              </View> : <Text numberOfLines={1} style={[styles.reelText, distance === 0 ? styles.reelTextSelected : distance === 1 ? styles.reelTextNear : styles.reelTextFar]}>{item.value}</Text>}
            </View>
          );
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
    </View>
  );
}

function FiniteOptionReelColumn(props: {
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

export default function WaflReelPickerSheet({ visible, field, label, value, unitCode, kind = "quantity", options = [], optionItems: suppliedOptionItems, allowUnset = false, footer, pending = false, presentationGeneration, onCancel, onAfterClose, onApply }: Props) {
  const integerOnly = kind === "integer";
  const optionOnly = kind === "option";
  const eighthInch = kind === "eighth-inch";
  const [state, dispatch] = useReducer(reelPickerReducer, INITIAL_REEL_PICKER_STATE);
  const [windowAnchor, setWindowAnchor] = useState(value);
  const openExternalSession = useCallback(() => {
    setWindowAnchor(value);
    dispatch({
      type: "open",
      field,
      label,
      value,
      unit: unitCode.trim() || materialUnitOptions("")[0] || "개",
      step: integerOnly || eighthInch ? "1" : defaultReelStep(unitCode),
    });
  }, [eighthInch, field, integerOnly, label, unitCode, value]);
  const closeExternalSession = useCallback(() => dispatch({ type: "cancel" }), []);
  const { markCurrentSessionClosed } = useExternalReelVisibilityLifecycle({
    visible,
    onOpen: openExternalSession,
    onExternalClose: closeExternalSession,
  });
  const quantityParts = useMemo(() => decomposeQuarterQuantity(state.selectedValue), [state.selectedValue]);
  const inchParts = useMemo(() => decomposeInchMeasurement(state.selectedValue), [state.selectedValue]);
  const numberAnchor = kind === "quantity" ? quantityParts.integerPart : eighthInch ? inchParts.integerPart : windowAnchor;
  const numberStep = kind === "quantity" || eighthInch ? "1" : state.step;
  const numberWindow = useMemo(() => createReelWindow(numberAnchor, numberStep), [numberAnchor, numberStep]);
  const displayedNumberOptions = numberWindow.options;
  const unitOptions = useMemo<readonly ReelOption[]>(
    () => materialUnitOptions(state.selectedUnit || unitCode).map((option) => ({ key: option, value: option })),
    [state.selectedUnit, unitCode],
  );
  const optionItems = useMemo<readonly (ReelOption & { readonly metadata?: string | null })[]>(
    () => [...(allowUnset ? [{ value: "", label: WAFL_UNSET_PLACEHOLDER }] : []), ...(suppliedOptionItems ?? options.map((option) => ({ value: option, label: option })))]
      .filter((option, index, all) => all.findIndex((candidate) => candidate.value === option.value) === index)
      .map((option, index) => ({
      key: `option-${option.value || "empty"}-${index}`,
      label: option.label || WAFL_UNSET_PLACEHOLDER,
      metadata: option.metadata,
      value: option.value,
    })),
    [allowUnset, options, suppliedOptionItems],
  );
  const stepOptions = useMemo(() => reelStepOptions(integerOnly), [integerOnly]);
  const stepIndex = Math.max(0, stepOptions.findIndex((option) => option.value === state.step));
  const numberIndex = reelIndexForValue(numberWindow, kind === "quantity" ? quantityParts.integerPart : eighthInch ? inchParts.integerPart : state.selectedValue);
  const fractionOptions = useMemo(() => eighthInch ? inchEighthOptions() : quarterFractionOptions(), [eighthInch]);
  const fractionIndex = Math.max(0, fractionOptions.findIndex((option) => option.value === (eighthInch ? inchParts.fractionPart : quantityParts.fractionPart)));
  const normalized = optionOnly
    ? state.selectedValue
    : eighthInch
      ? composeInchMeasurement(inchParts.integerPart, inchParts.fractionPart)
      : normalizeReelValue(state.selectedValue.trim() || "0");
  const quantityPrecisionError = kind === "quantity"
    && state.mode === "keypad"
    && exceedsMaterialQuantityPrecision(state.selectedValue)
    ? materialQuantityPrecisionMessage()
    : null;
  const applyDisabled = kind === "unit"
    ? !state.selectedUnit.trim()
    : optionOnly
      ? !optionItems.some((option) => option.value === state.selectedValue)
      : normalized === null || quantityPrecisionError !== null;
  const renderPath = resolveWaflPickerRenderPath(kind, state.mode);
  const reelAdaptiveBodyHeight = resolveWaflReelAdaptiveBodyHeight({
    hasModeSwitch: kind !== "unit" && !optionOnly && !eighthInch,
    hasSupplementaryControl: Boolean(footer),
    hasValidationMessage: quantityPrecisionError !== null,
    renderPath,
  });

  function cancel() {
    if (!markCurrentSessionClosed()) return;
    dispatch({ type: "cancel" });
    onCancel();
  }

  async function apply() {
    if (applyDisabled) return;
    const applied = await onApply(normalized ?? state.selectedValue, state.selectedUnit.trim());
    if (applied === false || !markCurrentSessionClosed()) return;
    dispatch({ type: "apply" });
  }

  function selectNumber(index: number) {
    const selectedNumber = reelValueAtIndex(numberWindow, index);
    const next = kind === "quantity"
      ? composeQuarterQuantity(selectedNumber, quantityParts.fractionPart)
      : eighthInch
        ? composeInchMeasurement(selectedNumber, inchParts.fractionPart)
        : selectedNumber;
    if (next === null) return;
    if (next !== state.selectedValue) platformReelHaptics.selectionChanged(index);
    dispatch({ type: "select-value", value: next });
  }

  function selectFraction(index: number) {
    const fraction = fractionOptions[index]?.value;
    if (fraction === undefined) return;
    const next = eighthInch
      ? composeInchMeasurement(inchParts.integerPart, fraction)
      : composeQuarterQuantity(quantityParts.integerPart, fraction);
    if (next === null || next === state.selectedValue) return;
    platformReelHaptics.selectionChanged(index);
    dispatch({ type: "select-value", value: next });
  }

  function selectUnit(index: number) {
    const next = unitOptions[index]?.value;
    if (!next || next === state.selectedUnit) return;
    platformReelHaptics.selectionChanged(index);
    dispatch({ type: "select-unit", unit: next });
  }

  function selectStep(index: number) {
    const step = stepOptions[index]?.value as ReelStep | undefined;
    if (!step || step === state.step) return;
    platformReelHaptics.selectionChanged(index);
    setWindowAnchor(state.selectedValue);
    dispatch({ type: "select-step", step });
  }

  function selectOption(next: string, index: number) {
    if (next === undefined || next === state.selectedValue) return;
    platformReelHaptics.selectionChanged(index);
    dispatch({ type: "select-value", value: next });
  }

  function toggleMode() {
    const nextMode = state.mode === "reel" ? "keypad" : "reel";
    if (nextMode === "reel") setWindowAnchor(state.selectedValue.trim() || "0");
    else dispatch({ type: "select-value", value: prepareNumericDraftOnFocus(state.selectedValue) });
    dispatch({ type: "set-mode", mode: nextMode });
  }

  return (
    <WaflInputSheet
      adaptiveMinimumBodyHeight={reelAdaptiveBodyHeight}
      bodyScrollable={renderPath === "numeric-keypad"}
      cancelAccessibilityLabel="변경 취소"
      confirmAccessibilityLabel="변경 저장"
      confirmDisabled={applyDisabled || pending}
      keyboardAutoExpand={renderPath === "numeric-keypad"}
      keyboardFocusRevealContext={renderPath === "numeric-keypad" ? WAFL_THEME.sheet.numericFocusRevealContext : undefined}
      measurementVariant={renderPath}
      onCancel={cancel}
      onAfterClose={onAfterClose}
      onConfirm={apply}
      pending={pending}
      presentationGeneration={presentationGeneration}
      sizing="reelAdaptive"
      title={label}
      visible={visible && state.phase === "open"}
    >
          {renderPath === "single-choice-reel" ? (
            <View style={styles.optionReel}>
              <WaflOptionReel
                accessibilityLabel={`${label} 선택 릴`}
                onSelect={(next) => selectOption(next, optionItems.findIndex((option) => option.value === next))}
                options={optionItems}
                selectedValue={state.selectedValue}
              />
            </View>
          ) : renderPath === "numeric-reel" ? (
            <View style={styles.reels}>
              {kind !== "unit" ? <View style={styles.numberReel}>
                <Text style={styles.reelLabel}>{kind === "quantity" || eighthInch ? "정수" : "수량"}</Text>
                <ReelColumn accessibilityLabel={`${label} 숫자 릴`} onSelect={selectNumber} options={displayedNumberOptions} selectedIndex={numberIndex} />
              </View> : null}
              {kind === "unit" ? <View style={styles.unitOnlyReel}>
                <Text style={styles.reelLabel}>단위</Text>
                <FiniteOptionReelColumn accessibilityLabel="원단·부자재 단위 목록" compact onSelect={selectUnit} options={unitOptions} selectedValue={state.selectedUnit} />
              </View> : kind === "quantity" || eighthInch ? <View style={styles.intervalReel}>
                <Text style={styles.reelLabel}>{eighthInch ? "분수" : "소수"}</Text>
                <ReelColumn accessibilityLabel={`${label} ${eighthInch ? "분수" : "소수"} 릴`} compact onSelect={selectFraction} options={fractionOptions} selectedIndex={fractionIndex} />
              </View> : <View style={styles.intervalReel}>
                <Text style={styles.reelLabel}>간격</Text>
                <ReelColumn accessibilityLabel={`${label} 간격 릴`} compact onSelect={selectStep} options={stepOptions} selectedIndex={stepIndex} />
              </View>}
            </View>
          ) : (
            <View style={styles.keypadPanel}>
              <Text style={styles.reelLabel}>숫자 직접 입력</Text>
              <View style={[styles.keypadRow, quantityPrecisionError && styles.keypadRowInvalid]}>
                <WaflSheetTextInput
                  accessibilityLabel={`${label} 숫자 직접 입력`}
                  autoFocus
                  keyboardType={integerOnly ? "number-pad" : "decimal-pad"}
                  maxLength={16}
                  onChangeText={(next) => dispatch({ type: "select-value", value: normalizeNumericDraft(next) })}
                  placeholder="0"
                  style={[styles.keypadInput, quantityPrecisionError && styles.keypadInputInvalid]}
                  value={state.selectedValue}
                />
                <Text style={styles.keypadUnit}>{state.selectedUnit}</Text>
              </View>
              {quantityPrecisionError ? <Text accessibilityLiveRegion="polite" style={styles.validationError}>{quantityPrecisionError}</Text> : null}
            </View>
          )}

          {kind === "quantity" && quantityParts.preservedValue ? <Text style={styles.legacyValue}>기존값 {quantityParts.preservedValue}</Text> : null}

          {kind !== "unit" && !optionOnly && !eighthInch ? <WaflInputModeSwitch mode={state.mode === "reel" ? "picker" : "direct"} onPress={toggleMode} /> : null}
          {footer}

    </WaflInputSheet>
  );
}

const styles = StyleSheet.create({
  reels: { alignItems: "flex-end", flexDirection: "row", gap: 12, marginTop: 14 },
  optionReel: { marginTop: 14 },
  numberReel: { flex: 1, minWidth: 0 },
  intervalReel: { flexBasis: 108, flexGrow: 0, flexShrink: 1, minWidth: 84 },
  unitOnlyReel: { flex: 1, minWidth: 0 },
  reelLabel: { color: "#65594e", fontFamily: WAFL_FONTS.semibold, fontSize: 11, marginBottom: 5 },
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
  keypadPanel: { marginTop: 14 },
  keypadRow: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: WAFL_THEME.color.editActive, borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingRight: 12 },
  keypadRowInvalid: { backgroundColor: "#fff9f7", borderColor: WAFL_THEME.color.error },
  keypadInput: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.black, fontSize: 22, minHeight: 58, paddingHorizontal: 14 },
  keypadInputInvalid: { backgroundColor: "#fff9f7", color: WAFL_THEME.color.error },
  keypadUnit: { color: "#67584c", fontFamily: WAFL_FONTS.bold, fontSize: 14 },
  validationError: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.medium, fontSize: 11, lineHeight: 16, marginTop: WAFL_THEME.spacing.xs },
  legacyValue: { color: "#75695d", fontFamily: WAFL_FONTS.medium, fontSize: 10, marginTop: 6 },
});
