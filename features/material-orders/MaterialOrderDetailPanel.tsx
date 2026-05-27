import type { ReactNode } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import {
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftTotals,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import { formatMaterialOrderStatusLabel } from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder, MaterialOrderStatus, MaterialOrderSupplier } from "@/lib/material-orders/types";

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
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onRemoveLine: (lineId: string) => void;
  onChangeStatus: (status: MaterialOrderStatus) => void;
};

const MATERIAL_ORDER_UNIT_OPTIONS = ["마", "야드", "개", "세트", "롤", "봉", "박스"] as const;

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
    <AdminCard className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3">
      {selectedOrder ? (
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-2.5">
          <div className="grid gap-2 rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-2.5">
            <MaterialOrderStatusFlow
              status={selectedOrder.status}
              changing={statusChanging}
              message={statusMessage}
              onChangeStatus={onChangeStatus}
            />

            <div className="grid gap-2 xl:grid-cols-2">
              <FieldLabel label="구분">
                <select
                  value={displayMaterialType}
                  disabled={selectedOrder.status !== "draft"}
                  onChange={(event) => onChangeMaterialType(event.target.value as MaterialOrderDraftType)}
                  className={fieldClassName()}
                >
                  <option value="fabric">원단</option>
                  <option value="submaterial">부자재</option>
                </select>
              </FieldLabel>
              <FieldLabel label="공급처">
                <select
                  value={supplierPartnerId ?? ""}
                  disabled={selectedOrder.status !== "draft" || suppliersLoading}
                  onChange={(event) => onChangeSupplierPartnerId(event.target.value || null)}
                  className={fieldClassName()}
                >
                  <option value="">{resolveSupplierPlaceholder(suppliersLoading, suppliers.length)}</option>
                  {suppliers.map((supplier) => (
                    <option key={`${supplier.type}-${supplier.id}`} value={supplier.id}>
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
          </div>

          <div className="flex min-h-0 flex-col rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-2.5">
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full min-w-[540px] table-fixed border-collapse text-left text-xs">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[16%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-stone-50/90 text-[11px] font-semibold text-stone-500">
                  <tr className="border-b border-stone-200">
                    <th className="px-2.5 py-1.5 text-center">품목명</th>
                    <th className="px-2 py-1.5 text-center">단위</th>
                    <th className="px-2 py-1.5 text-center">수량</th>
                    <th className="px-2 py-1.5 text-center">단가</th>
                    <th className="px-2 py-1.5 text-center">금액</th>
                    <th className="px-1.5 py-1.5 text-center" aria-label="삭제" />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-xs text-stone-500" colSpan={6}>
                        주문할 자재를 선택하세요.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <MaterialOrderLineRow
                        key={line.id}
                        line={line}
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

          <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs">
            <SummaryValue label="품목" value={`${totals.lineCount}종`} />
            <SummaryValue label="주문" value={String(totals.totalOrderQuantity)} />
            <SummaryValue label="할당/잔여" value={`${totals.totalAllocatedQuantity} / ${totals.totalRemainingQuantity}`} />
            <SummaryValue label="합계" value={formatMaterialOrderAmount(totals.totalAmount)} emphasize />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-6 text-center">
          <div>
            <p className="text-base font-semibold pbp-text-primary">선택된 발주서가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">왼쪽 패널에서 새 발주를 만들거나 기존 발주서를 선택하면 상세 입력 영역이 열립니다.</p>
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function MaterialOrderLineRow({
  line,
  editable,
  onChangeLine,
  onRemoveLine,
}: {
  line: MaterialOrderDraftLine;
  editable: boolean;
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onRemoveLine: (lineId: string) => void;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);
  return (
    <tr className="border-b border-stone-100 bg-white align-middle transition hover:bg-stone-50">
      <td className="px-2.5 py-1.5">
        <input
          value={line.itemName}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { itemName: event.target.value })}
          placeholder="예: 30수 면 블랙"
          className={fieldClassName("min-w-[160px]")}
        />
      </td>
      <td className="px-2 py-1.5">
        <select
          value={resolveUnitSelectValue(line.unit)}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { unit: event.target.value })}
          className={fieldClassName("w-full text-center")}
        >
          <option value="">단위</option>
          {MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={line.orderQuantity}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { orderQuantity: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-full text-center")}
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          inputMode="numeric"
          value={line.unitPrice}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { unitPrice: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-full text-right tabular-nums")}
        />
      </td>
      <td className="px-2 py-1.5 text-right text-xs font-semibold tabular-nums pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</td>
      <td className="px-1.5 py-1.5 text-center">
        <button
          type="button"
          disabled={!editable}
          onClick={() => onRemoveLine(line.id)}
          aria-label="주문 내역 삭제"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-100 bg-white text-sm font-semibold leading-none text-rose-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
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
  const currentIndex = Math.max(0, steps.findIndex((step) => step.status === status));
  const actions = resolveMaterialOrderStatusActions(status);

  return (
    <div className="rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold pbp-text-primary">진행 단계</p>
        </div>
        {actions.length > 0 ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {actions.map((action, index) => (
              <AdminButton
                key={`${status}-${action.nextStatus}`}
                size="sm"
                className="min-h-8 px-3 py-1 text-xs"
                variant={index === actions.length - 1 ? "primary" : "ghost"}
                disabled={changing}
                onClick={() => onChangeStatus(action.nextStatus)}
              >
                {action.label}
              </AdminButton>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const isDone = index <= currentIndex;
          const isCurrent = step.status === status;
          return (
            <div key={step.status} className="relative flex flex-col items-center gap-2 text-center">
              {index < steps.length - 1 ? (
                <div className={`absolute left-1/2 top-3 h-0.5 w-full ${isDone ? "bg-[var(--pbp-selected-border)]" : "bg-[var(--pbp-border)]"}`} aria-hidden="true" />
              ) : null}
              <div
                className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                  isDone ? "border-transparent bg-[var(--pbp-selected-border)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isDone ? "bg-white" : "bg-[var(--pbp-text-subtle)]"}`} />
              </div>
              <div className={`text-xs font-medium ${isCurrent ? "pbp-text-primary" : "pbp-text-muted"}`}>{step.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs pbp-text-muted">
        <span>자재 발주</span>
        <span>{message ?? formatMaterialOrderStatusLabel(status)}</span>
      </div>
    </div>
  );
}

function resolveMaterialOrderStatusActions(status: MaterialOrderStatus): Array<{ label: string; nextStatus: MaterialOrderStatus }> {
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

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
      {label}
      {children}
    </label>
  );
}

function SummaryValue({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="shrink-0 text-[11px] font-semibold pbp-text-subtle">{label}</span>
      <span className={`truncate text-xs font-semibold tabular-nums ${emphasize ? "pbp-text-primary" : "pbp-text-muted"}`}>{value}</span>
    </div>
  );
}

function normalizeNumberInput(value: string): number {
  const normalizedValue = value.replace(/,/g, "").trim();
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveUnitSelectValue(unit: string): string {
  return MATERIAL_ORDER_UNIT_OPTIONS.includes(unit as typeof MATERIAL_ORDER_UNIT_OPTIONS[number]) ? unit : "";
}

function fieldClassName(extra = "") {
  return [
    "min-h-7 w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] pbp-text-primary outline-none transition placeholder:text-stone-400 focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] disabled:bg-stone-50 disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}

function resolveSupplierPlaceholder(loading: boolean, supplierCount: number): string {
  if (loading) return "공급처 조회중";
  if (supplierCount === 0) return "등록된 공급처 없음";
  return "공급처 선택";
}
