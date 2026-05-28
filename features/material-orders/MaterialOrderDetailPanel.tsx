import type { ReactNode } from "react";

import { AppCard, AppSelect, AppSection, type AppSelectOption } from "@/components/common/ui";
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
    <AppCard padding="none" className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      {selectedOrder ? (
        <div className={`flex min-h-0 flex-1 flex-col ${MATERIAL_ORDER_SECTION_GAP_CLASS}`}>
          <MaterialOrderStatusFlow
            status={selectedOrder.status}
            workflowPath={selectedOrder.workflowPath}
            changing={statusChanging}
            message={statusMessage}
            onChangeStatus={onChangeStatus}
          />

          <AppSection
            title="주문 기본정보"
            description="발주 구분과 실제 공급처만 먼저 정합니다."
            className="shrink-0"
            cardClassName={MATERIAL_ORDER_SECTION_CARD_CLASS}
            bodyClassName="grid gap-3 xl:grid-cols-2"
          >
              <FieldLabel label="구분">
                <AppSelect
                  value={materialType}
                  disabled={selectedOrder.status !== "draft"}
                  size="sm"
                  options={MATERIAL_TYPE_SELECT_OPTIONS}
                  ariaLabel="발주 구분"
                  onValueChange={(value) =>
                    onChangeMaterialType(value as MaterialOrderDraftType)
                  }
                />
              </FieldLabel>
              <FieldLabel label="공급처">
                <AppSelect
                  value={supplierPartnerId ?? ""}
                  disabled={selectedOrder.status !== "draft" || suppliersLoading}
                  size="sm"
                  placeholder={resolveSupplierPlaceholder(suppliersLoading, suppliers.length)}
                  options={buildSupplierSelectOptions(suppliersLoading, suppliers)}
                  ariaLabel="공급처"
                  onValueChange={(value) => onChangeSupplierPartnerId(value || null)}
                />
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
          </AppSection>

          <AppSection
            title="발주 품목"
            description="선택한 자재의 실제 주문 수량과 단가를 정리합니다."
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            cardClassName={`${MATERIAL_ORDER_SECTION_CARD_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`}
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className={`${MATERIAL_ORDER_TABLE_SHELL_CLASS} min-h-0 flex-1 overflow-auto`}>
              <MaterialOrderLineTable
                lines={lines}
                editable={selectedOrder.status === "draft"}
                onChangeLine={onChangeLine}
                onRemoveLine={onRemoveLine}
              />
            </div>
          </AppSection>

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
    </AppCard>
  );
}


const MATERIAL_TYPE_SELECT_OPTIONS: AppSelectOption[] = [
  { value: "fabric", label: "원단" },
  { value: "submaterial", label: "부자재" },
];

function buildSupplierSelectOptions(
  loading: boolean,
  suppliers: MaterialOrderSupplier[],
): AppSelectOption[] {
  return [
    {
      value: "",
      label: resolveSupplierPlaceholder(loading, suppliers.length),
      disabled: loading || suppliers.length === 0,
    },
    ...suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    })),
  ];
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
      {label}
      {children}
    </label>
  );
}

function resolveSupplierPlaceholder(
  loading: boolean,
  supplierCount: number,
): string {
  if (loading) return "공급처 조회중";
  if (supplierCount === 0) return "등록된 공급처 없음";
  return "공급처 선택";
}
