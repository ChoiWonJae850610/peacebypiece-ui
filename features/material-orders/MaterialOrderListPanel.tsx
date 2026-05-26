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
    <AdminCard className="flex min-h-[320px] flex-col p-4 lg:min-h-0 lg:w-[280px] lg:shrink-0 lg:overflow-hidden 2xl:w-[300px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Material orders</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">발주서 목록</h2>
          <p className="mt-1 text-xs leading-5 pbp-text-muted">발주서를 선택해 가운데 패널에서 상세와 품목을 편집합니다.</p>
        </div>
        <AdminButton size="sm" disabled>새 발주</AdminButton>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
        {draftMaterialOrderList.map((order) => (
          <MaterialOrderListButton
            key={order.id}
            order={order}
            selected={order.id === selectedOrderId}
            onSelectOrder={onSelectOrder}
          />
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
        현재는 화면 구조 확인용 로컬 목록입니다. 실제 목록은 repository/API 연결 후 회사별 발주서로 대체합니다.
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
        "w-full rounded-3xl border px-4 py-3 text-left transition",
        selected
          ? "border-[var(--pbp-action-primary)] bg-[var(--pbp-surface-soft)] shadow-sm"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] hover:bg-[var(--pbp-surface-soft)]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold pbp-text-primary">{order.code}</span>
        <AdminStatusBadge tone={selected ? "info" : "neutral"}>{order.statusLabel}</AdminStatusBadge>
      </div>
      <p className="mt-2 text-xs font-medium pbp-text-primary">{materialTypeLabels[order.materialType]} · {order.supplierName}</p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs pbp-text-muted">
        <span>{order.createdAtLabel}</span>
        <span>{order.amountLabel}</span>
      </div>
    </button>
  );
}
