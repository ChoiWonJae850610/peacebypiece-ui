import { useMemo, useState } from "react";

import { normalizePbpLocalDateValue } from "@/lib/date/localDate";

import {
  WaflBadge,
  WaflSelect,
  WaflButton,
  WaflCardButton,
  WaflInput,
  WaflSelectableCard,
  WaflListPanelShell,
  type WaflSelectOption,
} from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import {
  MATERIAL_ORDER_LIST_CLEAR_BUTTON_CLASS,
  MATERIAL_ORDER_LIST_SEARCH_ROW_CLASS,
  MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import {
  formatMaterialOrderCreatedAtLabel,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import {
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  getMaterialOrderStatusSemanticClass,
  MATERIAL_ORDER_STATUS_FILTER_OPTIONS,
} from "@/lib/material-orders/presentation";
import { MATERIAL_ORDER_STATUS } from "@/lib/material-orders/types";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
import { MATERIAL_ORDER_EMPTY_STATE_COPY } from "@/features/material-orders/materialOrderEmptyStates";
import {
  filterMaterialOrders,
  type MaterialOrderFilterStatus,
  type MaterialOrderFilterType,
} from "@/features/material-orders/materialOrderPanelUtils";
import type {
  MaterialOrder,
  MaterialOrderLineItemType,
  MaterialOrderStatus,
} from "@/lib/material-orders/types";
import type { MaterialOrderDraftSelectionType } from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderListPanelProps = {
  orders: MaterialOrder[];
  selectedOrderId: string;
  loading: boolean;
  errorMessage: string | null;
  creating: boolean;
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
  onCancelOrder: (orderId: string) => void;
  onRetry: () => void;
  selectedDraftMaterialType: MaterialOrderDraftSelectionType;
  selectedDraftSupplierName: string | null;
};

const MATERIAL_ORDER_STATUS_OPTIONS: Array<
  WaflSelectOption & { value: "all" | MaterialOrderStatus }
> = [
  { value: "all", label: "상태 전체" },
  ...MATERIAL_ORDER_STATUS_FILTER_OPTIONS,
];

const MATERIAL_ORDER_TYPE_OPTIONS: Array<
  WaflSelectOption & { value: "all" | MaterialOrderLineItemType }
> = [
  { value: "all", label: "전체" },
  { value: "fabric", label: "원단" },
  { value: "submaterial", label: "부자재" },
];



export default function MaterialOrderListPanel({
  orders,
  selectedOrderId,
  loading,
  errorMessage,
  creating,
  onSelectOrder,
  onCreateOrder,
  onCancelOrder,
  onRetry,
  selectedDraftMaterialType,
  selectedDraftSupplierName,
}: MaterialOrderListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MaterialOrderFilterStatus>(MATERIAL_ORDER_STATUS.draft);
  const [typeFilter, setTypeFilter] = useState<MaterialOrderFilterType>("all");

  const filteredOrders = useMemo(
    () =>
      filterMaterialOrders({
        orders,
        searchQuery,
        statusFilter,
        typeFilter,
      }),
    [orders, searchQuery, statusFilter, typeFilter],
  );

  const searchControl = (
      <div className={MATERIAL_ORDER_LIST_SEARCH_ROW_CLASS}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">발주서 검색</span>
          <WaflInput
            type="search"
            fieldSize="sm"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="공급처·품목·작업지시서 검색"
            className={MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS}
          />
        </label>
        {searchQuery ? (
          <WaflButton
            onClick={() => setSearchQuery("")}
            variant="secondary"
            size="sm"
            className={MATERIAL_ORDER_LIST_CLEAR_BUTTON_CLASS}
          >
            지우기
          </WaflButton>
        ) : null}
      </div>
  );

  const filterControls = (
      <div className="grid grid-cols-2 gap-2">
        <WaflSelect
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as MaterialOrderFilterType)}
          options={MATERIAL_ORDER_TYPE_OPTIONS}
          size="sm"
          ariaLabel="자재 종류 필터"
          triggerClassName={MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS}
        />
        <WaflSelect
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as MaterialOrderFilterStatus)}
          options={MATERIAL_ORDER_STATUS_OPTIONS}
          size="sm"
          ariaLabel="발주 상태 필터"
          triggerClassName={MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS}
        />
      </div>
  );

  const action = (
    <WaflButton
      size="md"
      variant="primary"
      width="full"
      className="pbp-touch-target"
      disabled={creating}
      title={creating ? "발주서를 생성하고 있습니다." : "원단·부자재 발주서를 생성합니다."}
      aria-label={creating ? "발주서 생성 중" : "원단·부자재 발주서 생성"}
      onClick={onCreateOrder}
    >
      {creating ? "생성 중" : "발주서 생성"}
    </WaflButton>
  );

  const listItems = loading ? (
    <MaterialOrderPanelMessage title="불러오는 중" description="원단·부자재 발주서를 조회하고 있습니다." kind="loading" />
  ) : errorMessage ? (
    <MaterialOrderPanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} kind="error" />
  ) : orders.length === 0 ? (
    <MaterialOrderPanelMessage title={MATERIAL_ORDER_EMPTY_STATE_COPY.noOrders.title} description={MATERIAL_ORDER_EMPTY_STATE_COPY.noOrders.description} />
  ) : filteredOrders.length === 0 ? (
    <MaterialOrderPanelMessage title={MATERIAL_ORDER_EMPTY_STATE_COPY.noSearchResults.title} kind="search" />
  ) : (
    filteredOrders.map((order) => (
      <MaterialOrderListButton
        key={order.id}
        order={order}
        selected={order.id === selectedOrderId}
        onSelectOrder={onSelectOrder}
        draftMaterialType={order.id === selectedOrderId ? selectedDraftMaterialType : null}
        draftSupplierName={order.id === selectedOrderId ? selectedDraftSupplierName : null}
        onCancelOrder={onCancelOrder}
      />
    ))
  );

  const listContent = (
    <WaflListPanelShell
      title="발주서 목록"
      count={filteredOrders.length}
      search={searchControl}
      filters={filterControls}
      action={action}
      listClassName="space-y-2"
    >
      {listItems}
    </WaflListPanelShell>
  );
  return listContent;
}

