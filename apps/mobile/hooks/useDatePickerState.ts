import { useCallback, useEffect, useReducer, useRef } from "react";

export type DatePickerPhase = "closed" | "open-clean" | "open-dirty" | "committing";

export type DatePickerState = {
  readonly phase: DatePickerPhase;
  readonly draftValue: string;
  readonly visibleYear: number;
  readonly visibleMonth: number;
  readonly openCount: number;
  readonly closeCount: number;
};

type Action =
  | { readonly type: "open"; readonly value: string; readonly today: string }
  | { readonly type: "select"; readonly value: string }
  | { readonly type: "clear" }
  | { readonly type: "previous-month" }
  | { readonly type: "next-month" }
  | { readonly type: "begin-commit" }
  | { readonly type: "close" };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function monthFor(value: string, fallback: string) {
  const matched = DATE_PATTERN.exec(value) ?? DATE_PATTERN.exec(fallback);
  return { year: Number(matched?.[1] ?? 2000), month: Number(matched?.[2] ?? 1) - 1 };
}

export function calendarMonthCells(year: number, month: number): readonly (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

export function datePickerReducer(state: DatePickerState, action: Action): DatePickerState {
  switch (action.type) {
    case "open": {
      if (state.phase !== "closed") return state;
      const visible = monthFor(action.value, action.today);
      return {
        ...state,
        phase: "open-clean",
        draftValue: action.value,
        visibleYear: visible.year,
        visibleMonth: visible.month,
        openCount: state.openCount + 1,
      };
    }
    case "select":
      return state.phase === "closed" ? state : { ...state, phase: "open-dirty", draftValue: action.value };
    case "clear":
      return state.phase === "closed" ? state : { ...state, phase: "open-dirty", draftValue: "" };
    case "previous-month":
      return state.visibleMonth === 0
        ? { ...state, visibleYear: state.visibleYear - 1, visibleMonth: 11 }
        : { ...state, visibleMonth: state.visibleMonth - 1 };
    case "next-month":
      return state.visibleMonth === 11
        ? { ...state, visibleYear: state.visibleYear + 1, visibleMonth: 0 }
        : { ...state, visibleMonth: state.visibleMonth + 1 };
    case "begin-commit":
      return state.phase === "open-dirty" ? { ...state, phase: "committing" } : state;
    case "close":
      return state.phase === "closed" ? state : { ...state, phase: "closed", closeCount: state.closeCount + 1 };
  }
}

const INITIAL_STATE: DatePickerState = {
  phase: "closed",
  draftValue: "",
  visibleYear: 2000,
  visibleMonth: 0,
  openCount: 0,
  closeCount: 0,
};

export function useDatePickerState(active: boolean, value: string, todayValue: string) {
  const [state, dispatch] = useReducer(datePickerReducer, INITIAL_STATE);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (active && !wasActiveRef.current) dispatch({ type: "open", value, today: todayValue });
    if (!active && wasActiveRef.current) dispatch({ type: "close" });
    wasActiveRef.current = active;
  }, [active, todayValue, value]);

  const close = useCallback(() => dispatch({ type: "close" }), []);
  return { state, dispatch, close } as const;
}
