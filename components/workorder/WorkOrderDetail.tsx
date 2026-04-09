import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalFooter from "@/components/common/modal/ModalFooter";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import PartnerFactoryRegistryModal, { type RegistryType } from "@/components/workorder/PartnerFactoryRegistryModal";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import { getStageTone } from "@/lib/constants/workflow";
import { CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_BASIC_YEAR, DEFAULT_FACTORY_OPTION, DEFAULT_MATERIAL_TYPE, DEFAULT_MATERIAL_UNIT, DEFAULT_ORDER_TYPE, DEFAULT_OUTSOURCING_PROCESS, DEFAULT_OUTSOURCING_UNIT, DEFAULT_PARTNER_OPTION, FACTORY_OPTIONS, MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT_OPTIONS, ORDER_TYPE_OPTIONS, OUTSOURCING_PROCESS_OPTIONS, OUTSOURCING_UNIT_OPTIONS, PARTNER_OPTIONS, PRIORITY_OPTIONS, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";
import type { DisplayStage } from "@/types/workflow";
import { toDisplayValue } from "@/lib/utils/display";
import type { Attachment, Material, MemoThread, OrderEntry, OrderInspectionStatus, Outsourcing, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

type RowValue = string | number | null | undefined;
type EditableSectionKey = "material" | "outsourcing" | "order";
type EditableCell = { section: EditableSectionKey; rowId: string; field: string } | null;
type SelectOption = readonly string[];
type BasicInfoState = {
  category1: string;
  category2: string;
  category3: string;
  partner: string;
  season: string;
  year: string;
};

type OrderEntryState = OrderEntry;

const EDITABLE_FIELD_HEIGHT_CLASS = "h-10";
const EDITABLE_FIELD_BASE_CLASS = `pbp-field-interaction ${EDITABLE_FIELD_HEIGHT_CLASS} block w-full min-w-0 max-w-full overflow-hidden truncate rounded-xl border px-3 text-stone-900 outline-none ring-0`;
const EDITABLE_INPUT_CLASS = `${EDITABLE_FIELD_BASE_CLASS} text-base md:text-sm border-stone-300 bg-white focus:border-stone-400 focus:bg-white`;
const EDITABLE_SELECT_CLASS = `${EDITABLE_INPUT_CLASS} appearance-none truncate pr-8`;
const EDITABLE_DISPLAY_CLASS = `${EDITABLE_FIELD_BASE_CLASS} text-sm flex items-center border-transparent bg-transparent hover:border-stone-200 hover:bg-stone-50 focus-visible:border-stone-300 focus-visible:bg-stone-50`;
const EDITABLE_VALUE_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
const TABLE_VALUE_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
const TABLE_HEADER_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
const MOBILE_LABEL_CLASS = "w-[4.75rem] shrink-0 text-right text-xs tracking-tight text-stone-500";
const MOBILE_VALUE_WRAPPER_CLASS = "min-w-0 max-w-full flex-1 basis-0 overflow-hidden text-right";
const TABLE_HEADER_CELL_CLASS = "min-w-0 overflow-hidden px-3 py-3 text-xs font-medium";
const TABLE_BODY_CELL_CLASS = "min-w-0 overflow-hidden px-3 py-2 align-middle";

function SectionHeader({
  title,
  summary,
  open,
  onToggle,
  rightSlot,
}: {
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-stone-200 pb-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="pbp-touch-target pbp-interactive-button flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl px-0.5 py-0.5 text-left hover:bg-transparent active:bg-transparent"
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-sm font-semibold leading-5 text-stone-900">{title}</div>
          <div className="mt-1 block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-4 text-stone-500 md:text-sm">{summary}</div>
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        >
          ▾
        </span>
      </button>
      {rightSlot ? <div className="hidden shrink-0 md:block">{rightSlot}</div> : null}
    </div>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isNumericField(field: string) {
  return field === "quantity" || field === "unitCost" || field === "laborCost" || field === "lossCost";
}

function formatNumericDisplay(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return "0";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString();
}

function getEditingInitialValue(field: string, value: string) {
  return isNumericField(field) ? value.replace(/,/g, "") : value;
}

function getDisplayValue(field: string, value: string) {
  return isNumericField(field) ? formatNumericDisplay(value) : value;
}

function normalizeEditingValue(field: string, value: string) {
  if (!isNumericField(field)) return value;
  const sanitized = value.replace(/[^\d.,-]/g, "");
  const hasMinus = sanitized.startsWith("-");
  const unsigned = sanitized.replace(/-/g, "");
  const normalized = unsigned
    .replace(/,/g, "")
    .replace(/(\..*)\./g, "$1");
  return `${hasMinus ? "-" : ""}${normalized}`;
}

function recalculateMaterial(item: Material): Material {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

function recalculateOutsourcing(item: Outsourcing): Outsourcing {
  return {
    ...item,
    totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
  };
}

function getDefaultInspectionStatus(workflowState: WorkflowState): OrderInspectionStatus {
  switch (workflowState) {
    case "생산중":
      return "검수대기";
    case "검수중":
      return "검수중";
    case "완료":
      return "검수완료";
    default:
      return "발주대기";
  }
}

function sanitizeInspectionStatus(value: string | undefined | null, workflowState: WorkflowState): OrderInspectionStatus {
  if (value === "발주대기" || value === "검수대기" || value === "검수중" || value === "검수완료") return value;
  return getDefaultInspectionStatus(workflowState);
}

function sanitizeOrderEntry(item: Partial<OrderEntryState>, fallback?: Partial<OrderEntryState>, workflowState: WorkflowState = "작성중"): OrderEntryState {
  return {
    id: item.id || fallback?.id || createId("order"),
    type: item.type || fallback?.type || DEFAULT_ORDER_TYPE,
    factory: item.factory || fallback?.factory || DEFAULT_FACTORY_OPTION,
    dueDate: item.dueDate || fallback?.dueDate || "",
    quantity: Math.max(0, Number(item.quantity ?? fallback?.quantity) || 0),
    laborCost: Math.max(0, Number(item.laborCost ?? fallback?.laborCost) || 0),
    lossCost: Math.max(0, Number(item.lossCost ?? fallback?.lossCost) || 0),
    priority: item.priority || fallback?.priority || PRIORITY_OPTIONS[0],
    inspectionStatus: sanitizeInspectionStatus(item.inspectionStatus ?? fallback?.inspectionStatus, workflowState),
  };
}

function getInspectionStatusLabel(status: OrderInspectionStatus) {
  switch (status) {
    case "검수대기":
      return "검수 대기";
    case "검수중":
      return "검수중";
    case "검수완료":
      return "검수 완료";
    default:
      return "발주 전";
  }
}

function getInspectionStatusTone(status: OrderInspectionStatus) {
  switch (status) {
    case "검수완료":
      return "bg-stone-900 text-white";
    case "검수중":
      return "bg-emerald-100 text-emerald-700";
    case "검수대기":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

function getInitialOrderEntries(workOrder: WorkOrder): OrderEntryState[] {
  const entries = (workOrder.orderEntries ?? []).map((item) => sanitizeOrderEntry(item, undefined, workOrder.workflowState));
  if (entries.length > 0) return entries;

  return [sanitizeOrderEntry({
    id: `${workOrder.id}-legacy-order`,
    type: DEFAULT_ORDER_TYPE,
    factory: workOrder.vendor || DEFAULT_FACTORY_OPTION,
    dueDate: workOrder.dueDate || "",
    quantity: Number.isFinite(workOrder.quantity) ? workOrder.quantity : 0,
    laborCost: Math.max(0, Number(workOrder.laborCost) || 0),
    lossCost: Math.max(0, Number(workOrder.lossCost) || 0),
    priority: workOrder.priority || PRIORITY_OPTIONS[0],
    inspectionStatus: getDefaultInspectionStatus(workOrder.workflowState),
  }, undefined, workOrder.workflowState)];
}

function calculateOrderEntryTotals(orderEntries: OrderEntryState[]) {
  return orderEntries.reduce((acc, item) => {
    acc.quantity += Number(item.quantity) || 0;
    acc.laborCost += Number(item.laborCost) || 0;
    acc.lossCost += Number(item.lossCost) || 0;
    return acc;
  }, { quantity: 0, laborCost: 0, lossCost: 0 });
}

function isEditingCell(editingCell: EditableCell, section: EditableSectionKey, rowId: string, field: string) {
  return editingCell?.section === section && editingCell.rowId === rowId && editingCell.field === field;
}

function DeleteButton({ onClick, srLabel }: { onClick: () => void; srLabel: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      className="pbp-interactive-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-base font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 active:bg-rose-100"
    >
      -
    </button>
  );
}

function EditableValue({
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
  onStartEdit,
  onCommit,
  onCancel,
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
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommit: (nextValue?: string) => void;
  onCancel: () => void;
}) {
  const editing = isEditingCell(editingCell, section, rowId, field);

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

  const handleSelectKeyDown = (event: KeyboardEvent<HTMLSelectElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit((event.currentTarget as HTMLSelectElement).value);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  if (editing && options) {
    return (
      <select
        autoFocus
        value={editingValue}
        onChange={(event) => onCommit(event.target.value)}
        onBlur={(event) => onCommit(event.target.value)}
        onKeyDown={handleSelectKeyDown}
        className={`${EDITABLE_SELECT_CLASS} ${alignRight ? "text-right tabular-nums" : "text-left"}`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={inputType}
        inputMode={inputType === "date" ? undefined : inputMode}
        value={editingValue}
        onChange={(event) => onStartEdit(section, rowId, field, normalizeEditingValue(field, event.target.value))}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => onCommit()}
        onKeyDown={handleInputKeyDown}
        className={`${EDITABLE_INPUT_CLASS} ${alignRight ? "text-right tabular-nums" : "text-left"}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit(section, rowId, field, getEditingInitialValue(field, value))}
      className={`${EDITABLE_DISPLAY_CLASS} ${alignRight ? "justify-end text-right tabular-nums" : "text-left"}`}
    >
      <span className={EDITABLE_VALUE_TEXT_CLASS}>{getDisplayValue(field, value) || "-"}</span>
    </button>
  );
}



function getCategory2Options(category1: string) {
  return CATEGORY2_OPTIONS_MAP[category1] ?? CATEGORY2_OPTIONS_MAP[CATEGORY1_OPTIONS[0]] ?? [];
}

function getCategory3Options(category2: string) {
  return CATEGORY3_OPTIONS_MAP[category2] ?? CATEGORY3_OPTIONS_MAP[getCategory2Options(CATEGORY1_OPTIONS[0])[0] ?? ""] ?? [];
}

function sanitizeSelectValue(value: string, options: readonly string[], fallback?: string) {
  if (value && options.includes(value)) return value;
  return fallback ?? options[0] ?? "";
}

function appendOption(options: string[], value: string) {
  const trimmed = value.trim();
  if (!trimmed) return options;
  if (options.includes(trimmed)) return options;
  return [...options, trimmed];
}

function parseSeasonYear(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(SS|FW|NOS|ALL)(?:\s+(\d{4}))?$/i);
  if (match) {
    return {
      season: match[1].toUpperCase(),
      year: match[2] ?? DEFAULT_BASIC_YEAR,
    };
  }

  const [first = "", second = ""] = trimmed.split(/\s+/);
  return {
    season: first || SEASON_OPTIONS[0],
    year: second || DEFAULT_BASIC_YEAR,
  };
}


function formatBasicSummary(basicInfo: BasicInfoState) {
  return [
    [basicInfo.category1, basicInfo.category2, basicInfo.category3].filter(Boolean).join(" > "),
    `${basicInfo.season} ${basicInfo.year}`.trim(),
  ].filter(Boolean).join(" · ");
}

function formatOrderSummary(orderEntries: OrderEntryState[]) {
  if (orderEntries.length === 0) return "등록된 발주 정보가 없습니다.";
  const totals = calculateOrderEntryTotals(orderEntries);
  const completedCount = orderEntries.filter((item) => item.inspectionStatus === "검수완료").length;
  return [
    `${orderEntries.length}건`,
    `${totals.quantity.toLocaleString()}장`,
    `검수완료 ${completedCount}/${orderEntries.length}`,
  ].filter(Boolean).join(" · ");
}

function BasicInfoEditModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  value: BasicInfoState;
  onChange: (next: BasicInfoState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });

  const category2Options = getCategory2Options(value.category1);
  const category3Options = getCategory3Options(value.category2);

  const handleCategory1Change = (category1: string) => {
    const nextCategory2Options = getCategory2Options(category1);
    const nextCategory2 = nextCategory2Options[0] ?? "";
    const nextCategory3Options = getCategory3Options(nextCategory2);
    onChange({
      ...value,
      category1,
      category2: nextCategory2,
      category3: nextCategory3Options[0] ?? "",
    });
  };

  const handleCategory2Change = (category2: string) => {
    const nextCategory3Options = getCategory3Options(category2);
    onChange({
      ...value,
      category2,
      category3: nextCategory3Options[0] ?? "",
    });
  };

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="basic-info-edit-modal-title" maxWidthClassName="md:max-w-xl">
      <ModalHeader
        titleId="basic-info-edit-modal-title"
        title="기본정보 수정"
        description="헤더 요약에 표시되는 품목 분류와 시즌 정보를 수정합니다."
        onClose={onClose}
      />
      <ModalBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">대분류</div>
            <select
              value={value.category1}
              onChange={(event) => handleCategory1Change(event.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {CATEGORY1_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">중분류</div>
            <select
              value={value.category2}
              onChange={(event) => handleCategory2Change(event.target.value)}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-white p-3">
            <div className="text-xs text-stone-500">소분류</div>
            <select
              value={value.category3}
              onChange={(event) => onChange({ ...value, category3: event.target.value })}
              className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
            >
              {category3Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            <label className="rounded-2xl border border-stone-200 bg-white p-3">
              <div className="text-xs text-stone-500">시즌</div>
              <select
                value={value.season}
                onChange={(event) => onChange({ ...value, season: event.target.value })}
                className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
              >
                {SEASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="rounded-2xl border border-stone-200 bg-white p-3">
              <div className="text-xs text-stone-500">연도</div>
              <select
                value={value.year}
                onChange={(event) => onChange({ ...value, year: event.target.value })}
                className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
              >
                {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <div className="text-xs text-stone-500">헤더 요약 미리보기</div>
          <div className="mt-2 text-sm font-medium text-stone-900">{formatBasicSummary(value)}</div>
        </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="pbp-interactive-button flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            className="pbp-interactive-button flex-1 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black"
          >
            적용
          </button>
        </div>
      </ModalFooter>
    </BaseModal>
  );
}

function blurActiveEditableElement() {
  if (typeof document === "undefined") return;
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }
}

function getInitialBasicInfo(workOrder: WorkOrder): BasicInfoState {
  const parsedSeason = parseSeasonYear(workOrder.season);
  const category1 = workOrder.category1 || CATEGORY1_OPTIONS[0];
  const category2Options = getCategory2Options(category1);
  const category2 = workOrder.category2 || category2Options[0] || "";
  const category3Options = getCategory3Options(category2);
  const category3 = workOrder.category3 || category3Options[0] || "";

  return {
    category1,
    category2,
    category3,
    partner: DEFAULT_PARTNER_OPTION,
    season: parsedSeason.season || SEASON_OPTIONS[0],
    year: parsedSeason.year || DEFAULT_BASIC_YEAR,
  };
}

function OrderInfoSection({
  orderEntries,
  factoryOptions,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  canManageInspectionRows,
  onStartInspection,
  onCompleteInspection,
}: {
  orderEntries: OrderEntryState[];
  factoryOptions: readonly string[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  canManageInspectionRows: boolean;
  onStartInspection: (id: string) => void;
  onCompleteInspection: (id: string) => void;
}) {
  const totals = calculateOrderEntryTotals(orderEntries);

  return (
    <div className="overflow-hidden rounded-2xl bg-stone-50 p-4">
      <SectionHeader title="발주 정보" summary={formatOrderSummary(orderEntries)} open={open} onToggle={onToggle} />
      {open ? (
        <>
          <div className="mt-3 space-y-3 md:hidden">
            {orderEntries.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-semibold text-stone-900">{item.factory || `발주 ${index + 1}`}</div>
                    <div className="mt-1 truncate text-xs text-stone-500">{item.type} · {item.quantity.toLocaleString()}장</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || `발주 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInspectionStatusTone(item.inspectionStatus ?? "발주대기")}`}>{getInspectionStatusLabel(item.inspectionStatus ?? "발주대기")}</span>
                  {canManageInspectionRows ? (
                    item.inspectionStatus === "검수대기" ? (
                      <button type="button" onClick={() => onStartInspection(item.id)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">검수 시작</button>
                    ) : item.inspectionStatus === "검수중" ? (
                      <button type="button" onClick={() => onCompleteInspection(item.id)} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700">검수 완료</button>
                    ) : null
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["공장", "factory", item.factory, "text"],
                    ["납기일", "dueDate", item.dueDate, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["공임비", "laborCost", item.laborCost.toLocaleString(), "decimal"],
                    ["로스비", "lossCost", item.lossCost.toLocaleString(), "decimal"],
                    ["우선순위", "priority", item.priority, "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center gap-3 min-w-0">
                      <span className={MOBILE_LABEL_CLASS}>{label}</span>
                      <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                        <EditableValue
                          section="order"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={field === 'quantity' || field === 'laborCost' || field === 'lossCost' ? 'numeric' : inputMode as "text" | "decimal"}
                          inputType={field === 'dueDate' ? 'date' : 'text'}
                          options={field === 'type' ? ORDER_TYPE_OPTIONS : field === 'factory' ? factoryOptions : field === 'priority' ? PRIORITY_OPTIONS : undefined}
                          alignRight
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              + 발주 추가
            </button>
          </div>
          <div className="mt-3 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-xs lg:text-sm">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
                <col className="w-[6%]" />
                <col className="w-[4%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["구분", "공장", "납기일", "수량", "공임비", "로스비", "우선순위", "검수", "액션", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`${TABLE_HEADER_CELL_CLASS} ${header === "수량" || header === "공임비" || header === "로스비" ? "text-right" : header === "" || header === "검수" || header === "액션" ? "text-center" : "text-left"}`}
                    >
                      <span className={`${TABLE_HEADER_TEXT_CLASS} break-keep`}>{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderEntries.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="type" value={item.type} options={ORDER_TYPE_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} options={factoryOptions} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="dueDate" value={item.dueDate} editingCell={editingCell} editingValue={editingValue} inputType="date" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="numeric" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="numeric" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="numeric" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="priority" value={item.priority} options={PRIORITY_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="px-3 py-2 text-center align-middle"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getInspectionStatusTone(item.inspectionStatus ?? "발주대기")}`}>{getInspectionStatusLabel(item.inspectionStatus ?? "발주대기")}</span></td>
                    <td className="px-3 py-2 text-center align-middle">
                      {canManageInspectionRows ? (
                        item.inspectionStatus === "검수대기" ? (
                          <button type="button" onClick={() => onStartInspection(item.id)} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-700">검수 시작</button>
                        ) : item.inspectionStatus === "검수중" ? (
                          <button type="button" onClick={() => onCompleteInspection(item.id)} className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-[11px] font-medium text-stone-700">검수 완료</button>
                        ) : <span className="text-[11px] text-stone-400">-</span>
                      ) : <span className="text-[11px] text-stone-400">-</span>}
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || `발주 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50/70">
                  <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>합계</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-stone-900 tabular-nums">{totals.quantity.toLocaleString()}장</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-stone-900 tabular-nums">{totals.laborCost.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-stone-900 tabular-nums">{totals.lossCost.toLocaleString()}원</td>
                  <td colSpan={4} />
                </tr>
                <tr>
                  <td colSpan={10} className="px-3 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                    >
                      + 발주 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}


function ProductionCompositionSection({
  materials,
  outsourcing,
  open,
  onToggle,
  materialOpen,
  outsourcingOpen,
  onToggleMaterial,
  onToggleOutsourcing,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAddMaterial,
  onRemoveMaterial,
  onAddOutsourcing,
  onRemoveOutsourcing,
  vendorOptions,
}: {
  materials: Material[];
  outsourcing: Outsourcing[];
  open: boolean;
  onToggle: () => void;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  onAddOutsourcing: () => void;
  onRemoveOutsourcing: (id: string) => void;
  vendorOptions: readonly string[];
}) {
  const materialCount = materials.length;
  const outsourcingCount = outsourcing.length;
  const materialTotal = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const outsourcingTotal = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = [
    `원단/부자재 ${materialCount}건`,
    `외주공정 ${outsourcingCount}건`,
    `총 ${(materialTotal + outsourcingTotal).toLocaleString()}원`,
  ].join(' · ');

  return (
    <div className="overflow-hidden rounded-2xl bg-stone-50 p-4">
      <SectionHeader title="생산 구성" summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3.5 space-y-3.5">
          <MaterialSection
            materials={materials}
            open={materialOpen}
            onToggle={onToggleMaterial}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={onStartEdit}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
            onAdd={onAddMaterial}
            onRemove={onRemoveMaterial}
            vendorOptions={vendorOptions}
          />
          <OutsourcingSection
            outsourcing={outsourcing}
            open={outsourcingOpen}
            onToggle={onToggleOutsourcing}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={onStartEdit}
            onCommitEdit={onCommitEdit}
            onCancelEdit={onCancelEdit}
            onAdd={onAddOutsourcing}
            onRemove={onRemoveOutsourcing}
            vendorOptions={vendorOptions}
          />
        </div>
      ) : null}
    </div>
  );
}

function MaterialSection({
  materials,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  vendorOptions,
}: {
  materials: Material[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  vendorOptions: readonly string[];
}) {
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = materials.length > 0
    ? `${materials[0].name}${materials.length > 1 ? ` 외 ${materials.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 원단/부자재가 없습니다.";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4">
      <SectionHeader
        title="원단 / 부자재"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-3 space-y-3 md:hidden">
            {materials.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-semibold text-stone-900">{item.name || `자재 ${index + 1}`}</div>
                    <div className="mt-1 truncate text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["자재명", "name", item.name, "text"],
                    ["거래처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["단위", "unit", item.unit, "text"],
                    ["단가", "unitCost", item.unitCost.toLocaleString(), "decimal"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center gap-3 min-w-0">
                      <span className={MOBILE_LABEL_CLASS}>{label}</span>
                      <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                        <EditableValue
                          section="material"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          options={field === "type" ? MATERIAL_TYPE_OPTIONS : field === "unit" ? MATERIAL_UNIT_OPTIONS : field === "vendor" ? vendorOptions : undefined}
                          alignRight
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={MOBILE_LABEL_CLASS}>금액</span>
                    <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                      <span className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-stone-900 tabular-nums">{(item.totalCost ?? 0).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              + 항목 추가
            </button>
          </div>
          <div className="mt-3 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-xs lg:text-sm">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[19%]" />
                <col className="w-[19%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["구분", "자재명", "거래처", "수량", "단위", "단가", "금액", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`${TABLE_HEADER_CELL_CLASS} ${header === "수량" || header === "단가" || header === "금액" ? "text-right" : header === "" ? "text-center" : "text-left"}`}
                    >
                      <span className={`${TABLE_HEADER_TEXT_CLASS} break-keep`}>{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="type" value={item.type} options={MATERIAL_TYPE_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="name" value={item.name} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptions} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} options={MATERIAL_UNIT_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 overflow-hidden px-3 py-2 text-right align-middle font-medium tabular-nums"><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}원</span></td>
                    <td className="px-3 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={8} className="px-3 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                    >
                      + 항목 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function OutsourcingSection({
  outsourcing,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  vendorOptions,
}: {
  outsourcing: Outsourcing[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  vendorOptions: readonly string[];
}) {
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = outsourcing.length > 0
    ? `${outsourcing[0].process}${outsourcing.length > 1 ? ` 외 ${outsourcing.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 외주 공정이 없습니다.";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4">
      <SectionHeader
        title="외주 공정"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-3 space-y-3 md:hidden">
            {outsourcing.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-semibold text-stone-900">{item.process || `공정 ${index + 1}`}</div>
                    <div className="mt-1 truncate text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["공정", "process", item.process, "text"],
                    ["외주처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["단가기준", "unitType", item.unitType, "text"],
                    ["단가", "unitCost", item.unitCost.toLocaleString(), "decimal"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center gap-3 min-w-0">
                      <span className={MOBILE_LABEL_CLASS}>{label}</span>
                      <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                        <EditableValue
                          section="outsourcing"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          options={field === "process" ? OUTSOURCING_PROCESS_OPTIONS : field === "unitType" ? OUTSOURCING_UNIT_OPTIONS : field === "vendor" ? vendorOptions : undefined}
                          alignRight
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={MOBILE_LABEL_CLASS}>금액</span>
                    <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                      <span className="block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-stone-900 tabular-nums">{(item.totalCost ?? 0).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              + 공정 추가
            </button>
          </div>
          <div className="mt-3 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-xs lg:text-sm">
              <colgroup>
                <col className="w-[21%]" />
                <col className="w-[21%]" />
                <col className="w-[11%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["공정", "외주처", "수량", "단가기준", "단가", "금액", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`${TABLE_HEADER_CELL_CLASS} ${header === "수량" || header === "단가" || header === "금액" ? "text-right" : header === "" ? "text-center" : "text-left"}`}
                    >
                      <span className={`${TABLE_HEADER_TEXT_CLASS} break-keep`}>{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outsourcing.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} options={OUTSOURCING_PROCESS_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptions} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={OUTSOURCING_UNIT_OPTIONS} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 overflow-hidden px-3 py-2 text-right align-middle font-medium tabular-nums"><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}원</span></td>
                    <td className="px-3 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={7} className="px-3 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                    >
                      + 공정 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}




export default function WorkOrderDetail({
  workOrder,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentInventoryQuantity,
  currentUserName,
  currentUserRole,
  canEditInventory,
  canChangeManager,
  canSeeProductionSections,
  canSeeCostSections,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onSave,
  onOpenInventoryEditor,
  onOpenManagerAssignModal,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  onSetMaterialOpen,
  onSetOutsourcingOpen,
  visibleStages,
  currentDisplayStage,
  actions,
  onAction,
  onUpdateWorkOrder,
}: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
  currentInventoryQuantity: number;
  currentUserName: string;
  currentUserRole: string;
  canEditInventory: boolean;
  canChangeManager: boolean;
  canSeeProductionSections: boolean;
  canSeeCostSections: boolean;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  onOpenManagerAssignModal: () => void;
  onToggleBasicInfo: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  onSetMaterialOpen: (next: boolean) => void;
  onSetOutsourcingOpen: (next: boolean) => void;
  visibleStages: DisplayStage[];
  currentDisplayStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
  onUpdateWorkOrder: (patch: Partial<WorkOrder>) => void;
}) {
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [partnerOptions, setPartnerOptions] = useState<string[]>(() => Array.from(new Set(PARTNER_OPTIONS)));
  const [orderItems, setOrderItems] = useState<OrderEntryState[]>(() => getInitialOrderEntries(workOrder));
  const [factoryOptions, setFactoryOptions] = useState<string[]>(() => {
    const seeded: string[] = Array.from(new Set(FACTORY_OPTIONS));
    return getInitialOrderEntries(workOrder).reduce<string[]>((options, item) => appendOption(options, item.factory), seeded);
  });
  const [registryModalOpen, setRegistryModalOpen] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType>("거래처");
  const [basicInfoModalOpen, setBasicInfoModalOpen] = useState(false);
  const [basicInfoDraft, setBasicInfoDraft] = useState<BasicInfoState>(() => getInitialBasicInfo(workOrder));
  const [materialItems, setMaterialItems] = useState<Material[]>(() => (workOrder.materials ?? []).map(recalculateMaterial));
  const [outsourcingItems, setOutsourcingItems] = useState<Outsourcing[]>(() => (workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");

  const orderTotals = calculateOrderEntryTotals(orderItems);
  const laborCost = orderTotals.laborCost;
  const lossCost = orderTotals.lossCost;
  const totalCostWithOrderInfo = fabricTotal + subsidiaryTotal + outsourcingTotal + laborCost + lossCost;
  const unitCostWithOrderInfo = orderTotals.quantity > 0 ? Math.round(totalCostWithOrderInfo / orderTotals.quantity) : 0;

  useEffect(() => {
    setBasicInfo((current) => {
      const next = getInitialBasicInfo(workOrder);
      return {
        ...next,
        partner: sanitizeSelectValue(current.partner, partnerOptions, next.partner),
      };
    });
    setBasicInfoDraft(getInitialBasicInfo(workOrder));
    const nextOrderEntries = getInitialOrderEntries(workOrder);
    setOrderItems(nextOrderEntries);
    setFactoryOptions((current) => nextOrderEntries.reduce<string[]>((options, item) => appendOption(options, item.factory), current));
  }, [workOrder, partnerOptions]);

  useEffect(() => {
    setMaterialItems((workOrder.materials ?? []).map(recalculateMaterial));
  }, [workOrder.materials]);

  useEffect(() => {
    setOutsourcingItems((workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  }, [workOrder.outsourcing]);

  const startEdit = (section: EditableSectionKey, rowId: string, field: string, value: string) => {
    setEditingCell({ section, rowId, field });
    setEditingValue(value);
  };

  const cancelEdit = () => {
    blurActiveEditableElement();
    setEditingCell(null);
    setEditingValue("");
  };

  const syncOrderEntries = (nextItems: OrderEntryState[]) => {
    onUpdateWorkOrder({
      orderEntries: nextItems.map((item) => sanitizeOrderEntry(item, undefined, currentWorkflowState)),
    });
  };

  const commitEdit = (nextValueOverride?: string) => {
    if (!editingCell) return;

    const nextValue = (nextValueOverride ?? editingValue).trim();

    if (editingCell.section === "order") {
      const nextItems = orderItems.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        if (editingCell.field === "quantity") {
          return sanitizeOrderEntry({ ...item, quantity: toNumber(nextValue) }, item, currentWorkflowState);
        }
        if (editingCell.field === "laborCost") {
          return sanitizeOrderEntry({ ...item, laborCost: toNumber(nextValue) }, item, currentWorkflowState);
        }
        if (editingCell.field === "lossCost") {
          return sanitizeOrderEntry({ ...item, lossCost: toNumber(nextValue) }, item, currentWorkflowState);
        }
        if (editingCell.field === "factory") {
          return sanitizeOrderEntry({ ...item, factory: sanitizeSelectValue(nextValue, factoryOptions, DEFAULT_FACTORY_OPTION) }, item, currentWorkflowState);
        }
        if (editingCell.field === "priority") {
          return sanitizeOrderEntry({ ...item, priority: nextValue || PRIORITY_OPTIONS[0] }, item, currentWorkflowState);
        }
        if (editingCell.field === "type") {
          return sanitizeOrderEntry({ ...item, type: nextValue || DEFAULT_ORDER_TYPE }, item, currentWorkflowState);
        }
        if (editingCell.field === "dueDate") {
          return sanitizeOrderEntry({ ...item, dueDate: nextValue }, item, currentWorkflowState);
        }

        return item;
      });
      setOrderItems(nextItems);
      syncOrderEntries(nextItems);
    }

    if (editingCell.section === "material") {
      const nextItems = materialItems.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        if (editingCell.field === "quantity") {
          return recalculateMaterial({ ...item, quantity: toNumber(nextValue) });
        }
        if (editingCell.field === "unitCost") {
          return recalculateMaterial({ ...item, unitCost: toNumber(nextValue) });
        }
        if (editingCell.field === "type") {
          return { ...item, type: (nextValue || "원단") as Material["type"] };
        }

        return { ...item, [editingCell.field]: nextValue } as Material;
      });
      setMaterialItems(nextItems);
      onUpdateWorkOrder({ materials: nextItems.map((item) => recalculateMaterial(item)) });
    }

    if (editingCell.section === "outsourcing") {
      const nextItems = outsourcingItems.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        if (editingCell.field === "quantity") {
          return recalculateOutsourcing({ ...item, quantity: toNumber(nextValue) });
        }
        if (editingCell.field === "unitCost") {
          return recalculateOutsourcing({ ...item, unitCost: toNumber(nextValue) });
        }

        return { ...item, [editingCell.field]: nextValue } as Outsourcing;
      });
      setOutsourcingItems(nextItems);
      onUpdateWorkOrder({ outsourcing: nextItems.map((item) => recalculateOutsourcing(item)) });
    }

    blurActiveEditableElement();
    cancelEdit();
  };

  const addOrderEntry = () => {
    const nextItems = [
      ...orderItems,
      sanitizeOrderEntry({
        id: createId("order"),
        type: DEFAULT_ORDER_TYPE,
        factory: DEFAULT_FACTORY_OPTION,
        dueDate: orderItems[0]?.dueDate || "",
        quantity: 0,
        laborCost: 0,
        lossCost: 0,
        priority: orderItems[0]?.priority || PRIORITY_OPTIONS[0],
      }, undefined, currentWorkflowState),
    ];
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
  };

  const removeOrderEntry = (id: string) => {
    const nextItems = orderItems.length > 1 ? orderItems.filter((item) => item.id !== id) : orderItems;
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
    if (editingCell?.section === "order" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const handleStartOrderInspection = (id: string) => {
    const nextItems = orderItems.map((item) => item.id === id
      ? sanitizeOrderEntry({ ...item, inspectionStatus: "검수중" }, item, currentWorkflowState)
      : item);
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
  };

  const handleCompleteOrderInspection = (id: string) => {
    const nextItems = orderItems.map((item) => item.id === id
      ? sanitizeOrderEntry({ ...item, inspectionStatus: "검수완료" }, item, currentWorkflowState)
      : item);
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
  };

  const addMaterial = () => {
    const nextItems = [
      ...materialItems,
      recalculateMaterial({
        id: createId("material"),
        type: DEFAULT_MATERIAL_TYPE,
        name: "새 자재",
        vendor: "",
        quantity: 0,
        unit: DEFAULT_MATERIAL_UNIT,
        unitCost: 0,
        totalCost: 0,
        status: "준비",
      }),
    ];
    setMaterialItems(nextItems);
    onUpdateWorkOrder({ materials: nextItems.map((item) => recalculateMaterial(item)) });
  };

  const removeMaterial = (id: string) => {
    const nextItems = materialItems.filter((item) => item.id !== id);
    setMaterialItems(nextItems);
    onUpdateWorkOrder({ materials: nextItems.map((item) => recalculateMaterial(item)) });
    if (editingCell?.section === "material" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const addOutsourcing = () => {
    const nextItems = [
      ...outsourcingItems,
      recalculateOutsourcing({
        id: createId("outsourcing"),
        process: DEFAULT_OUTSOURCING_PROCESS,
        vendor: "",
        quantity: 0,
        unitType: DEFAULT_OUTSOURCING_UNIT,
        unitCost: 0,
        totalCost: 0,
        status: "대기",
      }),
    ];
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder({ outsourcing: nextItems.map((item) => recalculateOutsourcing(item)) });
  };

  const removeOutsourcing = (id: string) => {
    const nextItems = outsourcingItems.filter((item) => item.id !== id);
    setOutsourcingItems(nextItems);
    onUpdateWorkOrder({ outsourcing: nextItems.map((item) => recalculateOutsourcing(item)) });
    if (editingCell?.section === "outsourcing" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const openRegistryModal = (type: RegistryType) => {
    setRegistryType(type);
    setRegistryModalOpen(true);
  };

  const closeRegistryModal = () => {
    setRegistryModalOpen(false);
  };

  const handleRegistrySave = ({ type, name }: { type: RegistryType; name: string }) => {
    if (type === "거래처") {
      setPartnerOptions((current) => appendOption(current, name));
      setBasicInfo((current) => ({ ...current, partner: name }));
      setBasicInfoDraft((current) => ({ ...current, partner: name }));
      return;
    }

    setFactoryOptions((current) => appendOption(current, name));
    const nextItems = orderItems.map((item, index) => (index === 0 ? { ...item, factory: name } : item));
    setOrderItems(nextItems);
    syncOrderEntries(nextItems);
  };

  const handleOpenBasicInfoModal = () => {
    setBasicInfoDraft(basicInfo);
    setBasicInfoModalOpen(true);
  };

  const handleCloseBasicInfoModal = () => {
    setBasicInfoDraft(basicInfo);
    setBasicInfoModalOpen(false);
  };

  const handleSaveBasicInfoModal = () => {
    setBasicInfo(basicInfoDraft);
    onUpdateWorkOrder({
      category1: basicInfoDraft.category1,
      category2: basicInfoDraft.category2,
      category3: basicInfoDraft.category3,
      season: `${basicInfoDraft.season} ${basicInfoDraft.year}`.trim(),
    });
    setBasicInfoModalOpen(false);
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
      <WorkOrderHeaderSection
        title={workOrder.title}
        summaryText={formatBasicSummary(basicInfo)}
        managerName={workOrder.manager || "-"}
        currentInventoryQuantity={currentInventoryQuantity}
        lastSavedAt={lastSavedAt}
        canChangeManager={canChangeManager}
        canEditInventory={canEditInventory}
        onSave={onSave}
        onOpenBasicInfoModal={handleOpenBasicInfoModal}
        onOpenManagerAssignModal={onOpenManagerAssignModal}
        onOpenInventoryEditor={onOpenInventoryEditor}
      />

      <WorkOrderActionSection stages={visibleStages} currentStage={currentDisplayStage} actions={actions} onAction={onAction} />

      {canSeeCostSections ? (
        <div className="mt-6">
          <WorkOrderCostSummarySection
            fabricTotal={fabricTotal}
            subsidiaryTotal={subsidiaryTotal}
            outsourcingTotal={outsourcingTotal}
            laborCost={laborCost}
            lossCost={lossCost}
            totalCost={totalCostWithOrderInfo}
            unitCost={unitCostWithOrderInfo}
            outsourcing={outsourcingItems}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <OrderInfoSection
          orderEntries={orderItems}
          factoryOptions={factoryOptions}
          open={basicInfoOpen}
          onToggle={onToggleBasicInfo}
          editingCell={editingCell}
          editingValue={editingValue}
          onStartEdit={startEdit}
          onCommitEdit={commitEdit}
          onCancelEdit={cancelEdit}
          onAdd={addOrderEntry}
          onRemove={removeOrderEntry}
          canManageInspectionRows={canEditInventory && (currentWorkflowState === "생산중" || currentWorkflowState === "검수중")}
          onStartInspection={handleStartOrderInspection}
          onCompleteInspection={handleCompleteOrderInspection}
        />

        {canSeeProductionSections ? (
          <ProductionCompositionSection
            materials={materialItems}
            outsourcing={outsourcingItems}
            open={materialOpen || outsourcingOpen}
            onToggle={() => {
              const nextOpen = !(materialOpen || outsourcingOpen);
              onSetMaterialOpen(nextOpen);
              onSetOutsourcingOpen(nextOpen);
            }}
            materialOpen={materialOpen}
            outsourcingOpen={outsourcingOpen}
            onToggleMaterial={onToggleMaterial}
            onToggleOutsourcing={onToggleOutsourcing}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onAddMaterial={addMaterial}
            onRemoveMaterial={removeMaterial}
            onAddOutsourcing={addOutsourcing}
            onRemoveOutsourcing={removeOutsourcing}
            vendorOptions={Array.from(new Set([...partnerOptions, ...materialItems.map((item) => item.vendor).filter(Boolean), ...outsourcingItems.map((item) => item.vendor).filter(Boolean)]))}
          />
        ) : null}
      </div>

      <BasicInfoEditModal
        open={basicInfoModalOpen}
        value={basicInfoDraft}
        onChange={setBasicInfoDraft}
        onClose={handleCloseBasicInfoModal}
        onSave={handleSaveBasicInfoModal}
      />

      <PartnerFactoryRegistryModal
        open={registryModalOpen}
        initialType={registryType}
        onClose={closeRegistryModal}
        onSave={handleRegistrySave}
      />
    </div>
  );
}
