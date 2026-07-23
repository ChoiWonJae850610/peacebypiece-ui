import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Check, Keyboard, RotateCcw, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WAFL_FONTS } from "@/constants/fonts";
import { WAFL_THEME } from "@/constants/theme";
import { normalizeNumericDraft } from "@/lib/mobileDisplay";
import {
  createReelWindow,
  defaultReelStep,
  materialUnitOptions,
  normalizeReelValue,
  reelIndexForValue,
  reelStepOptions,
  reelValueAtIndex,
  type ReelOption,
  type ReelStep,
} from "./reelPickerModel";
import { noOpReelHaptics } from "./reelPickerHaptics";
import { INITIAL_REEL_PICKER_STATE, reelPickerReducer } from "./reelPickerState";

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const REEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

export type ReelPickerKind = "quantity" | "unit" | "integer";

type Props = {
  readonly visible: boolean;
  readonly field: string;
  readonly label: string;
  readonly value: string;
  readonly unitCode: string;
  readonly kind?: ReelPickerKind;
  readonly onCancel: () => void;
  readonly onApply: (value: string, unitCode: string) => void;
};

function scrollIndex(event: NativeSyntheticEvent<NativeScrollEvent>, itemCount: number) {
  return Math.max(0, Math.min(itemCount - 1, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)));
}

