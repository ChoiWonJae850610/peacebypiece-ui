import { useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react-native";

import { WAFL_FONTS } from "@/constants/fonts";
import { useDatePickerState } from "@/hooks/useDatePickerState";
import { formatKoreanCalendarDate } from "@/lib/mobileDisplay";

type Props = {
  readonly active: boolean;
  readonly editable: boolean;
  readonly value: string;
  readonly displayValue: string;
  readonly saving: boolean;
  readonly errorMessage?: string | null;
  readonly onActivate: () => void;
  readonly onCancel: () => void;
  readonly onCommit: (value: string) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function koreanDate(value: string) {
  return formatKoreanCalendarDate(value);
}

function currentCalendarDate() {
  const today = new Date();
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
}

export default function InlineDatePicker({
  active, editable, value, displayValue, saving, errorMessage,
  onActivate, onCancel, onCommit,
}: Props) {
  const insets = useSafeAreaInsets();
  const todayValue = currentCalendarDate();
  const { state, dispatch, close } = useDatePickerState(active, value, todayValue);
  const open = state.phase !== "closed";
  const dirty = open && state.draftValue !== value;

  const cells = useMemo(() => {
    const firstWeekday = new Date(state.visibleYear, state.visibleMonth, 1).getDay();
    const daysInMonth = new Date(state.visibleYear, state.visibleMonth + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    });
  }, [state.visibleMonth, state.visibleYear]);

  const cancel = () => {
    close();
    onCancel();
  };

  const commit = () => {
    if (!dirty || saving) return;
    const nextValue = state.draftValue;
    dispatch({ type: "begin-commit" });
    close();
    onCommit(nextValue);
  };

  if (!active) {
    if (!editable) return <Text style={styles.display}>{displayValue ? koreanDate(displayValue) : "미정"}</Text>;
    return (
      <Pressable
        accessibilityHint="월간 달력에서 납기일을 선택합니다."
        accessibilityLabel="납기일, 수정 가능"
        accessibilityRole="button"
        onPress={onActivate}
        style={({ pressed }) => [styles.editable, pressed && styles.pressed]}
        testID="overview-inline-due-date"
      >
        <Text style={styles.display}>{displayValue ? koreanDate(displayValue) : "날짜 선택"}</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        accessibilityLabel="납기일 달력 다시 열기"
        accessibilityRole="button"
        disabled={open || saving}
        onPress={() => dispatch({ type: "open", value, today: todayValue })}
        style={styles.activeAnchor}
        testID="overview-inline-due-date"
      >
        <Text style={styles.display}>{value ? koreanDate(value) : "날짜 선택"}</Text>
      </Pressable>
      <Modal animationType="slide" onRequestClose={cancel} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel="납기일 선택 취소" onPress={cancel} style={StyleSheet.absoluteFill} />
          <View
            accessibilityLabel="납기일 월간 달력"
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) }]}
            testID="wafl-date-picker-sheet"
          >
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.eyebrow}>작업지시서</Text>
                <Text style={styles.title}>납기일 선택</Text>
              </View>
              <Pressable accessibilityLabel="변경 취소" accessibilityRole="button" disabled={saving} onPress={cancel} style={styles.cancelButton}>
                <X color="#554a40" size={19} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View style={styles.calendarHeader}>
              <Pressable accessibilityLabel="이전 달" accessibilityRole="button" onPress={() => dispatch({ type: "previous-month" })} style={styles.iconButton}>
                <ChevronLeft color="#3f352d" size={20} />
              </Pressable>
              <Text style={styles.monthTitle}>{state.visibleYear}년 {state.visibleMonth + 1}월</Text>
              <Pressable accessibilityLabel="다음 달" accessibilityRole="button" onPress={() => dispatch({ type: "next-month" })} style={styles.iconButton}>
                <ChevronRight color="#3f352d" size={20} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>{WEEKDAYS.map((weekday) => <Text key={weekday} style={styles.weekday}>{weekday}</Text>)}</View>
            <View style={styles.dayGrid}>
              {cells.map((day, index) => {
                if (day === null) return <View key={`blank-${index}`} style={styles.dayCell} />;
                const dayValue = `${state.visibleYear}-${pad(state.visibleMonth + 1)}-${pad(day)}`;
                const selected = dayValue === state.draftValue;
                const stored = dayValue === value;
                const today = dayValue === todayValue;
                return (
                  <Pressable
                    accessibilityLabel={`${state.visibleYear}년 ${state.visibleMonth + 1}월 ${day}일`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={dayValue}
                    onPress={() => dispatch({ type: "select", value: dayValue })}
                    style={[styles.dayCell, today && styles.today, stored && styles.storedDay, selected && styles.selectedDay]}
                  >
                    <Text style={[styles.dayText, selected && styles.selectedDayText]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.selectionSummary}>
              <Text style={styles.selectionLabel}>선택한 날짜</Text>
              <Text style={styles.selectionValue}>{state.draftValue ? koreanDate(state.draftValue) : "납기일 없음"}</Text>
            </View>
            {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

            <View style={styles.footer}>
              <Pressable accessibilityLabel="납기일 지우기" accessibilityRole="button" disabled={saving} onPress={() => dispatch({ type: "clear" })} style={styles.clearButton}>
                <Text style={styles.clearText}>납기일 지우기</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="변경 저장"
                accessibilityRole="button"
                accessibilityState={{ disabled: !dirty || saving }}
                disabled={!dirty || saving}
                onPress={commit}
                style={[styles.saveButton, (!dirty || saving) && styles.disabled]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Check color="#fff" size={19} strokeWidth={2.5} />}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  editable: { backgroundColor: "#fffaf2", borderBottomColor: "#b98c5a", borderBottomWidth: 1, borderRadius: 5, minHeight: 36, paddingHorizontal: 4, paddingVertical: 6 },
  activeAnchor: { backgroundColor: "#fff9ed", borderColor: "#8b5e3c", borderRadius: 7, borderWidth: 1, minHeight: 44, paddingHorizontal: 8, paddingVertical: 9 },
  display: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 11, lineHeight: 17 },
  backdrop: { backgroundColor: "rgba(20, 28, 40, 0.44)", flex: 1, justifyContent: "flex-end" },
  sheet: { alignSelf: "center", backgroundColor: "#fffdf8", borderTopLeftRadius: 18, borderTopRightRadius: 18, maxWidth: 520, paddingHorizontal: 16, paddingTop: 14, width: "100%" },
  titleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: "#9b4a27", fontFamily: WAFL_FONTS.bold, fontSize: 9, letterSpacing: 0.7 },
  title: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 17, marginTop: 1 },
  calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  iconButton: { alignItems: "center", height: 40, justifyContent: "center", width: 44 },
  monthTitle: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 15 },
  weekRow: { flexDirection: "row", marginTop: 1 },
  weekday: { color: "#75695d", fontFamily: WAFL_FONTS.semibold, fontSize: 10, lineHeight: 22, textAlign: "center", width: `${100 / 7}%` },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 1 },
  dayCell: { alignItems: "center", aspectRatio: 1.18, borderRadius: 999, justifyContent: "center", width: `${100 / 7}%` },
  today: { borderColor: "#b98c5a", borderWidth: 1 },
  storedDay: { borderColor: "#75695d", borderWidth: 1 },
  selectedDay: { backgroundColor: "#23375a", borderColor: "#23375a" },
  dayText: { color: "#3f352d", fontFamily: WAFL_FONTS.medium, fontSize: 12 },
  selectedDayText: { color: "#fff", fontFamily: WAFL_FONTS.bold },
  selectionSummary: { alignItems: "center", backgroundColor: "#f7f0e5", borderRadius: 9, flexDirection: "row", gap: 12, justifyContent: "space-between", marginTop: 7, minHeight: 38, paddingHorizontal: 10 },
  selectionLabel: { color: "#75695d", fontFamily: WAFL_FONTS.medium, fontSize: 10 },
  selectionValue: { color: "#17263d", fontFamily: WAFL_FONTS.bold, fontSize: 12 },
  error: { color: "#a13933", fontFamily: WAFL_FONTS.regular, fontSize: 10, marginTop: 6 },
  footer: { alignItems: "center", borderTopColor: "#eadfce", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 9, paddingTop: 9 },
  clearButton: { justifyContent: "center", minHeight: 44, paddingHorizontal: 4 },
  clearText: { color: "#874423", fontFamily: WAFL_FONTS.bold, fontSize: 11 },
  cancelButton: { alignItems: "center", backgroundColor: "#fffdf8", borderColor: "#baa997", borderRadius: 8, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  saveButton: { alignItems: "center", backgroundColor: "#23375a", borderRadius: 8, height: 44, justifyContent: "center", width: 44 },
  disabled: { opacity: 0.4 },
});
