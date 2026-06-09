import type { ReactNode } from "react";
import type { WorkflowProgressPanelLayout } from "@/components/common/workflow/WorkflowProgressPanel";

import { AppBadge, AppButton, AppSelect, AppSection, WaflEmptyCard, WaflInfoRow, WaflSurface, type AppSelectOption } from "@/components/common/ui";
import { MaterialOrderLineMobileCards, MaterialOrderLineTable } from "@/features/material-orders/components/MaterialOrderLineTable";
import { MaterialOrderStatusFlow } from "@/features/material-orders/components/MaterialOrderStatusFlow";
import {
  formatMaterialOrderCode,
  formatMaterialOrderStatusLabel,
  resolveMaterialOrderStatusBadgeTone,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
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
  progressLayout?: WorkflowProgressPanelLayout;
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
  progressLayout = "horizontal",
}: MaterialOrderDetailPanelProps) {
  const isDraftEditable = selectedOrder?.status === "draft";

  return (
    <WaflSurface component="material-order-detail-panel" className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      {selectedOrder ? (
        <div className={`flex min-h-0 flex-1 flex-col ${MATERIAL_ORDER_SECTION_GAP_CLASS}`}>
          {mobile ? (
            <MaterialOrderMobileStatusHeader
              selectedOrder={selectedOrder}
              statusChanging={statusChanging}
            />
          ) : null}
          <MaterialOrderStatusFlow
            status={selectedOrder.status}
            workflowPath={selectedOrder.workflowPath}
            changing={statusChanging}
            onChangeStatus={onChangeStatus}
            compact={mobile || progressLayout === "vertical"}
            layout={progressLayout}
          />

          <AppSection
            title="발주 기본정보"
            description={mobile ? undefined : "자재 종류와 실제 공급처를 먼저 정합니다."}
            className="shrink-0"
            cardClassName={MATERIAL_ORDER_SECTION_CARD_CLASS}
            bodyClassName={mobile ? "grid gap-2" : "grid gap-3 xl:grid-cols-2"}
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
            description={mobile ? undefined : "실제 주문 수량과 단가를 입력합니다. 금액은 자동 계산됩니다."}
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
        <WaflEmptyCard component="material-order-detail-empty" className="flex min-h-full flex-1 items-center justify-center px-5 py-10">
          <div>
            <p className="text-sm font-semibold pbp-text-primary">발주서를 선택하세요.</p>
            <p className="mt-1 text-xs leading-5 pbp-text-muted">왼쪽 발주서 목록에서 새 발주서를 만들거나 기존 발주서를 선택하면 상세 입력 영역이 열립니다.</p>
          </div>
        </WaflEmptyCard>
      )}
    </WaflSurface>
  );
}

function MaterialOrderMobileStatusHeader({
  selectedOrder,
  statusChanging,
}: {
  selectedOrder: MaterialOrder;
  statusChanging: boolean;
}) {
  const statusLabel = formatMaterialOrderStatusLabel(selectedOrder.status);
  const supplierLabel = selectedOrder.supplierPartnerName?.trim() || "공급처 미선택";
  const orderedAtLabel = selectedOrder.orderedAt ? `발주완료 ${selectedOrder.orderedAt.slice(0, 10)}` : "발주완료 전";

  return (
    <WaflSurface as="section" component="material-order-mobile-status" className="p-3">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold pbp-text-subtle">원단·부자재 발주</p>
          <h2 className="mt-0.5 truncate text-sm font-semibold pbp-text-primary">
            {formatMaterialOrderCode(selectedOrder)} · {supplierLabel}
          </h2>
        </div>
        <AppBadge
          tone={resolveMaterialOrderStatusBadgeTone(selectedOrder.status)}
          size="sm"
          className="shrink-0"
        >
          {statusLabel}
        </AppBadge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
        <WaflInfoRow component="material-order-mobile-status-row" className="px-2.5 py-2 pbp-text-muted">
          <span>{statusChanging ? "상태 변경 중" : "상태 변경 가능"}</span>
        </WaflInfoRow>
        <WaflInfoRow component="material-order-mobile-status-row" className="justify-end px-2.5 py-2 text-right pbp-text-muted">
          <span>{orderedAtLabel}</span>
        </WaflInfoRow>
      </div>
    </WaflSurface>
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