function MaterialOrderListButton({
  order,
  selected,
  onSelectOrder,
  onCancelOrder,
  draftMaterialType,
  draftSupplierName,
}: {
  order: MaterialOrder;
  selected: boolean;
  onSelectOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  draftMaterialType: MaterialOrderDraftSelectionType | null;
  draftSupplierName: string | null;
}) {
  const materialType = draftMaterialType ?? resolveMaterialOrderType(order);
  const typeLabel = materialType
    ? formatMaterialOrderTypeLabel(materialType)
    : "자재 종류 선택 전";
  const supplierLabel =
    draftSupplierName?.trim() ||
    order.supplierPartnerName?.trim() ||
    "공급처 선택 전";
  const createdAtLabel = formatMaterialOrderCreatedAtLabel(order.createdAt);
  const canCancelOrder = order.status === MATERIAL_ORDER_STATUS.draft;


  const handleCancelOrder = () => {
    const confirmed = window.confirm(
      "이 발주서를 삭제하시겠습니까? 삭제한 발주서는 취소 상태로 이동합니다.",
    );
    if (!confirmed) return;
    onCancelOrder(order.id);
  };

  const dueDateLabel = normalizePbpLocalDateValue(order.dueDate);

  return (
    <WaflSelectableCard
      selected={selected}
      className="relative p-3"
    >
      <div className="min-w-0 pr-11">
        <WaflCardButton onClick={() => onSelectOrder(order.id)}>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold pbp-text-primary">
              {typeLabel}
            </p>
            <p className="shrink-0 text-[11px] font-medium pbp-text-muted">
              {createdAtLabel}
            </p>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
            <WaflBadge
              tone="neutral"
              size="sm"
              className={`pbp-workorder-status-badge h-6 gap-2 transition-colors duration-150 ease-out ${selected ? "pbp-workorder-status-active" : getMaterialOrderStatusSemanticClass(order.status)}`}
            >
              <span
                className="pbp-workorder-status-dot h-2 w-2 rounded-full"
                aria-hidden="true"
              />
              {formatMaterialOrderStatusLabel(order.status)}
            </WaflBadge>
          </div>
          <p className="mt-1.5 truncate text-[11px] font-medium pbp-text-muted">
            업체: {supplierLabel}
          </p>
          {dueDateLabel ? (
            <p className="mt-1 truncate text-[11px] font-medium pbp-text-muted">
              납기일: {dueDateLabel}
            </p>
          ) : null}
        </WaflCardButton>
        {canCancelOrder ? (
          <div className="absolute right-3 top-3">
            <WorkOrderCardActionMenu
              menuLabel="발주서 작업 더보기"
              deleteLabel="발주서 삭제"
              deleteText="삭제"
              onDelete={handleCancelOrder}
            />
          </div>
        ) : null}
      </div>
    </WaflSelectableCard>
  );
}
