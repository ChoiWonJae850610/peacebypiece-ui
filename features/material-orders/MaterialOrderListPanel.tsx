import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  draftMaterialOrderList,
  materialTypeLabels,
  type MaterialOrderListItem,
} from "@/lib/material-orders/materialOrderDraftWorkspace";

type MaterialOrderListPanelProps = {
  selectedOrderId: string;
  onSelectOrder: (orderId: string) => void;
};

export default function MaterialOrderListPanel({
  selectedOrderId,
  onSelectOrder,
}: MaterialOrderListPanelProps) {
  return (
    <AdminCard className="flex h-full min-h-0 flex-col overflow-hidden p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Material orders</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">발주서 목록</h2>
        </div>
        <AdminButton size="sm" disabled>새 발주</AdminButton>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {draftMaterialOrderList.map((order) => (
          <MaterialOrderListButton
            key={order.id}
            order={order}
            selected={order.id === selectedOrderId}
            onSelectOrder={onSelectOrder}
          />
        ))}
      </div>

    </AdminCard>
  );
}

function MaterialOrderListButton({
  order,
  selected,
  onSelectOrder,
}: {
  order: MaterialOrderListItem;
  selected: boolean;
  onSelectOrder: (orderId: string) => void;
}) {
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
        <span className="text-sm font-semibold pbp-text-primary">{order.code}</span>
        <AdminStatusBadge tone={selected ? "info" : "neutral"}>{order.statusLabel}</AdminStatusBadge>
      </div>
      <p className="mt-1.5 truncate text-xs font-medium pbp-text-primary">{materialTypeLabels[order.materialType]} · {order.supplierName}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs pbp-text-muted">
        <span>{order.createdAtLabel}</span>
        <span>{order.amountLabel}</span>
      </div>
    </button>
  );
}
