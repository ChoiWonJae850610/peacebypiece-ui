import { type KeyboardEvent, type ReactNode } from "react";
import { AppInlineSelectEditor, type AppInlineSelectEditorOption } from "@/components/common/ui";
import { PbpSingleDatePicker, type PbpSingleDatePickerLabels } from "@/components/common/date/PbpSingleDatePicker";
import { getDisplayValue, getEditingInitialValue } from "@/lib/workorder/detail/detailFormatting";
import { isUnavailableWorkOrderSelectOption } from "@/lib/constants/workorderDomain";
import { normalizeEditingValue } from "@/lib/workorder/detail/detailSanitizers";
import { clampPastDateInputValue, getTodayDateInputValue } from "@/lib/workorder/datePolicy";
import type { OrderEntry } from "@/types/workorder";
import type { PbpDateLocale } from "@/lib/date/localDate";

export type RowValue = string | number | null | undefined;
export type EditableSectionKey = "material" | "outsourcing" | "order";
export type EditableCell = { section: EditableSectionKey; rowId: string; field: string } | null;
export type SelectOption = readonly string[];
export type BasicInfoState = {
  category1: string;
  category2: string;
  category3: string;
  category1Id?: string | null;
  category2Id?: string | null;
  category3Id?: string | null;
  partner: string;
  season: string;
  year: string;
};

export type OrderEntryState = OrderEntry;

const EDITABLE_FIELD_HEIGHT_CLASS = "min-h-8";
const EDITABLE_FIELD_BASE_CLASS = `pbp-field-interaction ${EDITABLE_FIELD_HEIGHT_CLASS} block w-full min-w-0 max-w-full overflow-hidden rounded-lg border px-2 outline-none ring-0`;
const EDITABLE_INPUT_CLASS = `${EDITABLE_FIELD_BASE_CLASS} pbp-workorder-editable-input text-xs`;
const EDITABLE_DISPLAY_CLASS = `${EDITABLE_FIELD_BASE_CLASS} pbp-workorder-editable-display text-xs flex items-center`;
const EDITABLE_VALUE_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
const EDITABLE_VALUE_TEXT_WRAP_CLASS = "block w-full min-w-0 max-w-full whitespace-normal break-words leading-4";

export const TABLE_VALUE_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
export const TABLE_HEADER_CELL_CLASS = "min-w-0 overflow-hidden px-1.5 py-1.5 text-center text-[10px] font-medium leading-4 text-stone-600 lg:px-2 lg:text-[10px]";
export const TABLE_BODY_CELL_CLASS = "min-w-0 overflow-hidden px-1.5 py-1.5 align-middle text-center text-[10px] leading-4 text-stone-900 lg:px-2 lg:text-[10px]";
export const EDITABLE_TABLE_CELL_CLASS = `${TABLE_BODY_CELL_CLASS} pbp-workorder-editable-cell`;
export const SELECTABLE_TABLE_CELL_CLASS = `${TABLE_BODY_CELL_CLASS} pbp-workorder-selectable-cell`;
export const CALCULATED_TABLE_CELL_CLASS = "pbp-workorder-calculated-cell min-w-0 overflow-hidden px-1.5 py-1.5 text-center align-middle text-[10px] font-medium tabular-nums lg:px-2 lg:text-[10px]";
export const EDITABLE_FIELD_PANEL_CLASS = "pbp-workorder-editable-panel rounded-lg border p-2.5";
export const SELECTABLE_FIELD_PANEL_CLASS = "pbp-workorder-selectable-panel rounded-lg border p-2.5";
export const CALCULATED_FIELD_PANEL_CLASS = "pbp-workorder-calculated-panel rounded-lg border p-2.5";
export const MOBILE_COMPOSITION_CARD_CLASS = "pbp-workorder-mobile-composition-card min-w-0 rounded-2xl border p-3 sm:p-3.5";
export const MOBILE_INFO_ROW_CLASS = "grid min-w-0 grid-cols-[minmax(68px,84px)_minmax(0,1fr)] items-start gap-x-2 sm:grid-cols-[minmax(72px,88px)_minmax(0,1fr)] sm:gap-x-3";
export const MOBILE_LABEL_CLASS = "min-w-0 text-left text-[11px] leading-5 tracking-tight text-stone-500";
export const MOBILE_VALUE_WRAPPER_CLASS = "flex min-w-0 max-w-full items-center justify-end overflow-hidden text-right";

