import { useCallback, useMemo, useReducer, useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
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
import { INITIAL_REEL_PICKER_STATE, reelPickerReducer } from "./reelPickerState";
import { composeInchMeasurement, decomposeInchMeasurement, inchEighthOptions } from "@/domain/measurementPolicy";
import { WAFL_UNSET_PLACEHOLDER } from "@/lib/displayPlaceholder";
import { resolveWaflPickerRenderPath, type WaflPickerKind } from "./waflPickerRenderPolicy";
import { resolveWaflReelAdaptiveBodyHeight } from "./waflReelSheetSizingPolicy";
import { useExternalReelVisibilityLifecycle } from "./useExternalReelVisibilityLifecycle";
import {
  exceedsMaterialQuantityPrecision,
  materialQuantityPrecisionMessage,
} from "@/domain/materialQuantityPrecision";
import { resolveWaflReelOpeningValue } from "./waflRequiredChoicePolicy";
import type { WaflDecisionChoiceState } from "@/features/feedback/WaflDecisionChoiceBody";
import { FiniteOptionReelColumn, platformReelHaptics, ReelColumn, WaflOptionReel } from "./WaflOptionReel";

export { WaflOptionReel } from "./WaflOptionReel";

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
  readonly requireSpecifiedValue?: boolean;
  readonly selectFirstRealOption?: boolean;
  readonly emptyMessage?: string;
  readonly footer?: ReactNode;
  readonly pending?: boolean;
  readonly decision?: WaflDecisionChoiceState | null;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onApply: (value: string, unitCode: string) => Promise<unknown> | unknown;
};

export function WaflPairedOptionReelPickerSheet(props: {
  readonly visible: boolean;
  readonly title: string;
  readonly leftLabel: string;
  readonly leftAccessibilityLabel: string;
  readonly leftOptions: readonly WaflPickerOption[];
  readonly leftValue: string;
  readonly onSelectLeft: (value: string) => void;
  readonly rightLabel: string;
  readonly rightAccessibilityLabel: string;
  readonly rightOptions: readonly WaflPickerOption[];
  readonly rightValue: string;
  readonly onSelectRight: (value: string) => void;
  readonly footer?: ReactNode;
  readonly presentationGeneration?: number;
  readonly onCancel: () => void;
  readonly onAfterClose?: () => void;
  readonly onApply: () => Promise<unknown> | unknown;
}) {
  const leftOptions = useMemo<readonly ReelOption[]>(() => props.leftOptions.map((option, index) => ({
    key: `paired-left-${option.value}-${index}`,
    label: option.label,
    value: option.value,
  })), [props.leftOptions]);
  const rightOptions = useMemo<readonly ReelOption[]>(() => props.rightOptions.map((option, index) => ({
    key: `paired-right-${option.value}-${index}`,
    label: option.label,
    value: option.value,
  })), [props.rightOptions]);
  const adaptiveMinimumBodyHeight = resolveWaflReelAdaptiveBodyHeight({
    hasModeSwitch: Boolean(props.footer),
    hasSupplementaryControl: false,
    hasValidationMessage: false,
    renderPath: "numeric-reel",
  });
  return <WaflInputSheet
    adaptiveMinimumBodyHeight={adaptiveMinimumBodyHeight}
    bodyScrollable={false}
    cancelAccessibilityLabel={`${props.title} 변경 취소`}
    confirmAccessibilityLabel={`${props.title} 적용`}
    confirmDisabled={!props.leftValue || !props.rightValue}
    onAfterClose={props.onAfterClose}
    onCancel={props.onCancel}
    onConfirm={props.onApply}
    presentationGeneration={props.presentationGeneration}
    sizing="reelAdaptive"
    title={props.title}
    visible={props.visible}
  >
    <View style={styles.reels}>
      <View style={styles.pairedOptionReel}>
        <Text style={styles.reelLabel}>{props.leftLabel}</Text>
        <WaflOptionReel accessibilityLabel={props.leftAccessibilityLabel} onSelect={props.onSelectLeft} options={leftOptions} selectedValue={props.leftValue} />
      </View>
      <View style={styles.pairedOptionReel}>
        <Text style={styles.reelLabel}>{props.rightLabel}</Text>
        <WaflOptionReel accessibilityLabel={props.rightAccessibilityLabel} onSelect={props.onSelectRight} options={rightOptions} selectedValue={props.rightValue} />
      </View>
    </View>
    {props.footer}
  </WaflInputSheet>;
}

export function WaflStaticOptionList(props: {
  readonly accessibilityLabel: string;
  readonly options: readonly ReelOption[];
  readonly selectedValue: string;
  readonly onSelect: (value: string) => void;
}) {
  return <View accessibilityLabel={props.accessibilityLabel} accessibilityRole="radiogroup" style={styles.staticOptionList}>
    {props.options.map((item) => {
      const selected = item.value === props.selectedValue;
      return <Pressable
        accessibilityLabel={item.label || item.value}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        key={item.key}
        onPress={() => {
          if (selected) return;
          platformReelHaptics.selectionChanged(props.options.findIndex((candidate) => candidate.key === item.key));
          props.onSelect(item.value);
        }}
        style={({ pressed }) => [styles.staticOption, selected && styles.staticOptionSelected, pressed && styles.staticOptionPressed]}
      >
        <Text numberOfLines={2} style={[styles.staticOptionText, selected && styles.staticOptionTextSelected]}>{item.label || item.value}</Text>
      </Pressable>;
    })}
  </View>;
}

