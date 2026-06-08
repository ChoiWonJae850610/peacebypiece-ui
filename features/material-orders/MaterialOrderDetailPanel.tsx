import type { ReactNode } from "react";

import { AppButton, AppCard, AppSelect, AppSection, WaflEmptyState, type AppSelectOption } from "@/components/common/ui";
import { MaterialOrderLineMobileCards, MaterialOrderLineTable } from "@/features/material-orders/components/MaterialOrderLineTable";
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
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
  onChangeStatus: (status: MaterialOrderStatus) => void;
  mobile?: boolean;
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
  onChangeLine,
  onRemoveLine,
  onChangeStatus,
  mobile = false,
}: MaterialOrderDetailPanelProps) {
  const isDraftEditable = selectedOrder?.status === "draft";

  return (
    <AppCard padding="none" className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      {selectedOrder ? (
        <div className={`flex min-h-0 flex-1 flex-col ${MATERIAL_ORDER_SECTION_GAP_CLASS}`}>
          <MaterialOrderStatusFlow
            status={selectedOrder.status}
            workflowPath={selectedOrder.workflowPath}
            changing={statusChanging}
            onChangeStatus={onChangeStatus}
          />

          <AppSection
            title="발주 기본정보"
            description="자재 종류와 실제 공급처를 먼저 정합니다."
            className="shrink-0"
            cardClassName={MATERIAL_ORDER_SECTION_CARD_CLASS}
            bodyClassName="grid gap-3 xl:grid-cols-2"
          >
              <FieldLabel label="자재 종류">
                <AppSelect
                  value={materialType}
                  disabled={!isDraftEditable}
                  size="sm"
                  options={MATERIAL_TYPE_SELECT_OPTIONS}
                  ariaLabel="자재 종류"
                  onValueChange={(value) =>
                    onChangeMaterialType(value as MaterialOrderDraftType)
                  }
                />
              </FieldLabel>
              <FieldLabel label="공급처">
                <AppSelect
                  value={supplierPartnerId ?? ""}
                  disabled={!isDraftEditable || suppliersLoading}
                  size="sm"
                  placeholder={resolveSupplierPlaceholder(suppliersLoading, suppliers.length)}
                  options={buildSupplierSelectOptions(suppliersLoading, suppliers)}
                  ariaLabel="공급처"
                  onValueChange={(value) => onChangeSupplierPartnerId(value || null)}
                />
                {suppliersError ? (
                  <AppButton
                    type="button"
                    onClick={onRetrySuppliers}
                    variant="danger"
                    size="sm"
                    className="mt-1 w-fit min-h-7 px-3 py-1 text-[11px]"
                    title="공급처 목록을 다시 조회합니다."
                    aria-label="공급처 목록 다시 조회"
                  >
                    공급처 다시 조회
                  </AppButton>
                ) : null}
              </FieldLabel>
          </AppSection>

          <AppSection
            title="발주 품목"
            description="실제 주문 수량과 단가를 입력합니다. 금액은 자동 계산됩니다."
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            cardClassName={`${MATERIAL_ORDER_SECTION_CARD_CLASS} flex min-h-0 flex-1 flex-col overflow-hidden`}
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {mobile ? (
              <MaterialOrderLineMobileCards
                lines={lines}
                editable={isDraftEditable}
                onChangeLine={onChangeLine}
                onRemoveLine={onRemoveLine}
              />
            ) : (
              <div className={`${MATERIAL_ORDER_TABLE_SHELL_CLASS} min-h-0 flex-1 overflow-auto`}>
                <MaterialOrderLineTable
                  lines={lines}
                  editable={isDraftEditable}
                  onChangeLine={onChangeLine}
                  onRemoveLine={onRemoveLine}
                />
              </div>
            )}
            {!isDraftEditable ? (
              <p className="mt-2 text-[11px] font-medium pbp-text-muted">
                발주서가 작성중 상태일 때만 품목을 수정할 수 있습니다.
              </p>
            ) : null}
          </AppSection>

          <MaterialOrderSummaryFooter totals={totals} />
        </div>
      ) : (
        <WaflEmptyState
          title="발주서를 선택하세요."
          description="왼쪽 발주서 목록에서 새 발주서를 만들거나 기존 발주서를 선택하면 상세 입력 영역이 열립니다."
          size="md"
          minHeightClassName="min-h-full"
          className="flex-1 rounded-3xl border-dashed bg-[var(--pbp-surface-soft)]"
        />
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
  if (loading) return "공급처 조회 중";
  if (supplierCount === 0) return "선택 가능한 공급처 없음";
  return "공급처 선택";
}