export function CollapseToggleButton({
  open,
  onToggle,
  label,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={open}
      className="pbp-interactive-button inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-xs leading-none text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100"
    >
      <span aria-hidden="true" className={`inline-flex text-[13px] leading-none transition-transform ${open ? "rotate-180" : "rotate-0"}`}>▾</span>
    </button>
  );
}

export function SectionHeader({
  title,
  summary,
  open,
  onToggle,
  rightSlot,
  toggleLabel,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
  toggleLabel?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2 border-b border-stone-200 pb-1.5 sm:gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="pbp-touch-target pbp-interactive-button min-w-0 flex-1 rounded-xl px-0.5 py-0.5 text-left hover:bg-transparent active:bg-transparent"
      >
        <div className="min-w-0 overflow-hidden">
          <div className="text-sm font-semibold leading-5 text-stone-900">{title}</div>
          <div className="mt-0.5 block min-w-0 max-w-full break-words text-[11px] leading-4 text-stone-500 sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap md:text-xs">{summary}</div>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        <CollapseToggleButton open={open} onToggle={onToggle} label={toggleLabel ?? title} />
      </div>
    </div>
  );
}

function isEditingCell(editingCell: EditableCell, section: EditableSectionKey, rowId: string, field: string) {
  return editingCell?.section === section && editingCell.rowId === rowId && editingCell.field === field;
}


function CircleIconButton({ onClick, srLabel, disabled = false, variant, title, icon }: { onClick: () => void; srLabel: string; disabled?: boolean; variant: "default" | "danger"; title?: string; icon: ReactNode; }) {
  const baseClassName = "pbp-interactive-button inline-flex h-8 w-8 items-center justify-center rounded-full border bg-white text-[14px] font-normal leading-none disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400";
  const variantClassName = variant === "danger"
    ? "border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50 active:bg-rose-100"
    : "border-stone-300 text-stone-700 hover:border-stone-400 hover:bg-stone-100 active:bg-stone-200";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      title={title}
      disabled={disabled}
      className={`${baseClassName} ${variantClassName}`}
    >
      <span aria-hidden="true" className="inline-flex translate-y-[-0.5px] items-center justify-center leading-none">{icon}</span>
    </button>
  );
}

export function AddButton({ onClick, srLabel, disabled = false, title }: { onClick: () => void; srLabel: string; disabled?: boolean; title?: string }) {
  return <CircleIconButton onClick={onClick} srLabel={srLabel} disabled={disabled} title={title} variant="default" icon='+' />;
}

export function DeleteButton({ onClick, srLabel, disabled = false, title }: { onClick: () => void; srLabel: string; disabled?: boolean; title?: string }) {
  return <CircleIconButton onClick={onClick} srLabel={srLabel} disabled={disabled} title={title} variant="danger" icon='-' />;
}