export default function WaflReelPickerSheet({ visible, field, label, value, unitCode, kind = "quantity", options = [], optionItems: suppliedOptionItems, allowUnset = false, requireSpecifiedValue = false, selectFirstRealOption = false, emptyMessage = "선택할 수 있는 항목이 없습니다.", footer, pending = false, decision = null, presentationGeneration, onCancel, onAfterClose, onApply }: Props) {
  const integerOnly = kind === "integer";
  const optionOnly = kind === "option";
  const eighthInch = kind === "eighth-inch";
  const [state, dispatch] = useReducer(reelPickerReducer, INITIAL_REEL_PICKER_STATE);
  const [windowAnchor, setWindowAnchor] = useState(value);
  const openValue = resolveWaflReelOpeningValue({
    candidateValues: (suppliedOptionItems ?? options.map((option) => ({ value: option, label: option }))).map((option) => option.value),
    currentValue: value,
    stageFirstRealOption: selectFirstRealOption,
  });
  const openExternalSession = useCallback(() => {
    const stagedOpeningValue = optionOnly || kind === "unit" || eighthInch
      ? openValue
      : normalizeReelValue(openValue) ?? openValue;
    setWindowAnchor(stagedOpeningValue);
    dispatch({
      type: "open",
      field,
      label,
      value: stagedOpeningValue,
      unit: unitCode.trim() || materialUnitOptions("")[0] || "개",
      step: integerOnly || eighthInch ? "1" : defaultReelStep(unitCode),
    });
  }, [eighthInch, field, integerOnly, kind, label, openValue, optionOnly, unitCode]);
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
      ? !optionItems.some((option) => option.value === state.selectedValue) || (requireSpecifiedValue && !state.selectedValue.trim())
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
      decision={decision}
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
              <Text style={styles.reelLabel}>{label}</Text>
              {optionItems.length ? <WaflOptionReel
                accessibilityLabel={`${label} 선택 릴`}
                onSelect={(next) => selectOption(next, optionItems.findIndex((option) => option.value === next))}
                options={optionItems}
                selectedValue={state.selectedValue}
              /> : <View accessibilityRole="text" style={styles.emptyState}><Text style={styles.emptyStateText}>{emptyMessage}</Text></View>}
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
  pairedOptionReel: { flex: 1, minWidth: 0 },
  optionReel: { marginTop: 14 },
  emptyState: { alignItems: "center", justifyContent: "center", minHeight: 180, paddingHorizontal: WAFL_THEME.spacing.lg },
  emptyStateText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.medium, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, textAlign: "center" },
  numberReel: { flex: 1, minWidth: 0 },
  intervalReel: { flexBasis: 108, flexGrow: 0, flexShrink: 1, minWidth: 84 },
  unitOnlyReel: { flex: 1, minWidth: 0 },
  reelLabel: { color: "#65594e", fontFamily: WAFL_FONTS.semibold, fontSize: 11, marginBottom: 5 },
  staticOptionList: { gap: WAFL_THEME.spacing.xs },
  staticOption: { alignItems: "center", borderBottomColor: WAFL_THEME.color.border, borderBottomWidth: WAFL_THEME.border.hairline, justifyContent: "center", minHeight: WAFL_THEME.touch.minimum, paddingHorizontal: WAFL_THEME.spacing.sm },
  staticOptionSelected: { backgroundColor: WAFL_THEME.color.fabricBeige, borderBottomColor: WAFL_THEME.color.brickOrange },
  staticOptionPressed: { opacity: 0.68 },
  staticOptionText: { color: WAFL_THEME.color.readOnly, fontFamily: WAFL_FONTS.semibold, fontSize: WAFL_THEME.typography.bodyText.fontSize, lineHeight: WAFL_THEME.typography.bodyText.lineHeight, textAlign: "center" },
  staticOptionTextSelected: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.black },
  keypadPanel: { marginTop: 14 },
  keypadRow: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: WAFL_THEME.color.editActive, borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingRight: 12 },
  keypadRowInvalid: { backgroundColor: "#fff9f7", borderColor: WAFL_THEME.color.error },
  keypadInput: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.black, fontSize: 22, minHeight: 58, paddingHorizontal: 14 },
  keypadInputInvalid: { backgroundColor: "#fff9f7", color: WAFL_THEME.color.error },
  keypadUnit: { color: "#67584c", fontFamily: WAFL_FONTS.bold, fontSize: 14 },
  validationError: { color: WAFL_THEME.color.error, fontFamily: WAFL_FONTS.medium, fontSize: 11, lineHeight: 16, marginTop: WAFL_THEME.spacing.xs },
  legacyValue: { color: "#75695d", fontFamily: WAFL_FONTS.medium, fontSize: 10, marginTop: 6 },
});
