"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { enUS, ko } from "date-fns/locale";

import { AdminButton } from "@/components/admin/common/AdminButton";

export type AdminDateRangePickerLabels = {
  start: string;
  end: string;
  clear: string;
  done: string;
  selected: string;
  notSelected: string;
  calendarAria: string;
};

export function parseAdminLocalDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toAdminLocalDateValue(date: Date | undefined) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayAdminLocalDateValue() {
  return toAdminLocalDateValue(new Date());
}

export function formatAdminDateDisplay(value: string, locale: "ko" | "en") {
  const date = parseAdminLocalDateValue(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type AdminDateRangePickerProps = {
  startDate: string;
  endDate: string;
  maxDateValue: string;
  labels: AdminDateRangePickerLabels;
  locale: "ko" | "en";
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function AdminDateRangePicker({
  startDate,
  endDate,
  maxDateValue,
  labels,
  locale,
  onStartDateChange,
  onEndDateChange,
}: AdminDateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedStartDate = parseAdminLocalDateValue(startDate);
  const selectedEndDate = parseAdminLocalDateValue(endDate);
  const selected: DateRange | undefined = selectedStartDate
    ? { from: selectedStartDate, to: selectedEndDate }
    : undefined;
  const maxDate = parseAdminLocalDateValue(maxDateValue);
  const dayPickerLocale = locale === "ko" ? ko : enUS;

  useEffect(() => {
    if (!isCalendarOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (event.target instanceof Node && pickerRef.current.contains(event.target)) return;
      setIsCalendarOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCalendarOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCalendarOpen]);

  const handleSelect = (range: DateRange | undefined) => {
    const nextStart = toAdminLocalDateValue(range?.from);
    const nextEnd = toAdminLocalDateValue(range?.to);
    onStartDateChange(nextStart);
    onEndDateChange(nextEnd);
  };

  const clearSelection = () => {
    onStartDateChange("");
    onEndDateChange("");
  };

  const selectedSummary = startDate && endDate
    ? labels.selected.replace("{start}", formatAdminDateDisplay(startDate, locale)).replace("{end}", formatAdminDateDisplay(endDate, locale))
    : labels.notSelected;

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsCalendarOpen((current) => !current)}
        className="flex w-full min-w-[280px] flex-col gap-1 rounded-2xl border border-stone-100 bg-white p-1 text-left shadow-sm transition hover:border-stone-200 hover:bg-stone-50 sm:flex-row"
        aria-expanded={isCalendarOpen}
        aria-label={labels.calendarAria}
      >
        <span className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">{labels.start}</span>
          <span className="mt-0.5 block text-xs font-semibold text-stone-800">{formatAdminDateDisplay(startDate, locale)}</span>
        </span>
        <span className="min-w-0 flex-1 rounded-xl bg-stone-50 px-3 py-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">{labels.end}</span>
          <span className="mt-0.5 block text-xs font-semibold text-stone-800">{formatAdminDateDisplay(endDate, locale)}</span>
        </span>
      </button>

      {isCalendarOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[min(320px,calc(100vw-3rem))] rounded-[22px] border border-stone-100 bg-white p-3 shadow-2xl">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            locale={dayPickerLocale}
            disabled={maxDate ? { after: maxDate } : undefined}
            showOutsideDays
            fixedWeeks
            aria-label={labels.calendarAria}
            classNames={{
              root: "text-sm text-stone-700",
              months: "grid gap-3",
              month: "space-y-2",
              month_caption: "flex items-center justify-center px-2 py-1 text-sm font-semibold text-stone-950",
              caption_label: "text-sm font-semibold",
              nav: "flex items-center justify-between",
              button_previous: "rounded-full border border-stone-200 px-2 py-1 text-stone-500 hover:bg-stone-50",
              button_next: "rounded-full border border-stone-200 px-2 py-1 text-stone-500 hover:bg-stone-50",
              weekdays: "grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400",
              week: "grid grid-cols-7 gap-1",
              day: "flex items-center justify-center",
              day_button: "h-7 w-7 rounded-full text-[11px] font-semibold transition hover:bg-stone-100 disabled:text-stone-300",
              today: "font-bold text-[var(--admin-theme-surface)]",
              selected: "rounded-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_start: "rounded-l-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_end: "rounded-r-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_middle: "rounded-none bg-stone-100 text-stone-900",
              outside: "text-stone-300",
              disabled: "text-stone-300 opacity-40",
            }}
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <p className="min-w-0 flex-1 text-xs font-semibold text-stone-500">{selectedSummary}</p>
            <div className="flex shrink-0 items-center gap-2">
              <AdminButton type="button" onClick={clearSelection} variant="secondary" size="sm" className="min-h-8 px-3 py-1.5 text-xs">
                {labels.clear}
              </AdminButton>
              <AdminButton type="button" onClick={() => setIsCalendarOpen(false)} variant="primary" size="sm" className="min-h-8 px-3 py-1.5 text-xs">
                {labels.done}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
