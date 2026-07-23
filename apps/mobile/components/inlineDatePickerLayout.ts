export const INLINE_DATE_PICKER_LAYOUT = {
  dayCellHeight: 36,
  dayBadgeSize: 32,
  dayBadgeBorderWidth: 1,
  dayTextLineHeight: 16,
  weekdayLineHeight: 18,
  selectionSummaryMinHeight: 34,
  footerActionSize: 44,
  compactGap: 4,
} as const;

export type DateBadgeState = "normal" | "today" | "stored" | "selected";

export function resolveDateBadgeState(input: {
  readonly today: boolean;
  readonly stored: boolean;
  readonly selected: boolean;
}): DateBadgeState {
  if (input.selected) return "selected";
  if (input.stored) return "stored";
  if (input.today) return "today";
  return "normal";
}

export function calendarGridHeight(cellCount: number) {
  if (cellCount !== 35 && cellCount !== 42) throw new Error("calendar-grid-cell-count-invalid");
  return (cellCount / 7) * INLINE_DATE_PICKER_LAYOUT.dayCellHeight;
}
