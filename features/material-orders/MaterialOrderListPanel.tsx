import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import {
  MATERIAL_ORDER_EMPTY_STATE_CLASS,
  MATERIAL_ORDER_LIST_CARD_BASE_CLASS,
  MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS,
  MATERIAL_ORDER_LIST_CARD_SELECTED_CLASS,
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
  MATERIAL_ORDER_PANEL_HEADER_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  formatMaterialOrderDisplayTitle,
  formatMaterialOrderPrimaryLineLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderStatusBadgeTone,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
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

const MATERIAL_ORDER_STATUS_OPTIONS: Array<{ value: "all" | MaterialOrderStatus; label: string }> = [
  { value: "all", label: "상태 전체" },
  { value: "draft", label: "작성중" },
  { value: "review_requested", label: "검토요청" },
  { value: "approved", label: "발주요청" },
  { value: "order_placed", label: "발주완료" },
  { value: "rejected", label: "반려" },
  { value: "cancelled", label: "취소" },
];

const MATERIAL_ORDER_TYPE_OPTIONS: Array<{ value: "all" | MaterialOrderLineItemType; label: string }> = [
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
  const [statusFilter, setStatusFilter] = useState<"all" | MaterialOrderStatus>("draft");
  const [typeFilter, setTypeFilter] = useState<"all" | MaterialOrderLineItemType>("all");

  const filteredOrders = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const materialType = resolveMaterialOrderType(order);
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (typeFilter !== "all" && materialType !== typeFilter) return false;

      if (!normalizedSearchQuery) return true;

      const searchableText = [
        formatMaterialOrderStatusLabel(order.status),
        formatMaterialOrderTypeLabel(materialType),
        order.supplierPartnerName,
        order.requestedByDisplayName,
        ...order.lines.map((line) => line.itemName),
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  return (
    <AdminCard className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      <div className={MATERIAL_ORDER_PANEL_HEADER_CLASS}>
        <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Material orders</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">발주서 목록</h2>
        </div>
        <AdminButton size="sm" disabled={creating} onClick={onCreateOrder}>
            {creating ? "생성중" : "새 발주"}
          </AdminButton>
        </div>
      </div>

      <div className="mt-3 grid shrink-0 gap-1.5 border-b border-[var(--pbp-border)] pb-3">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="공급처·품목·담당 검색"
          className={filterFieldClassName()}
        />
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "all" | MaterialOrderLineItemType)}
            className={filterFieldClassName()}
          >
            {MATERIAL_ORDER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | MaterialOrderStatus)}
            className={filterFieldClassName()}
          >
            {MATERIAL_ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={MATERIAL_ORDER_PANEL_LIST_CLASS}>
        {loading ? (
          <PanelMessage title="불러오는 중" description="발주서 목록을 조회하고 있습니다." />
        ) : errorMessage ? (
          <PanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} />
        ) : orders.length === 0 ? (
          <PanelMessage
            title="등록된 발주서 없음"
            description="새 발주 버튼으로 첫 원단·부자재 발주서를 만듭니다."
          />
        ) : filteredOrders.length === 0 ? (
          <PanelMessage
            title="검색 결과 없음"
            description="검색어, 상태, 종류 필터를 조정해보세요."
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
    </AdminCard>
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
    <button
      type="button"
      onClick={() => onSelectOrder(order.id)}
      className={[
        MATERIAL_ORDER_LIST_CARD_BASE_CLASS,
        selected
          ? MATERIAL_ORDER_LIST_CARD_SELECTED_CLASS
          : MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold pbp-text-primary">{displayTitle}</span>
        <div className="flex shrink-0 items-center gap-1">
          <AdminStatusBadge tone={resolveMaterialOrderStatusBadgeTone(order.status)} size="xs">
            {formatMaterialOrderStatusLabel(order.status)}
          </AdminStatusBadge>
          <AdminStatusBadge tone="info" size="xs">
            {formatMaterialOrderTypeLabel(materialType)}
          </AdminStatusBadge>
        </div>
      </div>
      <p className="mt-1.5 truncate text-xs font-medium pbp-text-primary">{primaryLineLabel}</p>
    </button>
  );
}

function formatMaterialOrderDraftLineLabel(lines: MaterialOrderDraftLine[]): string {
  const primaryLine = lines.find((line) => line.itemName.trim().length > 0) ?? null;
  if (!primaryLine) return "품목 미입력";

  const extraCount = Math.max(0, lines.length - 1);
  return extraCount > 0 ? `${primaryLine.itemName.trim()} 외 ${extraCount}건` : primaryLine.itemName.trim();
}

function PanelMessage({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className={MATERIAL_ORDER_EMPTY_STATE_CLASS}>
      <p className="font-semibold pbp-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-5 pbp-text-muted">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-2">
          <AdminButton size="sm" variant="ghost" onClick={onAction}>{actionLabel}</AdminButton>
        </div>
      ) : null}
    </div>
  );
}

function filterFieldClassName() {
  return MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS;
}
