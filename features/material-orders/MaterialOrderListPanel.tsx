import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  formatMaterialOrderAmount,
  formatMaterialOrderDateLabel,
  formatMaterialOrderDisplayTitle,
  formatMaterialOrderPrimaryLineLabel,
  formatMaterialOrderRequesterLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderStatusBadgeTone,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder, MaterialOrderLineItemType, MaterialOrderStatus } from "@/lib/material-orders/types";

type MaterialOrderListPanelProps = {
  orders: MaterialOrder[];
  selectedOrderId: string;
  loading: boolean;
  errorMessage: string | null;
  creating: boolean;
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
  onRetry: () => void;
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
}: MaterialOrderListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MaterialOrderStatus>("all");
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
    <AdminCard className="flex h-full min-h-0 flex-col overflow-hidden p-2">
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Material orders</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">발주서 목록</h2>
        </div>
        <AdminButton size="sm" disabled={creating} onClick={onCreateOrder}>
          {creating ? "생성중" : "새 발주"}
        </AdminButton>
      </div>

      <div className="mt-2 grid shrink-0 gap-1.5 border-y border-[var(--pbp-border)] py-2">
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

      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
}: {
  order: MaterialOrder;
  selected: boolean;
  onSelectOrder: (orderId: string) => void;
}) {
  const displayTitle = formatMaterialOrderDisplayTitle(order);
  const primaryLineLabel = formatMaterialOrderPrimaryLineLabel(order);
  const requesterLabel = formatMaterialOrderRequesterLabel(order);

  return (
    <button
      type="button"
      onClick={() => onSelectOrder(order.id)}
      className={[
        "w-full rounded-2xl border px-2.5 py-2 text-left transition",
        selected
          ? "border-[var(--pbp-action-primary)] bg-[var(--pbp-surface-soft)] shadow-sm"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] hover:bg-[var(--pbp-surface-soft)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold pbp-text-primary">{displayTitle}</span>
        <AdminStatusBadge tone={resolveMaterialOrderStatusBadgeTone(order.status)} size="xs">
          {formatMaterialOrderStatusLabel(order.status)}
        </AdminStatusBadge>
      </div>
      <p className="mt-1.5 truncate text-xs font-medium pbp-text-primary">{primaryLineLabel}</p>
      <div className="mt-1.5 grid gap-1 text-xs pbp-text-muted">
        <div className="flex items-center justify-between gap-2">
          <span>{formatMaterialOrderDateLabel(order.createdAt)}</span>
          <span>{formatMaterialOrderAmount(order.totalAmount)}</span>
        </div>
        <div className="truncate">{requesterLabel}</div>
      </div>
    </button>
  );
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
    <div className="rounded-2xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-3 text-sm">
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
  return "min-h-9 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-xs pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]";
}
