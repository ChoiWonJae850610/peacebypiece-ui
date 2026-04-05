import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { getStageTone } from "@/lib/constants/workflow";
import type { DisplayStage } from "@/types/workflow";
import { toDisplayValue } from "@/lib/utils/display";
import type { Material, Outsourcing, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";

type RowValue = string | number | null | undefined;
type EditableSectionKey = "material" | "outsourcing";
type EditableCell = { section: EditableSectionKey; rowId: string; field: string } | null;

function Info({ label, value, valueClassName }: { label: string; value: RowValue; valueClassName?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-3">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`mt-1 font-medium ${valueClassName ?? "text-sm"}`}>{toDisplayValue(value)}</div>
    </div>
  );
}

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
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition hover:border-stone-300 hover:bg-stone-50"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-stone-900 md:text-base">{title}</div>
          <div className="mt-1 truncate text-xs text-stone-500 md:text-sm">{summary}</div>
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-600 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
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

function isEditingCell(editingCell: EditableCell, section: EditableSectionKey, rowId: string, field: string) {
  return editingCell?.section === section && editingCell.rowId === rowId && editingCell.field === field;
}

function DeleteButton({ onClick, srLabel }: { onClick: () => void; srLabel: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={srLabel}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-base font-semibold text-rose-600 transition hover:bg-rose-50"
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
  alignRight,
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
  alignRight?: boolean;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const editing = isEditingCell(editingCell, section, rowId, field);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        inputMode={inputMode}
        value={editingValue}
        onChange={(event) => onStartEdit(section, rowId, field, event.target.value)}
        onBlur={onCommit}
        onKeyDown={handleKeyDown}
        className={`h-9 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-stone-900 outline-none ring-0 transition focus:border-stone-400 ${alignRight ? "text-right tabular-nums" : "text-left"}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => onStartEdit(section, rowId, field, value)}
      className={`flex h-9 w-full min-w-0 items-center rounded-lg border border-transparent px-2.5 text-sm text-stone-900 transition hover:border-stone-200 hover:bg-stone-50 ${alignRight ? "justify-end text-right tabular-nums" : "text-left"}`}
    >
      <span className="block w-full truncate">{value || "-"}</span>
    </button>
  );
}


function StageProgressBar({ stages, currentStage }: { stages: DisplayStage[]; currentStage: DisplayStage }) {
  const currentIndex = stages.indexOf(currentStage);
  const previousStage = currentIndex > 0 ? stages[currentIndex - 1] : null;
  const nextStage = currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 md:mt-5 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-stone-900 md:text-sm">진행 단계</div>
          <div className="mt-1 text-[11px] text-stone-500 md:text-xs">현재 상태를 중심으로 확인합니다.</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium md:px-3 md:text-xs ${getStageTone(currentStage)}`}>{currentStage}</span>
      </div>

      <div className="mt-3 md:hidden">
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500">
            <span className="min-w-0 flex-1 truncate text-left">{previousStage ?? "시작"}</span>
            <span className="shrink-0">→</span>
            <span className="rounded-full bg-stone-900 px-2.5 py-1 text-[11px] font-semibold text-white">{currentStage}</span>
            <span className="shrink-0">→</span>
            <span className="min-w-0 flex-1 truncate text-right">{nextStage ?? "완료"}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 hidden overflow-x-auto pb-1 md:block">
        <div className="flex min-w-max items-center gap-2">
          {stages.map((stage, index) => {
            const isCurrent = stage === currentStage;
            const isDone = currentIndex >= 0 && index < currentIndex;
            const isUpcoming = !isCurrent && !isDone;

            return (
              <div key={stage} className="flex items-center gap-2">
                <div className="flex min-w-[82px] flex-col items-center text-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isCurrent
                        ? "bg-stone-900 text-white"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>
                  <div
                    className={`mt-1.5 text-[11px] leading-4 ${
                      isCurrent
                        ? "font-semibold text-stone-900"
                        : isUpcoming
                        ? "text-stone-500"
                        : "text-stone-700"
                    }`}
                  >
                    {stage}
                  </div>
                </div>
                {index < stages.length - 1 ? <div className="h-px w-6 shrink-0 bg-stone-300" /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BasicInfoSection({
  workOrder,
  currentInventoryQuantity,
  canEditInventory,
  currentUserName,
  currentRole,
  open,
  onToggle,
  onOpenInventoryEditor,
}: {
  workOrder: WorkOrder;
  currentInventoryQuantity: number;
  canEditInventory: boolean;
  currentUserName: string;
  currentRole: string;
  open: boolean;
  onToggle: () => void;
  onOpenInventoryEditor: () => void;
}) {
  const infoItems: [string, RowValue, string?][] = [
    ["대분류", workOrder.category1],
    ["중분류", workOrder.category2],
    ["소분류", workOrder.category3],
    ["시즌", workOrder.season],
    ["우선순위", workOrder.priority],
    ["공장", workOrder.vendor],
    ["담당자", workOrder.manager],
    ["납기일", workOrder.dueDate],
    ["발주 수량", `${workOrder.quantity}장`, "text-base font-semibold tabular-nums"],
    ["재고 수량", `${currentInventoryQuantity}장`, "text-base font-semibold tabular-nums"],
  ];

  const summary = [workOrder.category1, workOrder.category2, workOrder.vendor, `${workOrder.quantity}장`, workOrder.dueDate]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader title="기본 정보" summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {infoItems.map(([label, value, valueClassName]) => (
              <Info key={label} label={label} value={value} valueClassName={valueClassName} />
            ))}
          </div>
          {canEditInventory && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3">
              <div>
                <div className="text-sm font-semibold text-stone-900">재고 수정</div>
                <div className="mt-1 text-xs text-stone-500">수정자: {currentUserName} · {currentRole}</div>
              </div>
              <button type="button" onClick={onOpenInventoryEditor} className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white">재고 수정</button>
            </div>
          )}
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
}) {
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = materials.length > 0
    ? `${materials[0].name}${materials.length > 1 ? ` 외 ${materials.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 원단/부자재가 없습니다.";

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader
        title="원단 / 부자재 구성"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {materials.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{item.name || `자재 ${index + 1}`}</div>
                    <div className="mt-1 text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["자재명", "name", item.name, "text"],
                    ["거래처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", String(item.quantity), "decimal"],
                    ["단위", "unit", item.unit, "text"],
                    ["단가", "unitCost", String(item.unitCost), "decimal"],
                    ["상태", "status", item.status, "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center justify-between gap-4">
                      <span className="shrink-0 text-xs text-stone-500">{label}</span>
                      <div className="min-w-0 flex-1">
                        <EditableValue
                          section="material"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          alignRight={field === "quantity" || field === "unitCost"}
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4">
                    <span className="shrink-0 text-xs text-stone-500">금액</span>
                    <span className="text-sm font-medium text-stone-900">{(item.totalCost ?? 0).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              + 항목 추가
            </button>
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[19%]" />
                <col className="w-[18%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[60px]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["구분", "자재명", "거래처", "수량", "단위", "단가", "금액", "상태", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-3 text-xs font-medium ${header === "수량" || header === "단가" || header === "금액" ? "text-right" : header === "" ? "text-center" : "text-left"}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="type" value={item.type} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="name" value={item.name} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="quantity" value={String(item.quantity)} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="unitCost" value={String(item.unitCost)} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 text-right align-middle font-medium tabular-nums">{(item.totalCost ?? 0).toLocaleString()}원</td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="material" rowId={item.id} field="status" value={item.status} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="px-2 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || `자재 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={9} className="px-2 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
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
}) {
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const summary = outsourcing.length > 0
    ? `${outsourcing[0].process}${outsourcing.length > 1 ? ` 외 ${outsourcing.length - 1}개` : ""} · 총 ${total.toLocaleString()}원`
    : "등록된 외주 공정이 없습니다.";

  return (
    <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
      <SectionHeader
        title="외주 공정"
        summary={summary}
        open={open}
        onToggle={onToggle}
      />
      {open ? (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {outsourcing.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{item.process || `공정 ${index + 1}`}</div>
                    <div className="mt-1 text-xs text-stone-500">금액 {(item.totalCost ?? 0).toLocaleString()}원</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${index + 1}`} 삭제`} />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    ["공정", "process", item.process, "text"],
                    ["외주처", "vendor", item.vendor, "text"],
                    ["수량", "quantity", String(item.quantity), "decimal"],
                    ["단가기준", "unitType", item.unitType, "text"],
                    ["단가", "unitCost", String(item.unitCost), "decimal"],
                    ["상태", "status", item.status, "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className="flex items-center justify-between gap-4">
                      <span className="shrink-0 text-xs text-stone-500">{label}</span>
                      <div className="min-w-0 flex-1">
                        <EditableValue
                          section="outsourcing"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          alignRight={field === "quantity" || field === "unitCost"}
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4">
                    <span className="shrink-0 text-xs text-stone-500">금액</span>
                    <span className="text-sm font-medium text-stone-900">{(item.totalCost ?? 0).toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              + 공정 추가
            </button>
          </div>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[60px]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {["공정", "외주처", "수량", "단가기준", "단가", "금액", "상태", ""].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-3 text-xs font-medium ${header === "수량" || header === "단가" || header === "금액" ? "text-right" : header === "" ? "text-center" : "text-left"}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {outsourcing.map((item, rowIndex) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={String(item.quantity)} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={String(item.unitCost)} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="min-w-0 px-2 py-2 text-right align-middle font-medium tabular-nums">{(item.totalCost ?? 0).toLocaleString()}원</td>
                    <td className="min-w-0 px-2 py-2 align-middle"><EditableValue section="outsourcing" rowId={item.id} field="status" value={item.status} editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} /></td>
                    <td className="px-2 py-2 text-center align-middle">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || `공정 ${rowIndex + 1}`} 삭제`} />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={8} className="px-2 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
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
  currentRole,
  canEditInventory,
  canSeeProductionSections,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onSave,
  onOpenInventoryEditor,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  visibleStages,
  currentDisplayStage,
  actions,
  onAction,
}: {
  workOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  saveStatus: "saved" | "dirty" | "saving";
  lastSavedAt: string | null;
  currentInventoryQuantity: number;
  currentUserName: string;
  currentRole: string;
  canEditInventory: boolean;
  canSeeProductionSections: boolean;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onSave: () => void;
  onOpenInventoryEditor: () => void;
  onToggleBasicInfo: () => void;
  onToggleMaterial: () => void;
  onToggleOutsourcing: () => void;
  visibleStages: DisplayStage[];
  currentDisplayStage: DisplayStage;
  actions: WorkflowAction[];
  onAction: (action: WorkflowAction) => void;
}) {
  const [materialItems, setMaterialItems] = useState<Material[]>(() => (workOrder.materials ?? []).map(recalculateMaterial));
  const [outsourcingItems, setOutsourcingItems] = useState<Outsourcing[]>(() => (workOrder.outsourcing ?? []).map(recalculateOutsourcing));
  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [editingValue, setEditingValue] = useState("");

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
    setEditingCell(null);
    setEditingValue("");
  };

  const commitEdit = () => {
    if (!editingCell) return;

    const nextValue = editingValue.trim();

    if (editingCell.section === "material") {
      setMaterialItems((current) =>
        current.map((item) => {
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
        }),
      );
    }

    if (editingCell.section === "outsourcing") {
      setOutsourcingItems((current) =>
        current.map((item) => {
          if (item.id !== editingCell.rowId) return item;

          if (editingCell.field === "quantity") {
            return recalculateOutsourcing({ ...item, quantity: toNumber(nextValue) });
          }
          if (editingCell.field === "unitCost") {
            return recalculateOutsourcing({ ...item, unitCost: toNumber(nextValue) });
          }

          return { ...item, [editingCell.field]: nextValue } as Outsourcing;
        }),
      );
    }

    cancelEdit();
  };

  const addMaterial = () => {
    setMaterialItems((current) => [
      ...current,
      recalculateMaterial({
        id: createId("material"),
        type: "원단",
        name: "새 자재",
        vendor: "",
        quantity: 0,
        unit: "yd",
        unitCost: 0,
        totalCost: 0,
        status: "준비",
      }),
    ]);
  };

  const removeMaterial = (id: string) => {
    setMaterialItems((current) => current.filter((item) => item.id !== id));
    if (editingCell?.section === "material" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const addOutsourcing = () => {
    setOutsourcingItems((current) => [
      ...current,
      recalculateOutsourcing({
        id: createId("outsourcing"),
        process: "새 공정",
        vendor: "",
        quantity: 0,
        unitType: "장",
        unitCost: 0,
        totalCost: 0,
        status: "대기",
      }),
    ]);
  };

  const removeOutsourcing = (id: string) => {
    setOutsourcingItems((current) => current.filter((item) => item.id !== id));
    if (editingCell?.section === "outsourcing" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="mt-1 break-keep text-2xl font-semibold">{workOrder.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStageTone(currentWorkflowState)}`}>상태: {currentWorkflowState}</div>
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${saveStatus === "saving" ? "bg-cyan-100 text-cyan-800" : saveStatus === "dirty" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {saveStatus === "saving" ? "저장 중" : saveStatus === "dirty" ? "저장되지 않음" : "저장됨"}
            </div>
            {lastSavedAt && <div className="text-xs text-stone-500">마지막 저장: {lastSavedAt}</div>}
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {actions.length > 0 ? (
            actions.map((action) => (
              <button
                key={`${currentWorkflowState}-${action.nextState}-${action.label}`}
                type="button"
                onClick={() => onAction(action)}
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-100 sm:flex-none"
              >
                {action.label}
              </button>
            ))
          ) : null}
          <button type="button" className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm sm:flex-none">복제</button>
          <button type="button" onClick={onSave} className="flex-1 rounded-xl bg-stone-900 px-4 py-2 text-sm text-white sm:flex-none">즉시 저장</button>
        </div>
      </div>

      <StageProgressBar stages={visibleStages} currentStage={currentDisplayStage} />

      <div className="mt-6 grid gap-6">
        <BasicInfoSection
          workOrder={workOrder}
          currentInventoryQuantity={currentInventoryQuantity}
          canEditInventory={canEditInventory}
          currentUserName={currentUserName}
          currentRole={currentRole}
          open={basicInfoOpen}
          onToggle={onToggleBasicInfo}
          onOpenInventoryEditor={onOpenInventoryEditor}
        />

        {canSeeProductionSections ? (
          <MaterialSection
            materials={materialItems}
            open={materialOpen}
            onToggle={onToggleMaterial}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onAdd={addMaterial}
            onRemove={removeMaterial}
          />
        ) : null}
        {canSeeProductionSections ? (
          <OutsourcingSection
            outsourcing={outsourcingItems}
            open={outsourcingOpen}
            onToggle={onToggleOutsourcing}
            editingCell={editingCell}
            editingValue={editingValue}
            onStartEdit={startEdit}
            onCommitEdit={commitEdit}
            onCancelEdit={cancelEdit}
            onAdd={addOutsourcing}
            onRemove={removeOutsourcing}
          />
        ) : null}

        <div className="rounded-2xl bg-stone-50 p-4 md:p-5">
          <h3 className="text-base font-semibold">작업 메모</h3>
          <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">{workOrder.memo}</div>
        </div>
      </div>
    </div>
  );
}
