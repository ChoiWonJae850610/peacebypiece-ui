import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import { getTodayPbpLocalDateValue } from "@/lib/date/localDate";
import type { WorkflowProgressPanelLayout } from "@/components/common/workflow/WorkflowProgressPanel";

import { AppSelect, AppSection, WaflButton, WaflDetailWorkspacePanel, WaflEmptyWorkspaceState, WaflPanelContentShell, WAFL_PANEL_CONTENT_STACK_CLASS, WaflSummaryHeaderCard, WaflSummaryInfoCell, type AppSelectOption } from "@/components/common/ui";
import { MaterialOrderLineMobileCards, MaterialOrderLineTable } from "@/features/material-orders/components/MaterialOrderLineTable";
import { MaterialOrderStatusFlow } from "@/features/material-orders/components/MaterialOrderStatusFlow";
import { MaterialOrderSummaryCards } from "@/features/material-orders/components/MaterialOrderSummaryFooter";
import {
  MATERIAL_ORDER_SECTION_CARD_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import type {
  MaterialOrderDraftLine,
  MaterialOrderDraftTotals,
  MaterialOrderDraftSelectionType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import type {
  MaterialOrder,
  MaterialOrderStatus,
  MaterialOrderSupplier,
} from "@/lib/material-orders/types";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";
import { MATERIAL_ORDER_EMPTY_STATE_COPY } from "@/features/material-orders/materialOrderEmptyStates";
import { formatRecentKstDateTime } from "@/lib/workorder/presentation/dateTimePresentation";

type MaterialOrderDetailPanelProps = {
  selectedOrder: MaterialOrder | null;
  materialType: MaterialOrderDraftSelectionType;
  supplierPartnerId: string | null;
  suppliers: MaterialOrderSupplier[];
  suppliersLoading: boolean;
  suppliersError: string | null;
  lines: MaterialOrderDraftLine[];
  totals: MaterialOrderDraftTotals;
  dueDate: string;
  onChangeDueDate: (value: string) => void;
  onChangeMaterialType: (materialType: MaterialOrderDraftSelectionType) => void;
  onChangeSupplierPartnerId: (partnerId: string | null) => void;
  onRetrySuppliers: () => void;
  statusChanging: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
  onChangeStatus: (status: MaterialOrderStatus) => void;
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
  workOrderCandidates: MaterialOrderWorkspaceWorkOrderCandidate[];
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
  dueDate,
  onChangeDueDate,
  onChangeMaterialType,
  onChangeSupplierPartnerId,
  onRetrySuppliers,
  statusChanging,
  onChangeLine,
  onRemoveLine,
  onChangeStatus,
  canRequestMaterialOrder,
  canPlaceMaterialOrder,
  workOrderCandidates,
  mobile = false,
  progressLayout = "horizontal",
}: MaterialOrderDetailPanelProps) {
  const isDraftEditable = selectedOrder?.status === "draft";

  return (
    <WaflDetailWorkspacePanel>
      <WaflPanelContentShell>
      {selectedOrder ? (
        <div className={`${WAFL_PANEL_CONTENT_STACK_CLASS} flex-1`}>
          <WaflSummaryHeaderCard
            component="material-order-header-summary"
            columns={2}
            footerColumns={2}
            title={(
              <h2 className="truncate text-2xl font-semibold text-stone-950" title={resolveMaterialOrderTitle(materialType)}>
                {resolveMaterialOrderTitle(materialType)}
              </h2>
            )}
            footerLeft={(
              <WaflSummaryInfoCell label="납기일">
                <PbpSingleDatePicker
                value={dueDate}
                labels={{ label: undefined, placeholder: "날짜 선택", clear: "지우기", done: "완료", selected: "선택일 {date}", calendarAria: "발주서 납기일 선택" }}
                locale="ko"
              displayFormat="iso"
                minDateValue={getTodayPbpLocalDateValue()}
                onChange={onChangeDueDate}
                popoverMode="fixed"
                disabled={!isDraftEditable}
                triggerVariant="subtle"
                triggerClassName="!min-h-0 !justify-center !px-1 !py-1 !text-center !text-sm !font-semibold !text-[var(--pbp-text-primary)]"
                className="mx-auto w-full max-w-[190px]"
              />
              </WaflSummaryInfoCell>
            )}
            footerRight={(
              <WaflSummaryInfoCell label="작성일">
                <span className="block truncate text-sm font-semibold pbp-text-primary">
                  {formatRecentKstDateTime(selectedOrder.createdAt) || "-"}
                </span>
              </WaflSummaryInfoCell>
            )}
          >
            <WaflSummaryInfoCell label="자재 종류">
              <AppSelect
                value={materialType}
                disabled={!isDraftEditable}
                size="sm"
                options={MATERIAL_TYPE_SELECT_OPTIONS}
                ariaLabel="자재 종류"
                triggerClassName="min-h-0 justify-center border-transparent bg-transparent px-1.5 py-1 text-center hover:border-transparent hover:bg-[var(--pbp-surface-muted)] disabled:bg-transparent"
                onValueChange={(value) =>
                  onChangeMaterialType(value as MaterialOrderDraftSelectionType)
                }
              />
            </WaflSummaryInfoCell>
            <WaflSummaryInfoCell label="공급처">
              <AppSelect
                value={supplierPartnerId ?? ""}
                disabled={isSupplierSelectDisabled(
                  isDraftEditable,
                  materialType,
                  suppliersLoading,
                  suppliers.length,
                )}
                size="sm"
                placeholder={resolveSupplierPlaceholder(materialType, suppliersLoading, suppliers.length)}
                options={buildSupplierSelectOptions(materialType, suppliersLoading, suppliers)}
                ariaLabel="공급처"
                triggerClassName="min-h-0 justify-center border-transparent bg-transparent px-1.5 py-1 text-center hover:border-transparent hover:bg-[var(--pbp-surface-muted)] disabled:bg-transparent"
                onValueChange={(value) => onChangeSupplierPartnerId(value || null)}
              />
              {suppliersError ? (
                <WaflButton
                  type="button"
                  onClick={onRetrySuppliers}
                  variant="danger"
                  size="sm"
                  className="mx-auto mt-1 text-[11px]"
                  title="공급처 목록을 다시 조회합니다."
                  aria-label="공급처 목록 다시 조회"
                >
                  공급처 다시 조회
                </WaflButton>
              ) : null}
            </WaflSummaryInfoCell>
          </WaflSummaryHeaderCard>

          <MaterialOrderStatusFlow
            status={selectedOrder.status}
            workflowPath={selectedOrder.workflowPath}
            changing={statusChanging}
            onChangeStatus={onChangeStatus}
            canRequestMaterialOrder={canRequestMaterialOrder}
            canPlaceMaterialOrder={canPlaceMaterialOrder}
            compact={mobile || progressLayout === "vertical"}
            layout={progressLayout}
          />

          <AppSection title="비용 요약" className="shrink-0" cardClassName={MATERIAL_ORDER_SECTION_CARD_CLASS}>
            <MaterialOrderSummaryCards totals={totals} lines={lines} materialType={materialType} workOrderCandidates={workOrderCandidates} />
          </AppSection>

          <AppSection
            title="발주 품목"
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
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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

        </div>
      ) : (
        <WaflEmptyWorkspaceState
          title={MATERIAL_ORDER_EMPTY_STATE_COPY.selectOrder.title}
          description={MATERIAL_ORDER_EMPTY_STATE_COPY.selectOrder.description}
          variant="center-panel"
          className="min-h-full flex-1"
        />
      )}
      </WaflPanelContentShell>
    </WaflDetailWorkspacePanel>
  );
}

const MATERIAL_TYPE_SELECT_OPTIONS: AppSelectOption[] = [
  { value: "", label: "자재 종류 선택", disabled: true },
  { value: "fabric", label: "원단" },
  { value: "submaterial", label: "부자재" },
];

function buildSupplierSelectOptions(
  materialType: MaterialOrderDraftSelectionType,
  loading: boolean,
  suppliers: MaterialOrderSupplier[],
): AppSelectOption[] {
  if (!materialType || loading || suppliers.length === 0) {
    return [
      {
        value: "",
        label: resolveSupplierPlaceholder(materialType, loading, suppliers.length),
        disabled: true,
      },
    ];
  }

  return [
    { value: "", label: "공급처 선택" },
    ...suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    })),
  ];
}

function isSupplierSelectDisabled(
  editable: boolean,
  materialType: MaterialOrderDraftSelectionType,
  loading: boolean,
  supplierCount: number,
) {
  return !editable || !materialType || loading || supplierCount === 0;
}

function resolveMaterialOrderTitle(materialType: MaterialOrderDraftSelectionType): string {
  if (materialType === "fabric") return "원단 발주서";
  if (materialType === "submaterial") return "부자재 발주서";
  return "자재 발주서";
}

function resolveSupplierPlaceholder(
  materialType: MaterialOrderDraftSelectionType,
  loading: boolean,
  supplierCount: number,
): string {
  if (!materialType) return "자재 종류를 먼저 선택";
  if (loading) return "공급처 조회 중";
  if (supplierCount === 0) return "선택 가능한 공급처 없음";
  return "공급처 선택";
}
