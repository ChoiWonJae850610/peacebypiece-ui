"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { enUS, ko } from "date-fns/locale";

import { AdminButton } from "@/components/admin/common/AdminButton";
import {
  formatPbpDateDisplay,
  getTodayPbpLocalDateValue,
  parsePbpLocalDateValue,
  toPbpLocalDateValue,
} from "@/lib/date/localDate";

export type AdminDateRangePickerLabels = {
  start: string;
  end: string;
  clear: string;
  done: string;
  selected: string;
  notSelected: string;
  calendarAria: string;
};

export const parseAdminLocalDateValue = parsePbpLocalDateValue;
export const toAdminLocalDateValue = toPbpLocalDateValue;
export const getTodayAdminLocalDateValue = getTodayPbpLocalDateValue;
export const formatAdminDateDisplay = formatPbpDateDisplay;

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

  return (
    <div ref={pickerRef} className="relative w-full min-w-0 md:max-w-[360px]">
      <button
        type="button"
        onClick={() => setIsCalendarOpen((current) => !current)}
        className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-[16px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-1 text-left shadow-[var(--pbp-shadow-card)] transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]"
        aria-expanded={isCalendarOpen}
        aria-label={labels.calendarAria}
      >
        <span className="min-w-0 rounded-xl bg-[var(--pbp-surface-muted)] px-2 py-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--pbp-text-subtle)]">{labels.start}</span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--pbp-text-primary)]">{formatAdminDateDisplay(startDate, locale)}</span>
        </span>
        <span className="min-w-0 rounded-xl bg-[var(--pbp-surface-muted)] px-2 py-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--pbp-text-subtle)]">{labels.end}</span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--pbp-text-primary)]">{formatAdminDateDisplay(endDate, locale)}</span>
        </span>
      </button>

      {isCalendarOpen ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-fit max-w-[calc(100vw-2rem)] max-h-[min(340px,calc(100vh-4rem))] overflow-y-auto rounded-[18px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-1.5 shadow-2xl">
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
              root: "w-[166px] text-sm text-[var(--pbp-text-muted)]",
              months: "grid w-full gap-1",
              month: "w-full space-y-1",
              month_caption: "flex items-center justify-center px-0.5 py-0.5 text-[11px] font-semibold text-[var(--pbp-text-primary)]",
              caption_label: "text-xs font-semibold",
              nav: "flex w-full items-center justify-between",
              button_previous: "h-6 w-6 rounded-full border border-[var(--pbp-border)] text-[var(--pbp-text-muted)] hover:bg-[var(--pbp-surface-muted)]",
              button_next: "h-6 w-6 rounded-full border border-[var(--pbp-border)] text-[var(--pbp-text-muted)] hover:bg-[var(--pbp-surface-muted)]",
              weekdays: "grid w-full grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--pbp-text-subtle)]",
              week: "grid w-full grid-cols-7 gap-0",
              day: "flex h-5 w-full items-center justify-center",
              day_button: "mx-auto h-5 w-5 rounded-full text-[10px] font-semibold transition hover:bg-[var(--pbp-surface-muted)] disabled:text-[var(--pbp-text-subtle)]",
              today: "font-bold text-[var(--admin-theme-surface)]",
              selected: "rounded-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_start: "rounded-l-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_end: "rounded-r-full bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]",
              range_middle: "rounded-none bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-primary)]",
              outside: "text-[var(--pbp-text-subtle)]",
              disabled: "text-[var(--pbp-text-subtle)] opacity-40",
            }}
          />
          <div className="mt-1.5 flex w-[166px] items-center justify-between gap-1.5 border-t border-[var(--pbp-border)] pt-1.5">
            <AdminButton
              type="button"
              onClick={clearSelection}
              variant="icon"
              size="sm"
              aria-label={labels.clear}
              title={labels.clear}
              className="shrink-0 text-[var(--pbp-action-ghost-text)]"
            >
              <RotateCcw className="h-3.5 w-3.5 text-current" strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">{labels.clear}</span>
            </AdminButton>
            <AdminButton
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              variant="primary"
              size="sm"
              aria-label={labels.done}
              title={labels.done}
              className="shrink-0 text-[var(--pbp-action-primary-text)]"
            >
              <Check className="h-3.5 w-3.5 text-current" strokeWidth={2.4} aria-hidden="true" />
              <span className="sr-only">{labels.done}</span>
            </AdminButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
