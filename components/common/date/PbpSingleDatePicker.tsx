"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { enUS, ko } from "date-fns/locale";

import {
  formatPbpDateDisplay,
  parsePbpLocalDateValue,
  toPbpLocalDateValue,
  type PbpDateLocale,
} from "@/lib/date/localDate";

export type PbpSingleDatePickerLabels = {
  label?: string;
  placeholder: string;
  clear: string;
  done: string;
  selected: string;
  calendarAria: string;
};

type PbpSingleDatePickerProps = {
  value: string;
  labels: PbpSingleDatePickerLabels;
  locale: PbpDateLocale;
  minDateValue?: string;
  maxDateValue?: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  commitOnSelect?: boolean;
  popoverMode?: "inline" | "fixed";
  popoverAlign?: "start" | "center" | "end";
  disabled?: boolean;
  className?: string;
};

export function PbpSingleDatePicker({
  value,
  labels,
  locale,
  minDateValue,
  maxDateValue,
  onChange,
  onClose,
  commitOnSelect = true,
  popoverMode = "inline",
  popoverAlign = "start",
  disabled = false,
  className = "",
}: PbpSingleDatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [fixedPopoverStyle, setFixedPopoverStyle] = useState<CSSProperties | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parsePbpLocalDateValue(value);
  const minDate = parsePbpLocalDateValue(minDateValue);
  const maxDate = parsePbpLocalDateValue(maxDateValue);
  const dayPickerLocale = locale === "ko" ? ko : enUS;

  const closeCalendar = () => {
    setIsCalendarOpen(false);
    setFixedPopoverStyle(null);
    onClose?.();
  };

  const updateFixedPopoverPosition = () => {
    if (popoverMode !== "fixed" || !buttonRef.current || typeof window === "undefined") return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, Math.max(260, window.innerWidth - 24));
    const preferredLeft = popoverAlign === "center"
      ? rect.left + rect.width / 2 - popoverWidth / 2
      : popoverAlign === "end"
        ? rect.right - popoverWidth
        : rect.left;
    const left = Math.min(Math.max(12, preferredLeft), Math.max(12, window.innerWidth - popoverWidth - 12));
    const top = Math.min(rect.bottom + 8, Math.max(12, window.innerHeight - 360));
    setFixedPopoverStyle({ left, top, width: popoverWidth });
  };

  useEffect(() => {
    if (!isCalendarOpen) return;

    updateFixedPopoverPosition();

    const handlePointerDown = (event: MouseEvent) => {
      if (!pickerRef.current) return;
      if (event.target instanceof Node && pickerRef.current.contains(event.target)) return;
      if (event.target instanceof Node && popoverRef.current?.contains(event.target)) return;
      closeCalendar();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCalendar();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateFixedPopoverPosition);
    window.addEventListener("scroll", updateFixedPopoverPosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateFixedPopoverPosition);
      window.removeEventListener("scroll", updateFixedPopoverPosition, true);
    };
  }, [isCalendarOpen, popoverMode, popoverAlign]);

  const handleSelect = (date: Date | undefined) => {
    const nextValue = toPbpLocalDateValue(date);
    onChange(nextValue);
    if (commitOnSelect) closeCalendar();
  };

  const selectedText = selectedDate ? formatPbpDateDisplay(value, locale) : labels.placeholder;
  const selectedSummary = labels.selected.replace("{date}", formatPbpDateDisplay(value, locale));
  const disabledRange = minDate && maxDate
    ? { before: minDate, after: maxDate }
    : minDate
      ? { before: minDate }
      : maxDate
        ? { after: maxDate }
        : undefined;

  const popoverContent: ReactNode = isCalendarOpen ? (
    <div
      ref={popoverRef}
      className={`${popoverMode === "fixed" ? "fixed" : "absolute left-0 top-[calc(100%+8px)]"} z-40 w-[min(320px,calc(100vw-3rem))] rounded-[22px] border border-stone-100 bg-white p-3 shadow-2xl`}
      style={popoverMode === "fixed" ? fixedPopoverStyle ?? undefined : undefined}
    >
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        locale={dayPickerLocale}
        disabled={disabledRange}
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
          outside: "text-stone-300",
          disabled: "text-stone-300 opacity-40",
        }}
      />
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
        <p className="min-w-0 flex-1 text-xs font-semibold text-stone-500">{selectedDate ? selectedSummary : labels.placeholder}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onChange("")}
            className="pbp-interactive-button min-h-8 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            {labels.clear}
          </button>
          <button
            type="button"
            onClick={closeCalendar}
            className="pbp-interactive-button min-h-8 rounded-xl bg-[var(--admin-theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-theme-text-on-surface)]"
          >
            {labels.done}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsCalendarOpen((current) => !current)}
        disabled={disabled}
        className="pbp-field-interaction flex min-h-10 w-full min-w-0 items-center justify-between gap-3 rounded-xl border px-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={isCalendarOpen}
        aria-label={labels.calendarAria}
      >
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {labels.label ? <span className="mr-2 text-[11px] font-semibold text-stone-500">{labels.label}</span> : null}
          <span>{selectedText}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-xs text-stone-400">▾</span>
      </button>
      {popoverMode === "fixed" && typeof document !== "undefined" ? createPortal(popoverContent, document.body) : popoverContent}
    </div>
  );
}
