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
import { CATEGORY1_OPTIONS, DEFAULT_BASIC_YEAR, DEFAULT_FACTORY_OPTION, DEFAULT_MATERIAL_TYPE, DEFAULT_MATERIAL_UNIT, DEFAULT_ORDER_TYPE, DEFAULT_OUTSOURCING_PROCESS, DEFAULT_OUTSOURCING_UNIT, DEFAULT_PARTNER_OPTION, FACTORY_OPTIONS, MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT_OPTIONS, ORDER_TYPE_OPTIONS, OUTSOURCING_PROCESS_OPTIONS, OUTSOURCING_UNIT_OPTIONS, PARTNER_OPTIONS, PRIORITY_OPTIONS, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";
import { calculateOrderEntryTotals, recalculateMaterial, recalculateOutsourcing } from "@/lib/workorder/detailCalculations";
import { formatBasicSummary, formatOrderSummary, getDisplayValue, getEditingInitialValue, getInspectionStatusLabel, getInspectionStatusTone } from "@/lib/workorder/detailFormatting";
import { appendOption, createId, getCategory2Options, getCategory3Options, getInitialBasicInfo, getInitialOrderEntries, normalizeEditingValue, sanitizeOrderEntry, sanitizeSelectValue, toNumber } from "@/lib/workorder/detailSanitizers";
import type { DisplayStage } from "@/types/workflow";
import { toDisplayValue } from "@/lib/utils/display";
import { getWorkOrderDisplayTitle } from "@/lib/utils/workorder";
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
const EDITABLE_FIELD_BASE_CLASS = `pbp-field-interaction ${EDITABLE_FIELD_HEIGHT_CLASS} block w-full min-w-0 max-w-full overflow-hidden whitespace-nowrap rounded-xl border px-3 text-stone-900 outline-none ring-0`;
const EDITABLE_INPUT_CLASS = `${EDITABLE_FIELD_BASE_CLASS} text-base md:text-sm border-stone-300 bg-white focus:border-stone-400 focus:bg-white`;
const EDITABLE_SELECT_CLASS = `${EDITABLE_INPUT_CLASS} appearance-none whitespace-nowrap pr-8`;
const EDITABLE_DISPLAY_CLASS = `${EDITABLE_FIELD_BASE_CLASS} text-sm flex items-center border-transparent bg-transparent hover:border-stone-200 hover:bg-stone-50 focus-visible:border-stone-300 focus-visible:bg-stone-50`;
const EDITABLE_VALUE_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
const TABLE_VALUE_TEXT_CLASS = "block w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap";
const TABLE_HEADER_TEXT_CLASS = "block w-full min-w-0 max-w-full whitespace-normal break-keep leading-4";
const MOBILE_INFO_ROW_CLASS = "grid min-w-0 grid-cols-[minmax(72px,88px)_minmax(0,1fr)] items-start gap-x-3";
const MOBILE_LABEL_CLASS = "min-w-0 text-left text-[11px] leading-5 tracking-tight text-stone-500";
const MOBILE_VALUE_WRAPPER_CLASS = "flex min-w-0 max-w-full items-center justify-end overflow-hidden text-right";
const TABLE_HEADER_CELL_CLASS = "min-w-0 overflow-hidden px-1.5 py-2 text-center text-[11px] font-medium leading-4 text-stone-600 lg:px-2 lg:text-[11px]";
const TABLE_BODY_CELL_CLASS = "min-w-0 overflow-hidden px-1.5 py-2 align-middle text-center text-[10px] leading-4 text-stone-900 lg:px-2 lg:text-[10px]";
const EDITABLE_VALUE_TEXT_WRAP_CLASS = "block w-full min-w-0 max-w-full whitespace-normal break-words leading-4";

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
    <div className="flex items-start gap-3 border-b border-stone-200 pb-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="pbp-touch-target pbp-interactive-button flex min-w-0 flex-1 items-start justify-between gap-3 rounded-xl px-0.5 py-0.5 text-left hover:bg-transparent active:bg-transparent"
      >
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-sm font-semibold leading-5 text-stone-900">{title}</div>
          <div className="mt-0.5 block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-4 text-stone-500 md:text-xs">{summary}</div>
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

function isEditingCell(editingCell: EditableCell, section: EditableSectionKey, rowId: string, field: string) {
  return editingCell?.section === section && editingCell.rowId === rowId && editingCell.field === field;
}

function DeleteButton({ onClick, srLabel, disabled = false }: { onClick: () => void; srLabel: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      disabled={disabled}
      className="pbp-interactive-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-base font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 active:bg-rose-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
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
  wrapText,
  centered,
  onStartEdit,
  onCommit,
  onCancel,
  compact,
  disabled = false,
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
    return (
      <select
        autoFocus
        value={editingValue}
        onChange={(event) => onCommit(event.target.value)}
        onBlur={(event) => onCommit(event.target.value)}
        onKeyDown={handleSelectKeyDown}
        className={`${EDITABLE_SELECT_CLASS} ${compact ? "mx-auto max-w-[11rem]" : ""} ${alignRight ? "text-right tabular-nums" : centered ? "text-center" : "text-left"}`}
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
        onChange={(event) => {
          const nextValue = normalizeEditingValue(field, event.target.value);
          if (inputType === "date") {
            onCommit(nextValue);
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
        onBlur={(event) => onCommit(event.target.value)}
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
      className={`${EDITABLE_DISPLAY_CLASS} ${compact ? "mx-auto max-w-[11rem]" : ""} ${alignRight ? "items-center justify-center w-[48px] text-right tabular-nums" : centered ? "justify-center text-center" : "text-left"} ${disabled ? "cursor-not-allowed opacity-60 hover:border-transparent hover:bg-transparent" : ""}`}
    >
      <span className={wrapText ? EDITABLE_VALUE_TEXT_WRAP_CLASS : EDITABLE_VALUE_TEXT_CLASS}>{getDisplayValue(field, value) || "-"}</span>
    </button>
  );
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

function OrderInspectionModal({
  open,
  orderEntries,
  currentInventoryQuantity,
  onClose,
  onApply,
}: {
  open: boolean;
  orderEntries: OrderEntryState[];
  currentInventoryQuantity: number;
  onClose: () => void;
  onApply: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const pendingEntries = orderEntries.filter((item) => item.inspectionStatus !== "검수완료");
  const availableEntries = pendingEntries.length > 0 ? pendingEntries : orderEntries;
  const [selectedFactory, setSelectedFactory] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [inspectionMemo, setInspectionMemo] = useState("");
  const [appliedQuantityInput, setAppliedQuantityInput] = useState("");

  useModalEnvironment({ open, dialogRef, onClose });

  const factoryOptions = Array.from(new Set(availableEntries.map((item) => item.factory || DEFAULT_FACTORY_OPTION)));
  const resolvedFactory = factoryOptions.includes(selectedFactory) ? selectedFactory : (factoryOptions[0] ?? "");
  const filteredEntries = availableEntries.filter((item) => (item.factory || DEFAULT_FACTORY_OPTION) === resolvedFactory);
  const selectedEntry = filteredEntries.find((item) => item.id === selectedOrderId) ?? filteredEntries[0] ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedFactory("");
      setSelectedOrderId("");
      setInspectionMemo("");
      setAppliedQuantityInput("");
      return;
    }

    if (!resolvedFactory) return;
    if (selectedFactory !== resolvedFactory) {
      setSelectedFactory(resolvedFactory);
    }
    if (!selectedEntry) return;
    if (selectedOrderId !== selectedEntry.id) {
      setSelectedOrderId(selectedEntry.id);
    }
  }, [open, resolvedFactory, selectedFactory, selectedEntry, selectedOrderId]);

  useEffect(() => {
    if (!open || !selectedEntry) return;
    setAppliedQuantityInput(String(Math.max(0, Number(selectedEntry.quantity) || 0)));
  }, [open, selectedEntry?.id]);

  const handleFactoryChange = (factory: string) => {
    setSelectedFactory(factory);
    const nextEntries = availableEntries.filter((item) => (item.factory || DEFAULT_FACTORY_OPTION) === factory);
    setSelectedOrderId(nextEntries[0]?.id || "");
  };

  const orderedQuantity = Math.max(0, Number(selectedEntry?.quantity) || 0);
  const appliedQuantity = Math.max(0, toNumber(appliedQuantityInput));
  const nextInventoryQuantity = Math.max(0, Number(currentInventoryQuantity) || 0) + appliedQuantity;

  const handleApply = () => {
    if (!selectedEntry) return;
    onApply({
      orderEntryId: selectedEntry.id,
      inboundQuantity: appliedQuantity,
      nextInventoryQuantity,
      memo: inspectionMemo,
    });
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="order-inspection-modal-title" maxWidthClassName="md:max-w-lg">
      <ModalHeader
        titleId="order-inspection-modal-title"
        title="검수 진행"
        description="공장을 선택한 뒤 실제 검수 반영 수량을 입력하고 메모와 함께 완료 처리합니다."
        onClose={onClose}
      />
      <ModalBody>
        {selectedEntry ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-xs text-stone-500">공장 선택</div>
                <select
                  value={selectedFactory}
                  onChange={(event) => handleFactoryChange(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
                >
                  {factoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="text-xs text-stone-500">발주행 선택</div>
                <select
                  value={selectedOrderId}
                  onChange={(event) => setSelectedOrderId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
                >
                  {filteredEntries.map((item) => (
                    <option key={item.id} value={item.id}>{item.type} · {item.quantity.toLocaleString()}장</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="text-xs text-stone-500">검수 대상</div>
                <div className="mt-1 text-sm font-semibold text-stone-900">{selectedEntry.factory || "-"}</div>
                <div className="mt-1 text-xs text-stone-500">{selectedEntry.type} · {selectedEntry.dueDate || "납기 미정"}</div>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="text-xs text-stone-500">현재 검수여부</div>
                <div className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInspectionStatusTone(selectedEntry.inspectionStatus ?? "발주대기")}`}>{getInspectionStatusLabel(selectedEntry.inspectionStatus ?? "발주대기")}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-500">재고 반영값</span>
                  <span className="text-xs text-stone-500">현재 {currentInventoryQuantity.toLocaleString()}장</span>
                </div>
                <div className="mt-2 text-lg font-semibold text-stone-900">{nextInventoryQuantity.toLocaleString()}장</div>
                <div className="mt-1 text-xs text-stone-500">현재 재고 {currentInventoryQuantity.toLocaleString()}장 + 실제 반영 수량 {appliedQuantity.toLocaleString()}장</div>
              </div>
              <label className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="text-xs text-stone-500">검수 반영 수량</div>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={appliedQuantityInput}
                  onChange={(event) => setAppliedQuantityInput(event.target.value)}
                  inputMode="numeric"
                  placeholder="검수 반영 수량 입력"
                  className="mt-2 h-10 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-stone-400"
                />
                <div className="mt-1 text-xs text-stone-500">발주 수량 {orderedQuantity.toLocaleString()}장 기준이며, PC에서는 입력창 포커스 상태에서 마우스 휠로 수량을 조정할 수 있습니다.</div>
              </label>
            </div>

            <label className="block rounded-2xl border border-stone-200 bg-white p-3">
              <div className="text-xs text-stone-500">검수 메모</div>
              <textarea
                value={inspectionMemo}
                onChange={(event) => setInspectionMemo(event.target.value)}
                rows={4}
                placeholder="검수 메모를 입력하면 검수 관련 로그에 함께 기록됩니다."
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
              />
            </label>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
            검수 진행 가능한 발주행이 없습니다.
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedEntry}
            className="flex-1 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            재고 반영 후 완료
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
  canOpenInspectionModal,
  locked = false,
  onOpenInspectionModal,
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
  canOpenInspectionModal: boolean;
  locked?: boolean;
  onOpenInspectionModal: () => void;
}) {
  const totals = calculateOrderEntryTotals(orderEntries);
  const inspectionButton = canOpenInspectionModal ? (
    <button
      type="button"
      onClick={onOpenInspectionModal}
      className="pbp-interactive-button inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
    >
      검수 진행
    </button>
  ) : null;

  return (
    <div className="overflow-hidden rounded-2xl bg-stone-50 p-3 md:p-3.5">
      <SectionHeader title="발주 정보" summary={formatOrderSummary(orderEntries)} open={open} onToggle={onToggle} rightSlot={inspectionButton} />
      {open ? (
        <>
          <div className="mt-2 space-y-2.5 md:hidden">
            {inspectionButton ? <div className="pb-0.5">{inspectionButton}</div> : null}
            {orderEntries.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="whitespace-nowrap text-sm font-semibold text-stone-900">{item.factory || `발주 ${index + 1}`}</div>
                    <div className="mt-1 whitespace-nowrap text-xs text-stone-500">{item.type} · {item.quantity.toLocaleString()}장</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || `발주 ${index + 1}`} 삭제`} disabled={locked} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["공장", "factory", item.factory, "text"],
                    ["납기일", "dueDate", item.dueDate, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["공임비", "laborCost", item.laborCost.toLocaleString(), "decimal"],
                    ["로스비", "lossCost", item.lossCost.toLocaleString(), "decimal"],
                    ["검수여부", "inspectionStatus", getInspectionStatusLabel(item.inspectionStatus ?? "발주대기"), "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className={MOBILE_INFO_ROW_CLASS}>
                      <span className={MOBILE_LABEL_CLASS}>{label}</span>
                      <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                        {field === "inspectionStatus" ? (
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInspectionStatusTone(item.inspectionStatus ?? "발주대기")}`}>{getInspectionStatusLabel(item.inspectionStatus ?? "발주대기")}</span>
                        ) : (
                          <EditableValue
                            section="order"
                            rowId={item.id}
                            field={String(field)}
                            value={String(value)}
                            editingCell={editingCell}
                            editingValue={editingValue}
                            inputMode={field === 'quantity' || field === 'laborCost' || field === 'lossCost' ? 'numeric' : inputMode as "text" | "decimal"}
                            inputType={field === 'dueDate' ? 'date' : 'text'}
                            options={field === 'type' ? ORDER_TYPE_OPTIONS : field === 'factory' ? factoryOptions : undefined}
                            alignRight
                            compact
                            onStartEdit={onStartEdit}
                            onCommit={onCommitEdit}
                            onCancel={onCancelEdit}
                            disabled={locked}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {locked ? null : (
              <button
                type="button"
                onClick={onAdd}
                className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
              >
                + 발주 추가
              </button>
            )}
          </div>
          <div className="mt-1 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-left">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["구분", "공장", "납기일", "수량", "공임비", "로스비", "검수여부", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={TABLE_HEADER_CELL_CLASS}
                    >
                      <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderEntries.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="type" value={item.type} options={ORDER_TYPE_OPTIONS} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="dueDate" value={item.dueDate} centered editingCell={editingCell} editingValue={editingValue} inputType="date" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="px-1.5 py-2 text-center align-middle text-[11px] lg:px-2 lg:text-[11px]"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium lg:text-[11px] ${getInspectionStatusTone(item.inspectionStatus ?? "발주대기")}`}>{getInspectionStatusLabel(item.inspectionStatus ?? "발주대기")}</span></td>
                    <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || `발주 ${rowIndex + 1}`} 삭제`} disabled={locked} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50/70">
                  <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>합계</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.quantity.toLocaleString()}장</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.laborCost.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.lossCost.toLocaleString()}원</td>
                  <td colSpan={2} />
                </tr>
                {locked ? null : (
                  <tr>
                    <td colSpan={8} className="px-3 pb-2 pt-2">
                      <button
                        type="button"
                        onClick={onAdd}
                        className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                      >
                        + 발주 추가
                      </button>
                    </td>
                  </tr>
                )}
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
  locked = false,
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
  locked?: boolean;
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
    <div className="overflow-hidden rounded-2xl bg-stone-50 p-3 md:p-3.5">
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
            locked={locked}
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
            locked={locked}
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
  locked = false,
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
  locked?: boolean;
}) {
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = materials.length > 0
    ? `${materials[0].name}${materials.length > 1 ? ` 외 ${materials.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 원단/부자재가 없습니다.";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 md:p-3.5">
      <SectionHeader
        title="원단 / 부자재"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-2 space-y-2.5 md:hidden">
            {materials.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="whitespace-nowrap text-sm font-semibold text-stone-900">{item.name || `자재 ${index + 1}`}</div>
                    <div className="mt-0.5 whitespace-nowrap text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${index + 1}`} 삭제`} disabled={locked} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["자재명", "name", item.name, "text"],
                    ["거래처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["단위", "unit", item.unit, "text"],
                    ["단가", "unitCost", item.unitCost.toLocaleString(), "decimal"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className={MOBILE_INFO_ROW_CLASS}>
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
                          compact
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                          disabled={locked}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {locked ? null : (
              <button
                type="button"
                onClick={onAdd}
                className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
              >
                + 항목 추가
              </button>
            )}
          </div>
          <div className="mt-1 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-left">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["구분", "자재명", "거래처", "수량", "단위", "단가", "금액", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`${TABLE_HEADER_CELL_CLASS} ${header === "" ? "text-center" : "text-center"}`}
                    >
                      <span className="block w-full whitespace-normal break-keep leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="type" value={item.type} options={MATERIAL_TYPE_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="name" value={item.name} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} options={MATERIAL_UNIT_OPTIONS} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="min-w-0 overflow-hidden px-1.5 py-2 text-center align-middle text-[11px] font-medium tabular-nums lg:px-2 lg:text-[11px]"><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}원</span></td>
                    <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${rowIndex + 1}`} 삭제`} disabled={locked} />
                    </td>
                  </tr>
                ))}
                {locked ? null : (
                  <tr>
                    <td colSpan={8} className="px-1.5 pb-1 pt-1.5 lg:px-2">
                      <button
                        type="button"
                        onClick={onAdd}
                        className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                      >
                        + 항목 추가
                      </button>
                    </td>
                  </tr>
                )}
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
  locked = false,
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
  locked?: boolean;
}) {
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = outsourcing.length > 0
    ? `${outsourcing[0].process}${outsourcing.length > 1 ? ` 외 ${outsourcing.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 외주 공정이 없습니다.";

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 md:p-3.5">
      <SectionHeader
        title="외주 공정"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-2 space-y-2.5 md:hidden">
            {outsourcing.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="whitespace-nowrap text-sm font-semibold text-stone-900">{item.process || `공정 ${index + 1}`}</div>
                    <div className="mt-0.5 whitespace-nowrap text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${index + 1}`} 삭제`} disabled={locked} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    ["공정", "process", item.process, "text"],
                    ["외주처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["단가기준", "unitType", item.unitType, "text"],
                    ["단가", "unitCost", item.unitCost.toLocaleString(), "decimal"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className={MOBILE_INFO_ROW_CLASS}>
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
                          compact
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                          disabled={locked}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {locked ? null : (
              <button
                type="button"
                onClick={onAdd}
                className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
              >
                + 공정 추가
              </button>
            )}
          </div>
          <div className="mt-1 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-left">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["공정", "외주처", "수량", "단가기준", "단가", "금액", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`${TABLE_HEADER_CELL_CLASS} ${header === "" ? "text-center" : "text-center"}`}
                    >
                      <span className="block w-full whitespace-normal break-keep leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outsourcing.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} options={OUTSOURCING_PROCESS_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={OUTSOURCING_UNIT_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="min-w-0 overflow-hidden px-1.5 py-2 text-center align-middle text-[11px] font-medium tabular-nums lg:px-2 lg:text-[11px]"><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}원</span></td>
                    <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${rowIndex + 1}`} 삭제`} disabled={locked} />
                    </td>
                  </tr>
                ))}
                {locked ? null : (
                  <tr>
                    <td colSpan={7} className="px-1.5 pb-1 pt-1.5 lg:px-2">
                      <button
                        type="button"
                        onClick={onAdd}
                        className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                      >
                        + 공정 추가
                      </button>
                    </td>
                  </tr>
                )}
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
  canRenameTitle = false,
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
  isReviewRequestLocked,
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
  onRenameWorkOrderTitle,
  onCompleteInspection,
}: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
  currentInventoryQuantity: number;
  currentUserName: string;
  currentUserRole: string;
  canRenameTitle?: boolean;
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
  isReviewRequestLocked: boolean;
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
  onRenameWorkOrderTitle: (nextTitle: string) => void;
  onCompleteInspection: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
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
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);

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

  const syncOrderEntries = (nextItems: OrderEntryState[], extraPatch: Partial<WorkOrder> = {}) => {
    onUpdateWorkOrder({
      ...extraPatch,
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

  const handleOpenInspectionModal = () => {
    setInspectionModalOpen(true);
  };

  const handleCloseInspectionModal = () => {
    setInspectionModalOpen(false);
  };

  const handleApplyInspection = ({
    orderEntryId,
    inboundQuantity,
    nextInventoryQuantity,
    memo,
  }: {
    orderEntryId: string;
    inboundQuantity: number;
    nextInventoryQuantity: number;
    memo: string;
  }) => {
    const nextItems = orderItems.map((item) => item.id === orderEntryId
      ? sanitizeOrderEntry({ ...item, inspectionStatus: "검수완료" }, item, currentWorkflowState)
      : item);
    setOrderItems(nextItems);
    onCompleteInspection({
      orderEntryId,
      inboundQuantity,
      nextInventoryQuantity,
      memo,
    });
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
        title={getWorkOrderDisplayTitle(workOrder)}
        summaryText={formatBasicSummary(basicInfo)}
        managerName={workOrder.manager || "-"}
        currentInventoryQuantity={currentInventoryQuantity}
        lastSavedAt={lastSavedAt}
        canChangeManager={canChangeManager}
        currentUserRole={currentUserRole}
        canRenameTitle={canRenameTitle}
        canEditInventory={canEditInventory}
        onSave={onSave}
        onOpenBasicInfoModal={handleOpenBasicInfoModal}
        onOpenManagerAssignModal={onOpenManagerAssignModal}
        onOpenInventoryEditor={onOpenInventoryEditor}
        onRenameTitle={onRenameWorkOrderTitle}
        locked={isReviewRequestLocked}
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
          canOpenInspectionModal={canEditInventory && (currentWorkflowState === "생산중" || currentWorkflowState === "검수중") && orderItems.some((item) => item.inspectionStatus !== "검수완료")}
          onOpenInspectionModal={handleOpenInspectionModal}
          locked={isReviewRequestLocked}
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
            locked={isReviewRequestLocked}
          />
        ) : null}
      </div>

      <OrderInspectionModal
        open={inspectionModalOpen}
        orderEntries={orderItems}
        currentInventoryQuantity={currentInventoryQuantity}
        onClose={handleCloseInspectionModal}
        onApply={handleApplyInspection}
      />

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