function ReelColumn({
  accessibilityLabel,
  options,
  selectedIndex,
  onSelect,
  compact = false,
}: {
  readonly accessibilityLabel: string;
  readonly options: readonly ReelOption[];
  readonly selectedIndex: number;
  readonly onSelect: (index: number) => void;
  readonly compact?: boolean;
}) {
  const ref = useRef<FlatList<ReelOption>>(null);
  const selectedIndexRef = useRef(selectedIndex);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => ref.current?.scrollToIndex({
      animated: false,
      index: selectedIndexRef.current,
    }));
    return () => cancelAnimationFrame(frame);
  }, [options]);
  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.reelColumn, compact && styles.unitColumn]}>
      <FlatList
        ref={ref}
        accessibilityRole="adjustable"
        contentContainerStyle={styles.reelContent}
        data={options}
        decelerationRate="fast"
        disableIntervalMomentum
        extraData={selectedIndex}
        getItemLayout={(_data, index) => ({ index, length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index })}
        initialScrollIndex={selectedIndex}
        keyExtractor={(item) => item.key}
        onMomentumScrollEnd={(event) => onSelect(scrollIndex(event, options.length))}
        onScrollEndDrag={(event) => {
          if (Math.abs(event.nativeEvent.velocity?.y ?? 0) < 0.05) onSelect(scrollIndex(event, options.length));
        }}
        renderItem={({ item, index }) => {
          const distance = Math.abs(index - selectedIndex);
          return (
            <View style={styles.reelItem}>
              <Text numberOfLines={1} style={[styles.reelText, distance === 0 ? styles.reelTextSelected : distance === 1 ? styles.reelTextNear : styles.reelTextFar]}>{item.value}</Text>
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

export default function WaflReelPickerSheet({ visible, field, label, value, unitCode, kind = "quantity", onCancel, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const integerOnly = kind === "integer";
  const [state, dispatch] = useReducer(reelPickerReducer, INITIAL_REEL_PICKER_STATE, (initial) => reelPickerReducer(initial, {
    type: "open",
    field,
    label,
    value,
    unit: unitCode.trim() || materialUnitOptions("")[0] || "개",
    step: integerOnly ? "1" : defaultReelStep(unitCode),
  }));
  const [windowAnchor, setWindowAnchor] = useState(value);
  const numberWindow = useMemo(() => createReelWindow(windowAnchor, state.step), [state.step, windowAnchor]);
  const unitOptions = useMemo<readonly ReelOption[]>(
    () => materialUnitOptions(state.selectedUnit || unitCode).map((option) => ({ key: option, value: option })),
    [state.selectedUnit, unitCode],
  );
  const unitIndex = Math.max(0, unitOptions.findIndex((option) => option.value === state.selectedUnit));
  const stepOptions = useMemo(() => reelStepOptions(integerOnly), [integerOnly]);
  const stepIndex = Math.max(0, stepOptions.findIndex((option) => option.value === state.step));
  const numberIndex = reelIndexForValue(numberWindow, state.selectedValue);
  const normalized = normalizeReelValue(state.selectedValue);
  const applyDisabled = kind === "unit" ? !state.selectedUnit.trim() : normalized === null;

  function cancel() {
    dispatch({ type: "cancel" });
    onCancel();
  }

  function apply() {
    if (applyDisabled) return;
    dispatch({ type: "apply" });
    onApply(normalized ?? state.selectedValue, state.selectedUnit.trim());
  }

  function selectNumber(index: number) {
    const next = reelValueAtIndex(numberWindow, index);
    if (next !== state.selectedValue) noOpReelHaptics.selectionChanged(index);
    dispatch({ type: "select-value", value: next });
  }

  function selectUnit(index: number) {
    const next = unitOptions[index]?.value;
    if (!next || next === state.selectedUnit) return;
    noOpReelHaptics.selectionChanged(index);
    dispatch({ type: "select-unit", unit: next });
  }

  function selectStep(index: number) {
    const step = stepOptions[index]?.value as ReelStep | undefined;
    if (!step || step === state.step) return;
    noOpReelHaptics.selectionChanged(index);
    setWindowAnchor(state.selectedValue);
    dispatch({ type: "select-step", step });
  }

  function toggleMode() {
    const nextMode = state.mode === "reel" ? "keypad" : "reel";
    if (nextMode === "reel") setWindowAnchor(state.selectedValue);
    dispatch({ type: "set-mode", mode: nextMode });
  }

  return (
    <Modal animationType="slide" onRequestClose={cancel} presentationStyle="overFullScreen" transparent visible={visible && state.phase === "open"}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalRoot}>
        <Pressable accessibilityLabel="릴 피커 닫기" onPress={cancel} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>WAFL INPUT</Text>
              <Text style={styles.title}>{label}</Text>
              <Text style={styles.caption}>X는 변경을 취소하고 Check는 이 필드의 편집을 완료합니다.</Text>
            </View>
          </View>

          {state.mode === "reel" ? (
            <View style={styles.reels}>
              {kind !== "unit" ? <View style={styles.numberReel}>
                <Text style={styles.reelLabel}>{kind === "integer" ? "수량" : "수량"}</Text>
                <ReelColumn accessibilityLabel={`${label} 숫자 릴`} onSelect={selectNumber} options={numberWindow.options} selectedIndex={numberIndex} />
              </View> : null}
              {kind === "unit" ? <View style={styles.unitOnlyReel}>
                <Text style={styles.reelLabel}>단위</Text>
                <ReelColumn accessibilityLabel="원단 단위 릴" compact onSelect={selectUnit} options={unitOptions} selectedIndex={unitIndex} />
              </View> : <View style={styles.intervalReel}>
                <Text style={styles.reelLabel}>간격</Text>
                <ReelColumn accessibilityLabel={`${label} 간격 릴`} compact onSelect={selectStep} options={stepOptions} selectedIndex={stepIndex} />
              </View>}
            </View>
          ) : (
            <View style={styles.keypadPanel}>
              <Text style={styles.reelLabel}>숫자 직접 입력</Text>
              <View style={styles.keypadRow}>
                <TextInput
                  accessibilityLabel={`${label} 숫자 직접 입력`}
                  autoFocus
                  keyboardType={kind === "integer" ? "number-pad" : "decimal-pad"}
                  maxLength={16}
                  onChangeText={(next) => dispatch({ type: "select-value", value: normalizeNumericDraft(next) })}
                  placeholder="0"
                  style={styles.keypadInput}
                  value={state.selectedValue}
                />
                <Text style={styles.keypadUnit}>{state.selectedUnit}</Text>
              </View>
            </View>
          )}

          {kind !== "unit" ? <Pressable
            accessibilityLabel={state.mode === "reel" ? "숫자 키패드로 직접 입력" : "릴 피커로 입력"}
            accessibilityRole="button"
            onPress={toggleMode}
            style={styles.modeButton}
          >
            {state.mode === "reel" ? <Keyboard color={WAFL_THEME.color.navyInk} size={17} /> : <RotateCcw color={WAFL_THEME.color.navyInk} size={17} />}
            <Text style={styles.modeText}>{state.mode === "reel" ? "숫자 직접 입력" : "릴로 선택"}</Text>
          </Pressable> : null}

          <View style={styles.actions}>
            <Pressable accessibilityLabel="변경 취소" accessibilityRole="button" onPress={cancel} style={styles.cancelButton}>
              <X color={WAFL_THEME.color.deepNavy} size={21} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              accessibilityLabel="변경 저장"
              accessibilityRole="button"
              accessibilityState={{ disabled: applyDisabled }}
              disabled={applyDisabled}
              onPress={apply}
              style={[styles.applyButton, applyDisabled && styles.disabled]}
            >
              <Check color="#fff" size={21} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20, 29, 43, 0.36)" },
  sheet: { alignSelf: "center", backgroundColor: WAFL_THEME.color.paper, borderColor: WAFL_THEME.color.fabricBeige, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, maxWidth: 520, paddingHorizontal: 18, paddingTop: 9, width: "100%" },
  handle: { alignSelf: "center", backgroundColor: "#c8b7a3", borderRadius: 999, height: 4, marginBottom: 12, width: 42 },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { color: WAFL_THEME.color.brickOrange, fontFamily: WAFL_FONTS.bold, fontSize: 9, letterSpacing: 1.2 },
  title: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.black, fontSize: 19, marginTop: 2 },
  caption: { color: "#75695d", fontFamily: WAFL_FONTS.regular, fontSize: 10, lineHeight: 15, marginTop: 3 },
  reels: { alignItems: "flex-end", flexDirection: "row", gap: 12, marginTop: 14 },
  numberReel: { flex: 1, minWidth: 0 },
  intervalReel: { flexBasis: 108, flexGrow: 0, flexShrink: 1, minWidth: 84 },
  unitOnlyReel: { flex: 1, minWidth: 0 },
  reelLabel: { color: "#65594e", fontFamily: WAFL_FONTS.semibold, fontSize: 11, marginBottom: 5 },
  reelColumn: { backgroundColor: "#fbf5eb", borderColor: "#dfd2c2", borderRadius: 12, borderWidth: 1, height: REEL_HEIGHT, overflow: "hidden", position: "relative" },
  unitColumn: { backgroundColor: "#f4efe5" },
  reelList: { height: REEL_HEIGHT },
  reelContent: { paddingVertical: ITEM_HEIGHT * 2 },
  reelItem: { alignItems: "center", height: ITEM_HEIGHT, justifyContent: "center", paddingHorizontal: 8 },
  reelText: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.semibold, fontSize: 18 },
  reelTextSelected: { color: WAFL_THEME.color.deepNavy, fontFamily: WAFL_FONTS.black, fontSize: 22 },
  reelTextNear: { opacity: 0.58 },
  reelTextFar: { opacity: 0.24 },
  selectionBand: { borderBottomColor: WAFL_THEME.color.brickOrange, borderBottomWidth: 1, borderTopColor: WAFL_THEME.color.brickOrange, borderTopWidth: 1, height: ITEM_HEIGHT, left: 8, position: "absolute", right: 8, top: ITEM_HEIGHT * 2 },
  fadeTop: { backgroundColor: "rgba(255,253,248,0.35)", height: ITEM_HEIGHT, left: 0, position: "absolute", right: 0, top: 0 },
  fadeBottom: { backgroundColor: "rgba(255,253,248,0.35)", bottom: 0, height: ITEM_HEIGHT, left: 0, position: "absolute", right: 0 },
  keypadPanel: { marginTop: 14 },
  keypadRow: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: WAFL_THEME.color.editActive, borderRadius: 11, borderWidth: 1, flexDirection: "row", paddingRight: 12 },
  keypadInput: { color: WAFL_THEME.color.deepNavy, flex: 1, fontFamily: WAFL_FONTS.black, fontSize: 22, minHeight: 58, paddingHorizontal: 14 },
  keypadUnit: { color: "#67584c", fontFamily: WAFL_FONTS.bold, fontSize: 14 },
  modeButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, minHeight: 42, marginTop: 8, paddingHorizontal: 4 },
  modeText: { color: WAFL_THEME.color.navyInk, fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 8 },
  cancelButton: { alignItems: "center", borderColor: "#cfc2b4", borderRadius: 10, borderWidth: 1, height: 48, justifyContent: "center", width: 48 },
  applyButton: { alignItems: "center", backgroundColor: WAFL_THEME.color.navyInk, borderRadius: 10, height: 48, justifyContent: "center", width: 48 },
  disabled: { opacity: 0.4 },
});
