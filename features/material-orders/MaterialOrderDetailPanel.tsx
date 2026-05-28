import type { ReactNode } from "react";

import { AdminCard } from "@/components/admin/common/AdminSection";
import { MaterialOrderLineTable } from "@/features/material-orders/components/MaterialOrderLineTable";
import { MaterialOrderStatusFlow } from "@/features/material-orders/components/MaterialOrderStatusFlow";
import { MaterialOrderSummaryFooter } from "@/features/material-orders/components/MaterialOrderSummaryFooter";
import {
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_SECTION_CARD_CLASS,
  MATERIAL_ORDER_SECTION_GAP_CLASS,
  MATERIAL_ORDER_TABLE_SHELL_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import type {
  MaterialOrderDraftLine,
  MaterialOrderDraftTotals,
  MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
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
  return (
    <AdminCard className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      {selectedOrder ? (
        <div className={`flex min-h-0 flex-1 flex-col ${MATERIAL_ORDER_SECTION_GAP_CLASS}`}>
          <MaterialOrderStatusFlow
            status={selectedOrder.status}
            workflowPath={selectedOrder.workflowPath}
            changing={statusChanging}
            message={statusMessage}
            onChangeStatus={onChangeStatus}
          />

          <div className={`${MATERIAL_ORDER_SECTION_CARD_CLASS} grid shrink-0 gap-3 xl:grid-cols-2`}>
            <FieldLabel label="구분">
              <select
                value={materialType}
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

          <div className={`${MATERIAL_ORDER_SECTION_CARD_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`}>
            <div className={`${MATERIAL_ORDER_TABLE_SHELL_CLASS} min-h-0 flex-1 overflow-auto`}>
              <MaterialOrderLineTable
                lines={lines}
                editable={selectedOrder.status === "draft"}
                onChangeLine={onChangeLine}
                onRemoveLine={onRemoveLine}
              />
            </div>
          </div>

          <MaterialOrderSummaryFooter totals={totals} />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-6 text-center">
          <div>
            <p className="text-base font-semibold pbp-text-primary">
              선택된 발주서가 없습니다.
            </p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">
              왼쪽 패널에서 발주서를 생성하거나 기존 발주서를 선택하면 상세 입력
              영역이 열립니다.
            </p>
          </div>
        </div>
      )}
    </AdminCard>
  );
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
