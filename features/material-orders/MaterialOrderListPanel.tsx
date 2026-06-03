import { useMemo, useState } from "react";

import { AppBadge, AppButton, AppCard, AppListRow, AppSelect, type AppSelectOption } from "@/components/common/ui";
import SectionCountBadge from "@/components/common/ui/SectionCountBadge";
import {
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
  MATERIAL_ORDER_PANEL_HEADER_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import {
  formatMaterialOrderDisplayTitle,
  formatMaterialOrderPrimaryLineLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderStatusBadgeTone,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
import {
  filterMaterialOrders,
  formatMaterialOrderDraftLineLabel,
  type MaterialOrderFilterStatus,
  type MaterialOrderFilterType,
} from "@/features/material-orders/materialOrderPanelUtils";
import type { MaterialOrder, MaterialOrderLineItemType, MaterialOrderStatus } from "@/lib/material-orders/types";
import type { MaterialOrderDraftLine, MaterialOrderDraftType } from "@/lib/material-orders/materialOrderDraftCalculator";

type MaterialOrderListPanelProps = {
  orders: MaterialOrder[];
  selectedOrderId: string;
  loading: boolean;
  errorMessage: string | null;
  creating: boolean;
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
  onRetry: () => void;
  selectedDraftMaterialType: MaterialOrderDraftType;
  selectedDraftSupplierName: string | null;
  selectedDraftLines: MaterialOrderDraftLine[];
};

const MATERIAL_ORDER_STATUS_OPTIONS: Array<AppSelectOption & { value: "all" | MaterialOrderStatus }> = [
  { value: "all", label: "상태 전체" },
  { value: "draft", label: "작성중" },
  { value: "review_requested", label: "검토요청" },
  { value: "approved", label: "발주요청" },
  { value: "order_placed", label: "발주완료" },
  { value: "rejected", label: "반려" },
  { value: "cancelled", label: "취소" },
];

const MATERIAL_ORDER_TYPE_OPTIONS: Array<AppSelectOption & { value: "all" | MaterialOrderLineItemType }> = [
  { value: "all", label: "종류 전체" },
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
  onRetry,
  selectedDraftMaterialType,
  selectedDraftSupplierName,
  selectedDraftLines,
}: MaterialOrderListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialOrderFilterStatus>("draft");
  const [typeFilter, setTypeFilter] = useState<MaterialOrderFilterType>("all");

  const filteredOrders = useMemo(() => (
    filterMaterialOrders({
      orders,
      searchQuery,
      statusFilter,
      typeFilter,
    })
  ), [orders, searchQuery, statusFilter, typeFilter]);

  return (
    <AppCard padding="none" className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      <div className={MATERIAL_ORDER_PANEL_HEADER_CLASS}>
        <div className="flex items-end justify-between gap-2">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">발주서 목록</h2>
          <SectionCountBadge className="translate-y-0.5">{filteredOrders.length}건</SectionCountBadge>
        </div>
      </div>

      <div className="mt-3 grid shrink-0 gap-1.5 border-b border-[var(--pbp-border)] pb-3">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="공급처·품목·담당 검색"
          className={MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <AppSelect
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as MaterialOrderFilterType)}
            options={MATERIAL_ORDER_TYPE_OPTIONS}
            size="sm"
            ariaLabel="발주 종류 필터"
          />
          <AppSelect
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as MaterialOrderFilterStatus)}
            options={MATERIAL_ORDER_STATUS_OPTIONS}
            size="sm"
            ariaLabel="발주 상태 필터"
          />
        </div>
        <AppButton
          size="md"
          variant="primary"
          width="full"
          className="mt-1 min-h-10 text-sm"
          disabled={creating}
          onClick={onCreateOrder}
        >
          {creating ? "발주서 생성 중" : "발주서 생성"}
        </AppButton>
      </div>

      <div className={MATERIAL_ORDER_PANEL_LIST_CLASS}>
        {loading ? (
          <MaterialOrderPanelMessage title="불러오는 중" description="발주서 목록을 조회하고 있습니다." kind="loading" />
        ) : errorMessage ? (
          <MaterialOrderPanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} kind="error" />
        ) : orders.length === 0 ? (
          <MaterialOrderPanelMessage
            title="등록된 발주서 없음"
            description="발주서 생성 버튼으로 첫 원단·부자재 발주서를 만듭니다."
          />
        ) : filteredOrders.length === 0 ? (
          <MaterialOrderPanelMessage
            title="검색 결과 없음"
            description="검색어, 상태, 종류 필터를 조정해보세요."
            kind="search"
          />
        ) : (
          filteredOrders.map((order) => (
            <MaterialOrderListButton
              key={order.id}
              order={order}
              selected={order.id === selectedOrderId}
              onSelectOrder={onSelectOrder}
              draftMaterialType={order.id === selectedOrderId ? selectedDraftMaterialType : null}
              draftSupplierName={order.id === selectedOrderId ? selectedDraftSupplierName : null}
              draftLines={order.id === selectedOrderId ? selectedDraftLines : null}
            />
          ))
        )}
      </div>
    </AppCard>
  );
}

function MaterialOrderListButton({
  order,
  selected,
  onSelectOrder,
  draftMaterialType,
  draftSupplierName,
  draftLines,
}: {
  order: MaterialOrder;
  selected: boolean;
  onSelectOrder: (orderId: string) => void;
  draftMaterialType: MaterialOrderDraftType | null;
  draftSupplierName: string | null;
  draftLines: MaterialOrderDraftLine[] | null;
}) {
  const materialType = draftMaterialType ?? resolveMaterialOrderType(order);
  const supplierLabel = draftSupplierName?.trim() || order.supplierPartnerName?.trim() || "공급처 미선택";
  const displayTitle = selected ? `${formatMaterialOrderTypeLabel(materialType)} · ${supplierLabel}` : formatMaterialOrderDisplayTitle(order);
  const primaryLineLabel = draftLines ? formatMaterialOrderDraftLineLabel(draftLines) : formatMaterialOrderPrimaryLineLabel(order);

  return (
    <AppListRow
      as="button"
      type="button"
      selected={selected}
      title={displayTitle}
      description={primaryLineLabel}
      trailing={
        <AppBadge tone={resolveMaterialOrderStatusBadgeTone(order.status)} size="sm">
          {formatMaterialOrderStatusLabel(order.status)}
        </AppBadge>
      }
      meta={
        <span className="flex w-full min-w-0 items-center justify-between gap-2 border-t border-[var(--pbp-border)] pt-2 pbp-text-subtle">
          <span>{formatMaterialOrderTypeLabel(materialType)}</span>
          <span className="truncate">{supplierLabel}</span>
        </span>
      }
      onClick={() => onSelectOrder(order.id)}
    />
  );
}
