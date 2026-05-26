import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrderDraftGuideItem } from "@/lib/material-orders/materialOrderWorkspaceViewModel";

type MaterialOrderAllocationPanelProps = {
  guideItems: MaterialOrderDraftGuideItem[];
  candidates: MaterialOrderWorkspaceWorkOrderCandidate[];
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

export default function MaterialOrderAllocationPanel({
  guideItems,
  candidates,
  loading,
  errorMessage,
  onRetry,
}: MaterialOrderAllocationPanelProps) {
  void guideItems;

  return (
    <AdminCard className="flex h-full min-h-0 flex-col overflow-hidden p-2">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--pbp-border)] pb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Allocation</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">작업지시서 연결/배분</h2>
        </div>
        <AdminStatusBadge tone="neutral">실제 목록</AdminStatusBadge>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <PanelMessage title="불러오는 중" description="작업지시서 목록을 조회하고 있습니다." />
        ) : errorMessage ? (
          <PanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} />
        ) : candidates.length === 0 ? (
          <PanelMessage
            title="연결 가능한 작업지시서 없음"
            description="같은 회사 범위에서 조회 가능한 작업지시서가 없거나 권한이 없습니다."
          />
        ) : (
          candidates.map((workOrder) => (
            <AllocationCandidateCard key={workOrder.id} workOrder={workOrder} />
          ))
        )}
      </div>

      <div className="mt-2 shrink-0 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
        배분 저장은 다음 단계에서 `material_order_allocations`와 연결합니다.
      </div>
    </AdminCard>
  );
}

function AllocationCandidateCard({ workOrder }: { workOrder: MaterialOrderWorkspaceWorkOrderCandidate }) {
  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.code}</p>
          <p className="mt-1 truncate text-xs pbp-text-muted">{workOrder.productName} · {workOrder.reorderLabel}</p>
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

function fieldClassName(extra = "") {
  return [
    "min-h-10 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}