export function EditableValue({
  section,
  rowId,
  field,
  value,
  editingCell,
  editingValue,
  inputMode,
  inputType = "text",
  alignRight,
  options,
  wrapText,
  centered,
  onStartEdit,
  onCommit,
  onCancel,
  compact,
  disabled = false,
  displayValue,
  datePickerLabels,
  datePickerLocale,
}: {
  section: EditableSectionKey;
  rowId: string;
  field: string;
  value: string;
  editingCell: EditableCell;
  editingValue: string;
  inputMode?: "text" | "decimal" | "numeric";
  inputType?: "text" | "date";
  alignRight?: boolean;
  options?: SelectOption;
  wrapText?: boolean;
  centered?: boolean;
  compact?: boolean;
  disabled?: boolean;
  displayValue?: string;
  datePickerLabels?: PbpSingleDatePickerLabels;
  datePickerLocale?: PbpDateLocale;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommit: (nextValue?: string) => void;
  onCancel: () => void;
}) {
  const editing = !disabled && isEditingCell(editingCell, section, rowId, field);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  const openDatePicker = (target: HTMLInputElement) => {
    if (inputType !== "date") return;
    if (typeof target.showPicker === "function") {
      try {
        target.showPicker();
      } catch {
        // ignore browsers that block programmatic picker opening
      }
    }
  };

  if (editing && options) {
    const selectValue = options.includes(editingValue) ? editingValue : (options[0] ?? "");
    const commitSelectValue = (nextValue: string) => {
      if (isUnavailableWorkOrderSelectOption(nextValue)) {
        onCancel();
        return;
      }
      onCommit(nextValue);
    };

    const selectOptions: AppInlineSelectEditorOption[] = options.map((option) => ({
      value: option,
      disabled: isUnavailableWorkOrderSelectOption(option),
    }));

    return (
      <AppInlineSelectEditor
        value={selectValue}
        options={selectOptions}
        onCommit={commitSelectValue}
        onCancel={onCancel}
        className={`${compact ? "mx-auto max-w-[11rem]" : ""} ${alignRight ? "text-right tabular-nums" : centered ? "text-center" : "text-left"}`}
      />
    );
  }

  if (editing) {
    const minDateValue = inputType === "date" ? getTodayDateInputValue() : undefined;

    if (inputType === "date" && datePickerLabels && datePickerLocale) {
      return (
        <PbpSingleDatePicker
          value={editingValue}
          labels={datePickerLabels}
          locale={datePickerLocale}
          minDateValue={minDateValue}
          onChange={(nextValue) => onCommit(clampPastDateInputValue(nextValue, minDateValue))}
          onClose={onCancel}
          commitOnSelect
          defaultOpen
          popoverMode="fixed"
          popoverAlign="center"
          className={`${compact ? "mx-auto max-w-[11rem]" : ""} ${centered ? "text-center" : "text-left"}`}
        />
      );
    }

    return (
      <input
        autoFocus
        type={inputType}
        inputMode={inputType === "date" ? undefined : inputMode}
        value={editingValue}
        min={minDateValue}
        onChange={(event) => {
          const nextValue = normalizeEditingValue(field, event.target.value);
          if (inputType === "date") {
            onCommit(clampPastDateInputValue(nextValue, minDateValue));
            event.currentTarget.blur();
            return;
          }
          onStartEdit(section, rowId, field, nextValue);
        }}
        onFocus={(event) => {
          if (inputType === "date") {
            openDatePicker(event.currentTarget);
            return;
          }
          event.currentTarget.select();
        }}
        onClick={(event) => openDatePicker(event.currentTarget)}
        onBlur={(event) => onCommit(inputType === "date" ? clampPastDateInputValue(event.target.value, minDateValue) : event.target.value)}
        onKeyDown={handleInputKeyDown}
        className={`${EDITABLE_INPUT_CLASS} ${compact ? "mx-auto max-w-[11rem]" : ""} ${alignRight ? "text-right tabular-nums" : centered ? "text-center" : "text-left"}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit(section, rowId, field, getEditingInitialValue(field, value))}
      disabled={disabled}
      className={`${EDITABLE_DISPLAY_CLASS} ${compact ? "mx-auto max-w-[11rem]" : ""} ${alignRight ? "items-center justify-center w-[48px] text-right tabular-nums" : centered ? "justify-center text-center" : "text-left"} ${disabled ? "pbp-workorder-field-disabled cursor-not-allowed opacity-70" : ""}`}
    >
      <span className={wrapText ? EDITABLE_VALUE_TEXT_WRAP_CLASS : EDITABLE_VALUE_TEXT_CLASS}>{(displayValue ?? getDisplayValue(field, value)) || "-"}</span>
    </button>
  );
}

export function blurActiveEditableElement() {
  if (typeof document === "undefined") return;
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}
