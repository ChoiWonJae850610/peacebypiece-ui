import { useMemo, useState } from "react";

import {
  AppBadge,
  AppSelect,
  WaflButton,
  WaflInput,
  WaflSelectableCard,
  WaflSurface,
  type AppSelectOption,
} from "@/components/common/ui";
import { SectionCountBadge } from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import {
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_PANEL_DIVIDER_CLASS,
  MATERIAL_ORDER_LIST_CLEAR_BUTTON_CLASS,
  MATERIAL_ORDER_LIST_CONTROL_ROW_CLASS,
  MATERIAL_ORDER_LIST_CREATE_BUTTON_TOP_GAP_CLASS,
  MATERIAL_ORDER_LIST_SEARCH_ROW_CLASS,
  MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import {
  formatMaterialOrderCreatedAtLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
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
  variant?: "panel" | "drawer";
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
  AppSelectOption & { value: "all" | MaterialOrderStatus }
> = [
  { value: "all", label: "상태 전체" },
  { value: "draft", label: "작성중" },
  { value: "review_requested", label: "검토요청" },
  { value: "approved", label: "발주요청" },
  { value: "order_placed", label: "발주완료" },
  { value: "rejected", label: "반려" },
  { value: "cancelled", label: "취소" },
];

const MATERIAL_ORDER_TYPE_OPTIONS: Array<
  AppSelectOption & { value: "all" | MaterialOrderLineItemType }
> = [
  { value: "all", label: "종류 전체" },
  { value: "fabric", label: "원단" },
  { value: "submaterial", label: "부자재" },
];

const MATERIAL_ORDER_STATUS_SEMANTIC_CLASS: Record<
  MaterialOrderStatus,
  string
> = {
  draft: "pbp-workorder-status-draft",
  review_requested: "pbp-workorder-status-review-requested",
  approved: "pbp-workorder-status-request-order",
  order_placed: "pbp-workorder-status-completed",
  rejected: "pbp-workorder-status-rejected",
  cancelled: "pbp-workorder-status-rejected",
};

function getMaterialOrderStatusSemanticClass(status: MaterialOrderStatus) {
  return MATERIAL_ORDER_STATUS_SEMANTIC_CLASS[status];
}

export default function MaterialOrderListPanel({
  variant = "panel",
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
    useState<MaterialOrderFilterStatus>("draft");
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

  const listContent = (
    <>
      <div className="shrink-0">
        <div className="flex items-end justify-between gap-2 pb-2.5">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">
            발주서 목록
          </h2>
          <SectionCountBadge className="translate-y-0.5">
            {filteredOrders.length}건
          </SectionCountBadge>
        </div>
        <div
          className={MATERIAL_ORDER_PANEL_DIVIDER_CLASS}
          aria-hidden="true"
        />
      </div>

      <div className={`mt-3 ${MATERIAL_ORDER_LIST_CONTROL_ROW_CLASS}`}>
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
        <div className="grid grid-cols-2 gap-2">
          <AppSelect
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as MaterialOrderFilterType)
            }
            options={MATERIAL_ORDER_TYPE_OPTIONS}
            size="sm"
            ariaLabel="자재 종류 필터"
            triggerClassName={MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS}
          />
          <AppSelect
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as MaterialOrderFilterStatus)
            }
            options={MATERIAL_ORDER_STATUS_OPTIONS}
            size="sm"
            ariaLabel="발주 상태 필터"
            triggerClassName={MATERIAL_ORDER_LIST_SELECT_TRIGGER_CLASS}
          />
        </div>
        <WaflButton
          size="md"
          variant="primary"
          width="full"
          className={`${MATERIAL_ORDER_LIST_CREATE_BUTTON_TOP_GAP_CLASS} pbp-touch-target`}
          disabled={creating}
          title={
            creating
              ? "새 발주서를 생성하고 있습니다."
              : "새 원단·부자재 발주서를 생성합니다."
          }
          aria-label={
            creating ? "새 발주서 생성 중" : "새 원단·부자재 발주서 생성"
          }
          onClick={onCreateOrder}
        >
          {creating ? "생성 중" : "새 발주서 생성"}
        </WaflButton>
        <div
          className={`mt-1 ${MATERIAL_ORDER_PANEL_DIVIDER_CLASS}`}
          aria-hidden="true"
        />
      </div>

      <div
        className={
          variant === "panel"
            ? MATERIAL_ORDER_PANEL_LIST_CLASS
            : "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0"
        }
      >
        {loading ? (
          <MaterialOrderPanelMessage
            title="불러오는 중"
            description="원단·부자재 발주서를 조회하고 있습니다."
            kind="loading"
          />
        ) : errorMessage ? (
          <MaterialOrderPanelMessage
            title="조회 실패"
            description={errorMessage}
            actionLabel="다시 조회"
            onAction={onRetry}
            kind="error"
          />
        ) : orders.length === 0 ? (
          <MaterialOrderPanelMessage
            title="등록된 발주서 없음"
            description="새 발주서 생성 버튼으로 공급처별 발주서를 시작합니다."
          />
        ) : filteredOrders.length === 0 ? (
          <MaterialOrderPanelMessage title="검색 결과 없음" kind="search" />
        ) : (
          filteredOrders.map((order) => (
            <MaterialOrderListButton
              key={order.id}
              order={order}
              selected={order.id === selectedOrderId}
              onSelectOrder={onSelectOrder}
              draftMaterialType={
                order.id === selectedOrderId ? selectedDraftMaterialType : null
              }
              draftSupplierName={
                order.id === selectedOrderId ? selectedDraftSupplierName : null
              }
              onCancelOrder={onCancelOrder}
            />
          ))
        )}
      </div>
    </>
  );

  if (variant === "drawer") {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {listContent}
      </div>
    );
  }

  return (
    <WaflSurface
      component="material-order-list-panel"
      className={MATERIAL_ORDER_PANEL_CARD_CLASS}
    >
      {listContent}
    </WaflSurface>
  );
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
  const canCancelOrder = order.status === "draft";


  const handleCancelOrder = () => {
    const confirmed = window.confirm(
      "이 발주서를 삭제하시겠습니까? 삭제한 발주서는 취소 상태로 이동합니다.",
    );
    if (!confirmed) return;
    onCancelOrder(order.id);
  };

  return (
    <WaflSelectableCard
      selected={selected}
      className="relative p-3"
    >
      <div className="min-w-0 pr-11">
        <button
          type="button"
          className="pbp-touch-target pbp-press-subtle block w-full min-w-0 text-left"
          onClick={() => onSelectOrder(order.id)}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <AppBadge
              tone="neutral"
              size="sm"
              className={`pbp-workorder-status-badge h-6 gap-2 transition-colors duration-150 ease-out ${selected ? "pbp-workorder-status-active" : getMaterialOrderStatusSemanticClass(order.status)}`}
            >
              <span
                className="pbp-workorder-status-dot h-2 w-2 rounded-full"
                aria-hidden="true"
              />
              {formatMaterialOrderStatusLabel(order.status)}
            </AppBadge>
          </div>
          <p className="mt-1.5 truncate text-[11px] font-medium pbp-text-muted">
            {createdAtLabel}
          </p>
          <div className="mt-2.5 space-y-1">
            <p className="truncate text-sm font-semibold pbp-text-primary">
              {typeLabel}
            </p>
            <p className="truncate text-[11px] font-medium pbp-text-muted">
              {supplierLabel}
            </p>
          </div>
        </button>
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
