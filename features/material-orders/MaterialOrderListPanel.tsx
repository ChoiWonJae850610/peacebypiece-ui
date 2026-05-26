import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  formatMaterialOrderAmount,
  formatMaterialOrderCode,
  formatMaterialOrderDateLabel,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder } from "@/lib/material-orders/types";

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
        ) : (
          orders.map((order) => (
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
  const materialType = resolveMaterialOrderType(order);

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
        <span className="truncate text-sm font-semibold pbp-text-primary">{formatMaterialOrderCode(order)}</span>
        <AdminStatusBadge tone={selected ? "info" : "neutral"}>{formatMaterialOrderStatusLabel(order.status)}</AdminStatusBadge>
      </div>
      <p className="mt-1.5 truncate text-xs font-medium pbp-text-primary">
        {formatMaterialOrderTypeLabel(materialType)} · {order.supplierPartnerName ?? "공급처 미지정"}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs pbp-text-muted">
        <span>{formatMaterialOrderDateLabel(order.createdAt)}</span>
        <span>{formatMaterialOrderAmount(order.totalAmount)}</span>
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
