import type { ReactNode } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineAmount,
  calculateMaterialOrderLineRemainingQuantity,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftTotals,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  formatMaterialOrderDateLabel,
  formatMaterialOrderDisplayTitle,
  formatMaterialOrderPrimaryLineLabel,
  formatMaterialOrderRequesterLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderStatusBadgeTone,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder, MaterialOrderStatus, MaterialOrderSupplier } from "@/lib/material-orders/types";

type MaterialOrderDetailPanelProps = {
  selectedOrder: MaterialOrder | null;
  materialType: MaterialOrderDraftType;
  supplierPartnerId: string | null;
  suppliers: MaterialOrderSupplier[];
  suppliersLoading: boolean;
  suppliersError: string | null;
  destinationMemo: string;
  orderNote: string;
  lines: MaterialOrderDraftLine[];
  totals: MaterialOrderDraftTotals;
  onChangeMaterialType: (materialType: MaterialOrderDraftType) => void;
  onChangeSupplierPartnerId: (partnerId: string | null) => void;
  onRetrySuppliers: () => void;
  onChangeDestinationMemo: (memo: string) => void;
  onChangeOrderNote: (memo: string) => void;
  saving: boolean;
  statusChanging: boolean;
  saveMessage: string | null;
  statusMessage: string | null;
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (lineId: string) => void;
  onSave: () => void;
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
  destinationMemo,
  orderNote,
  lines,
  totals,
  onChangeMaterialType,
  onChangeSupplierPartnerId,
  onRetrySuppliers,
  onChangeDestinationMemo,
  onChangeOrderNote,
  saving,
  statusChanging,
  saveMessage,
  statusMessage,
  onChangeLine,
  onAddLine,
  onRemoveLine,
  onSave,
  onChangeStatus,
}: MaterialOrderDetailPanelProps) {
  const displayMaterialType = materialType;
  const selectedOrderTitle = selectedOrder ? formatMaterialOrderDisplayTitle(selectedOrder) : "선택 발주서 상세";
  const selectedOrderLineLabel = selectedOrder ? formatMaterialOrderPrimaryLineLabel(selectedOrder) : "";
  const selectedOrderRequesterLabel = selectedOrder ? formatMaterialOrderRequesterLabel(selectedOrder) : "";

  return (
    <AdminCard className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-4">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--pbp-border)] pb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Selected order</p>
          <h2 className="mt-1 truncate text-lg font-semibold tracking-tight pbp-text-primary">{selectedOrderTitle}</h2>
          {selectedOrder ? (
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs pbp-text-muted">
              <span className="font-medium pbp-text-primary">{selectedOrderLineLabel}</span>
              <span>{formatMaterialOrderDateLabel(selectedOrder.createdAt)}</span>
              <span>{selectedOrderRequesterLabel}</span>
              <span>{formatMaterialOrderAmount(selectedOrder.totalAmount)}</span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {selectedOrder ? (
            <AdminStatusBadge tone={resolveMaterialOrderStatusBadgeTone(selectedOrder.status)}>
              {formatMaterialOrderStatusLabel(selectedOrder.status)}
            </AdminStatusBadge>
          ) : null}
          <AdminStatusBadge tone="info">{formatMaterialOrderTypeLabel(displayMaterialType)}</AdminStatusBadge>
        </div>
      </div>

      {selectedOrder ? (
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 pt-3">
          <div className="grid gap-3 rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold pbp-text-primary">발주 기본 정보</p>
                <p className="mt-0.5 text-xs pbp-text-muted">종류와 공급처를 먼저 고른 뒤 품목 라인을 저장합니다.</p>
              </div>
              <MaterialOrderStatusFlow
                status={selectedOrder.status}
                changing={statusChanging}
                message={statusMessage}
                onChangeStatus={onChangeStatus}
              />
            </div>

            <div className="grid gap-2 xl:grid-cols-4">
              <FieldLabel label="발주 종류">
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
              <FieldLabel label="전달/보관 메모">
                <input
                  value={destinationMemo}
                  onChange={(event) => onChangeDestinationMemo(event.target.value)}
                  placeholder="예: B 봉제 전달"
                  className={fieldClassName()}
                />
              </FieldLabel>
              <FieldLabel label="내부 메모">
                <input
                  value={orderNote}
                  onChange={(event) => onChangeOrderNote(event.target.value)}
                  placeholder="단가/검토 조건"
                  className={fieldClassName()}
                />
              </FieldLabel>
            </div>
          </div>

          <div className="flex min-h-0 flex-col rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-3">
            <div className="flex shrink-0 items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-sm font-semibold pbp-text-primary">품목 라인</h3>
                <p className="mt-0.5 text-xs pbp-text-muted">품목명, 단위, 수량, 단가만 입력합니다.</p>
              </div>
              <AdminButton onClick={onAddLine} disabled={selectedOrder.status !== "draft"}>품목 추가</AdminButton>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[var(--pbp-border)]">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--pbp-surface-soft)] text-xs font-semibold pbp-text-subtle">
                  <tr>
                    <th className="px-3 py-2 text-left">품목명</th>
                    <th className="px-2 py-2 text-left">단위</th>
                    <th className="px-2 py-2 text-right">수량</th>
                    <th className="px-2 py-2 text-right">단가</th>
                    <th className="px-2 py-2 text-right">금액</th>
                    <th className="px-2 py-2 text-center">배분</th>
                    <th className="px-3 py-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pbp-border)]">
                  {lines.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-sm pbp-text-muted" colSpan={7}>
                        등록된 품목 라인이 없습니다. 품목 추가 버튼으로 입력을 시작합니다.
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

          <div className="grid shrink-0 gap-3 rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid gap-2 text-sm sm:grid-cols-4">
              <SummaryValue label="품목 수" value={`${totals.lineCount}개`} />
              <SummaryValue label="주문수량" value={String(totals.totalOrderQuantity)} />
              <SummaryValue label="배분/잔여" value={`${totals.totalAllocatedQuantity} / ${totals.totalRemainingQuantity}`} />
              <SummaryValue label="금액 합계" value={formatMaterialOrderAmount(totals.totalAmount)} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {saveMessage ? <p className="self-center text-xs pbp-text-muted">{saveMessage}</p> : null}
              <AdminButton disabled={saving || selectedOrder.status !== "draft"} onClick={onSave}>
                {saving ? "저장중" : "저장"}
              </AdminButton>
              <AdminButton
                variant="primary"
                disabled={statusChanging || selectedOrder.status !== "draft"}
                onClick={() => onChangeStatus("review_requested")}
              >
                검토 요청
              </AdminButton>
            </div>
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
  const allocatedQuantity = calculateMaterialOrderLineAllocatedQuantity(line);
  const remainingQuantity = calculateMaterialOrderLineRemainingQuantity(line);

  return (
    <tr className="bg-[var(--pbp-surface-base)] align-middle">
      <td className="px-3 py-2">
        <input
          value={line.itemName}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { itemName: event.target.value })}
          placeholder="예: 30수 면 블랙"
          className={fieldClassName("min-w-[180px]")}
        />
      </td>
      <td className="px-2 py-2">
        <select
          value={resolveUnitSelectValue(line.unit)}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { unit: event.target.value })}
          className={fieldClassName("w-24")}
        >
          <option value="">단위</option>
          {MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          value={line.orderQuantity}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { orderQuantity: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-24 text-right")}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          value={line.unitPrice}
          disabled={!editable}
          onChange={(event) => onChangeLine(line.id, { unitPrice: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-28 text-right")}
        />
      </td>
      <td className="px-2 py-2 text-right font-semibold pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</td>
      <td className="px-2 py-2 text-center text-xs pbp-text-muted">
        <span className="font-semibold pbp-text-primary">{allocatedQuantity}</span> / {remainingQuantity}
      </td>
      <td className="px-3 py-2 text-right">
        <AdminButton size="sm" variant="ghost" disabled={!editable} onClick={() => onRemoveLine(line.id)}>
          삭제
        </AdminButton>
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
    { status: "approved", label: "발주확정" },
    { status: "order_placed", label: "발주완료" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {steps.map((step) => (
        <AdminStatusBadge
          key={step.status}
          size="xs"
          tone={step.status === status ? resolveMaterialOrderStatusBadgeTone(status) : "neutral"}
        >
          {step.label}
        </AdminStatusBadge>
      ))}
      <AdminButton
        size="sm"
        variant="ghost"
        disabled={changing || status !== "review_requested"}
        onClick={() => onChangeStatus("draft")}
      >
        검토 취소
      </AdminButton>
      <AdminButton
        size="sm"
        variant="ghost"
        disabled={changing || status !== "review_requested"}
        onClick={() => onChangeStatus("approved")}
      >
        발주 확정
      </AdminButton>
      <AdminButton
        size="sm"
        variant="primary"
        disabled={changing || (status !== "approved" && status !== "review_requested")}
        onClick={() => onChangeStatus("order_placed")}
      >
        발주 완료
      </AdminButton>
      {message ? <p className="basis-full text-right text-xs pbp-text-muted">{message}</p> : null}
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-semibold pbp-text-subtle">
      {label}
      {children}
    </label>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold pbp-text-subtle">{label}</p>
      <p className="mt-0.5 text-base font-semibold pbp-text-primary">{value}</p>
    </div>
  );
}

function normalizeNumberInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveUnitSelectValue(unit: string): string {
  return MATERIAL_ORDER_UNIT_OPTIONS.includes(unit as typeof MATERIAL_ORDER_UNIT_OPTIONS[number]) ? unit : "";
}

function fieldClassName(extra = "") {
  return [
    "min-h-9 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] disabled:bg-[var(--pbp-surface-soft)] disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}

function resolveSupplierPlaceholder(loading: boolean, supplierCount: number): string {
  if (loading) return "공급처 조회중";
  if (supplierCount === 0) return "등록된 공급처 없음";
  return "공급처 선택";
}
