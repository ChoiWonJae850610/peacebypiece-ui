import type { ReactNode } from "react";

import { AdminCard } from "@/components/admin/common/AdminSection";
import {
  WorkflowProgressPanel,
  type WorkflowProgressPanelAction,
  type WorkflowProgressPanelStep,
} from "@/components/common/workflow/WorkflowProgressPanel";
import {
  CALCULATED_TABLE_CELL_CLASS,
  DeleteButton,
  EDITABLE_TABLE_CELL_CLASS,
  SELECTABLE_TABLE_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
} from "@/components/workorder/detail/shared/detailEditorShared";
import {
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftTotals,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import { formatMaterialOrderStatusLabel } from "@/lib/material-orders/materialOrderWorkspaceClient";
import type {
  MaterialOrder,
  MaterialOrderStatus,
  MaterialOrderSupplier,
} from "@/lib/material-orders/types";

type MaterialOrderDetailPanelProps = {
  selectedOrder: MaterialOrder | null;
  materialType: MaterialOrderDraftType;
  supplierPartnerId: string | null;
  suppliers: MaterialOrderSupplier[];
  suppliersLoading: boolean;
  suppliersError: string | null;
  lines: MaterialOrderDraftLine[];
  totals: MaterialOrderDraftTotals;
  onChangeMaterialType: (materialType: MaterialOrderDraftType) => void;
  onChangeSupplierPartnerId: (partnerId: string | null) => void;
  onRetrySuppliers: () => void;
  statusChanging: boolean;
  statusMessage: string | null;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
  onChangeStatus: (status: MaterialOrderStatus) => void;
};

const MATERIAL_ORDER_UNIT_OPTIONS = [
  "마",
  "야드",
  "개",
  "세트",
  "롤",
  "봉",
  "박스",
] as const;

export default function MaterialOrderDetailPanel({
  selectedOrder,
  materialType,
  supplierPartnerId,
  suppliers,
  suppliersLoading,
  suppliersError,
  lines,
  totals,
  onChangeMaterialType,
  onChangeSupplierPartnerId,
  onRetrySuppliers,
  statusChanging,
  statusMessage,
  onChangeLine,
  onRemoveLine,
  onChangeStatus,
}: MaterialOrderDetailPanelProps) {
  const displayMaterialType = materialType;

  return (
    <AdminCard className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-2.5">
      {selectedOrder ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <MaterialOrderStatusFlow
            status={selectedOrder.status}
            changing={statusChanging}
            message={statusMessage}
            onChangeStatus={onChangeStatus}
          />

          <div className="grid shrink-0 gap-2 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-3 shadow-sm xl:grid-cols-2">
            <FieldLabel label="구분">
              <select
                value={displayMaterialType}
                disabled={selectedOrder.status !== "draft"}
                onChange={(event) =>
                  onChangeMaterialType(
                    event.target.value as MaterialOrderDraftType,
                  )
                }
                className={compactSelectClassName()}
              >
                <option value="fabric">원단</option>
                <option value="submaterial">부자재</option>
              </select>
            </FieldLabel>
            <FieldLabel label="공급처">
              <select
                value={supplierPartnerId ?? ""}
                disabled={selectedOrder.status !== "draft" || suppliersLoading}
                onChange={(event) =>
                  onChangeSupplierPartnerId(event.target.value || null)
                }
                className={compactSelectClassName()}
              >
                <option value="">
                  {resolveSupplierPlaceholder(
                    suppliersLoading,
                    suppliers.length,
                  )}
                </option>
                {suppliers.map((supplier) => (
                  <option
                    key={`${supplier.type}-${supplier.id}`}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
              {suppliersError ? (
                <button
                  type="button"
                  onClick={onRetrySuppliers}
                  className="mt-1 w-fit text-[11px] font-semibold text-rose-600 underline-offset-2 hover:underline"
                >
                  공급처 조회 실패 · 다시 조회
                </button>
              ) : null}
            </FieldLabel>
          </div>

          <div className="flex min-h-[10rem] flex-1 overflow-hidden rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
            <div className="h-full min-h-0 w-full max-w-full overflow-auto rounded-lg border border-stone-200 bg-white">
              <table className="w-full min-w-[540px] table-fixed text-left">
                <colgroup>
                  <col className="w-[27%]" />
                  <col className="w-[13%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                  <col className="w-[7%]" />
                </colgroup>
                <thead className="text-stone-500">
                  <tr className="border-b border-stone-200">
                    {["품목명", "단위", "수량", "단가", "금액", ""].map(
                      (header, index) => (
                        <th
                          key={`${header}-${index}`}
                          className={`${TABLE_HEADER_CELL_CLASS} text-center`}
                        >
                          <span className="block w-full whitespace-nowrap leading-4">
                            {header}
                          </span>
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td
                        className="h-20 px-3 text-center text-xs text-stone-500"
                        colSpan={6}
                      >
                        주문할 자재를 선택하세요.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, rowIndex) => (
                      <MaterialOrderLineRow
                        key={line.id}
                        line={line}
                        rowIndex={rowIndex}
                        editable={selectedOrder.status === "draft"}
                        onChangeLine={onChangeLine}
                        onRemoveLine={onRemoveLine}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-2.5 text-[11px]">
            <div className="grid grid-cols-3 items-center gap-4">
              <SummaryValue label="품목" value={`${totals.lineCount}종`} />
              <SummaryValue
                label="주문"
                value={String(totals.totalOrderQuantity)}
              />
              <SummaryValue
                label="할당/잔여"
                value={`${totals.totalAllocatedQuantity} / ${totals.totalRemainingQuantity}`}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-end">
              <SummaryValue
                label="합계"
                value={formatMaterialOrderAmount(totals.totalAmount)}
                emphasize
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-6 text-center">
          <div>
            <p className="text-base font-semibold pbp-text-primary">
              선택된 발주서가 없습니다.
            </p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">
              왼쪽 패널에서 새 발주를 만들거나 기존 발주서를 선택하면 상세 입력
              영역이 열립니다.
            </p>
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function MaterialOrderLineRow({
  line,
  rowIndex,
  editable,
  onChangeLine,
  onRemoveLine,
}: {
  line: MaterialOrderDraftLine;
  rowIndex: number;
  editable: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);
  return (
    <tr
      className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}
    >
      <td className={EDITABLE_TABLE_CELL_CLASS}>
        <input
          value={line.itemName}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, { itemName: event.target.value })
          }
          placeholder="예: 30수 면 블랙"
          className={compactInputClassName("text-center")}
        />
      </td>
      <td className={SELECTABLE_TABLE_CELL_CLASS}>
        <select
          value={resolveUnitSelectValue(line.unit)}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, { unit: event.target.value })
          }
          className={compactSelectClassName("text-center")}
        >
          <option value="">단위</option>
          {MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </td>
      <td className={EDITABLE_TABLE_CELL_CLASS}>
        <input
          type="text"
          inputMode="decimal"
          value={line.orderQuantity}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, {
              orderQuantity: normalizeNumberInput(event.target.value),
            })
          }
          className={compactInputClassName("text-center tabular-nums")}
        />
      </td>
      <td className={EDITABLE_TABLE_CELL_CLASS}>
        <input
          type="text"
          inputMode="numeric"
          value={line.unitPrice}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, {
              unitPrice: normalizeNumberInput(event.target.value),
            })
          }
          className={compactInputClassName("text-right tabular-nums")}
        />
      </td>
      <td
        className={CALCULATED_TABLE_CELL_CLASS}
        title={formatMaterialOrderAmount(lineAmount)}
      >
        <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {formatMaterialOrderAmount(lineAmount)}
        </span>
      </td>
      <td className="px-1.5 py-2 text-center align-middle lg:px-2">
        <DeleteButton
          onClick={() => onRemoveLine(line.id)}
          srLabel="주문 내역 삭제"
          disabled={!editable}
        />
      </td>
    </tr>
  );
}

function MaterialOrderStatusFlow({
  status,
  changing,
  message,
  onChangeStatus,
}: {
  status: MaterialOrderStatus;
  changing: boolean;
  message: string | null;
  onChangeStatus: (status: MaterialOrderStatus) => void;
}) {
  const steps: Array<{ status: MaterialOrderStatus; label: string }> = [
    { status: "draft", label: "작성중" },
    { status: "review_requested", label: "검토요청" },
    { status: "approved", label: "발주요청" },
    { status: "order_placed", label: "발주완료" },
  ];
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.status === status),
  );
  const actions = resolveMaterialOrderStatusActions(status);
  const primaryActionIndex = actions.length > 0 ? actions.length - 1 : -1;
  const progressSteps: WorkflowProgressPanelStep[] = steps.map(
    (step, index) => ({
      key: step.status,
      label: step.label,
      isDone: index <= currentIndex,
      isCurrent: step.status === status,
    }),
  );
  const progressActions: WorkflowProgressPanelAction[] = actions.map(
    (action, index) => ({
      key: `${status}-${action.nextStatus}`,
      label: action.label,
      onClick: () => onChangeStatus(action.nextStatus),
      disabled: changing,
      isPrimary: index === primaryActionIndex,
    }),
  );

  return (
    <WorkflowProgressPanel
      title="진행 단계"
      steps={progressSteps}
      actions={progressActions}
      density="compact"
      footer={
        <>
          <span>자재 발주</span>
          <span>·</span>
          <span>{message ?? formatMaterialOrderStatusLabel(status)}</span>
        </>
      }
    />
  );
}

