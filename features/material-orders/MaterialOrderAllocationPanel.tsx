import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  allocationCandidateWorkOrders,
  type AllocationCandidateWorkOrder,
} from "@/lib/material-orders/materialOrderDraftWorkspace";
import type { MaterialOrderDraftGuideItem } from "@/lib/material-orders/materialOrderWorkspaceViewModel";

type MaterialOrderAllocationPanelProps = {
  guideItems: MaterialOrderDraftGuideItem[];
};

export default function MaterialOrderAllocationPanel({ guideItems }: MaterialOrderAllocationPanelProps) {
  void guideItems;

  return (
    <AdminCard className="flex h-full min-h-0 flex-col overflow-hidden p-2.5">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--pbp-border)] pb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Allocation</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">작업지시서 연결/배분</h2>
          <p className="mt-1 text-xs leading-5 pbp-text-muted">미배분 작업지시서를 품목과 연결합니다.</p>
        </div>
        <AdminStatusBadge tone="neutral">다음 단계</AdminStatusBadge>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {allocationCandidateWorkOrders.map((workOrder) => (
          <AllocationCandidateCard key={workOrder.id} workOrder={workOrder} />
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
        배분 입력은 다음 단계에서 연결됩니다.
      </div>
    </AdminCard>
  );
}

function AllocationCandidateCard({ workOrder }: { workOrder: AllocationCandidateWorkOrder }) {
  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold pbp-text-primary">{workOrder.code}</p>
          <p className="mt-1 text-xs pbp-text-muted">{workOrder.productName} · {workOrder.reorderLabel}</p>
        </div>
        <AdminStatusBadge tone="warning">미연결</AdminStatusBadge>
      </div>
      <div className="mt-2 grid gap-1 text-xs pbp-text-muted">
        <p>{workOrder.requestedMaterialLabel}</p>
        <p>{workOrder.dueDateLabel}</p>
      </div>
      <div className="mt-2 grid gap-2">
        <select className={fieldClassName()} disabled>
          <option>연결할 품목 라인 선택 예정</option>
        </select>
        <input className={fieldClassName()} disabled placeholder="배분 수량 입력 예정" />
      </div>
    </div>
  );
}

function fieldClassName(extra = "") {
  return [
    "min-h-10 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}