function resolveMaterialOrderStatusActions(
  status: MaterialOrderStatus,
): Array<{ label: string; nextStatus: MaterialOrderStatus }> {
  switch (status) {
    case "draft":
      return [
        { label: "검토 요청", nextStatus: "review_requested" },
        { label: "발주 요청", nextStatus: "approved" },
      ];
    case "review_requested":
      return [{ label: "검토 취소", nextStatus: "draft" }];
    case "approved":
      return [{ label: "발주 완료", nextStatus: "order_placed" }];
    default:
      return [];
  }
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-0.5 text-[11px] font-semibold pbp-text-subtle">
      {label}
      {children}
    </label>
  );
}

function SummaryValue({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-1.5">
      <span className="shrink-0 text-[11px] font-semibold pbp-text-subtle">
        {label}
      </span>
      <span
        className={`truncate text-xs font-semibold tabular-nums ${emphasize ? "pbp-text-primary" : "pbp-text-muted"}`}
      >
        {value}
      </span>
    </div>
  );
}

function normalizeNumberInput(value: string): number {
  const normalizedValue = value.replace(/,/g, "").trim();
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveUnitSelectValue(unit: string): string {
  return MATERIAL_ORDER_UNIT_OPTIONS.includes(
    unit as (typeof MATERIAL_ORDER_UNIT_OPTIONS)[number],
  )
    ? unit
    : "";
}

function compactInputClassName(extra = "") {
  return [
    "pbp-field-interaction pbp-workorder-editable-input h-7 block w-full min-w-0 max-w-full overflow-hidden rounded-md border px-2 text-xs outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-70",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function compactSelectClassName(extra = "") {
  return [
    "pbp-field-interaction pbp-workorder-editable-input h-7 block w-full min-w-0 max-w-full overflow-hidden rounded-md border px-2 pr-6 text-xs outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-70",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function resolveSupplierPlaceholder(
  loading: boolean,
  supplierCount: number,
): string {
  if (loading) return "공급처 조회중";
  if (supplierCount === 0) return "등록된 공급처 없음";
  return "공급처 선택";
}
