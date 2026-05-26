import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineRemainingQuantity,
  type MaterialOrderDraftAllocation,
  type MaterialOrderDraftLine,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrderDraftGuideItem } from "@/lib/material-orders/materialOrderWorkspaceViewModel";

type MaterialOrderAllocationPanelProps = {
  guideItems: MaterialOrderDraftGuideItem[];
  candidates: MaterialOrderWorkspaceWorkOrderCandidate[];
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  loading: boolean;
  errorMessage: string | null;
  onChangeAllocation: (lineId: string, workOrderId: string, patch: Partial<MaterialOrderDraftAllocation>) => void;
  onRemoveAllocation: (lineId: string, workOrderId: string) => void;
  onRetry: () => void;
};

export default function MaterialOrderAllocationPanel({
  guideItems,
  candidates,
  lines,
  editable,
  loading,
  errorMessage,
  onChangeAllocation,
  onRemoveAllocation,
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
        <AdminStatusBadge tone={lines.length > 0 ? "info" : "neutral"}>{lines.length}품목</AdminStatusBadge>
      </div>

      <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <PanelMessage title="불러오는 중" description="작업지시서 목록을 조회하고 있습니다." />
        ) : errorMessage ? (
          <PanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} />
        ) : lines.length === 0 ? (
          <PanelMessage title="품목 라인 없음" description="가운데 패널에서 품목 라인을 먼저 추가한 뒤 작업지시서에 배분합니다." />
        ) : candidates.length === 0 ? (
          <PanelMessage
            title="연결 가능한 작업지시서 없음"
            description="같은 회사 범위에서 조회 가능한 작업지시서가 없거나 권한이 없습니다."
          />
        ) : (
          candidates.map((workOrder) => (
            <AllocationCandidateCard
              key={workOrder.id}
              workOrder={workOrder}
              lines={lines}
              editable={editable}
              onChangeAllocation={onChangeAllocation}
              onRemoveAllocation={onRemoveAllocation}
            />
          ))
        )}
      </div>

      <div className="mt-2 shrink-0 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
        배분 입력 후 가운데 패널의 저장 버튼을 누르면 발주 품목과 작업지시서 배분이 함께 저장됩니다.
      </div>
    </AdminCard>
  );
}

function AllocationCandidateCard({
  workOrder,
  lines,
  editable,
  onChangeAllocation,
  onRemoveAllocation,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  onChangeAllocation: (lineId: string, workOrderId: string, patch: Partial<MaterialOrderDraftAllocation>) => void;
  onRemoveAllocation: (lineId: string, workOrderId: string) => void;
}) {
  const selectedLine = lines.find((line) => line.allocations.some((allocation) => allocation.workOrderId === workOrder.id)) ?? null;
  const selectedAllocation = selectedLine?.allocations.find((allocation) => allocation.workOrderId === workOrder.id) ?? null;

  function changeLine(nextLineId: string) {
    if (selectedLine) onRemoveAllocation(selectedLine.id, workOrder.id);
    if (nextLineId) {
      onChangeAllocation(nextLineId, workOrder.id, {
        allocatedQuantity: selectedAllocation?.allocatedQuantity ?? 0,
        allocationNote: selectedAllocation?.allocationNote ?? "",
      });
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.code}</p>
          <p className="mt-1 truncate text-xs pbp-text-muted">{workOrder.productName} · {workOrder.reorderLabel}</p>
        </div>
        <AdminStatusBadge tone={selectedLine ? "success" : "warning"}>{selectedLine ? "연결됨" : "미연결"}</AdminStatusBadge>
      </div>
      <div className="mt-2 grid gap-1 text-xs pbp-text-muted">
        <p>{workOrder.requestedMaterialLabel}</p>
        <p>{workOrder.dueDateLabel}</p>
      </div>
      <div className="mt-2 grid gap-2">
        <select className={fieldClassName()} disabled={!editable} value={selectedLine?.id ?? ""} onChange={(event) => changeLine(event.target.value)}>
          <option value="">품목 라인 선택</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.itemName.trim() || "이름 없는 품목"} · 잔여 {calculateMaterialOrderLineRemainingQuantity(line)}{line.unit}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          className={fieldClassName()}
          disabled={!editable || !selectedLine}
          value={selectedAllocation?.allocatedQuantity ?? 0}
          onChange={(event) => {
            if (!selectedLine) return;
            onChangeAllocation(selectedLine.id, workOrder.id, { allocatedQuantity: normalizeNumberInput(event.target.value) });
          }}
          placeholder="배분 수량"
        />
        <input
          className={fieldClassName()}
          disabled={!editable || !selectedLine}
          value={selectedAllocation?.allocationNote ?? ""}
          onChange={(event) => {
            if (!selectedLine) return;
            onChangeAllocation(selectedLine.id, workOrder.id, { allocationNote: event.target.value });
          }}
          placeholder="배분 메모"
        />
      </div>
      {selectedLine ? (
        <div className="mt-2 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
          <span className="font-semibold pbp-text-primary">{selectedLine.itemName || "품목"}</span> 배분 {calculateMaterialOrderLineAllocatedQuantity(selectedLine)} / 잔여 {calculateMaterialOrderLineRemainingQuantity(selectedLine)} {selectedLine.unit}
        </div>
      ) : null}
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

function normalizeNumberInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fieldClassName(extra = "") {
  return [
    "min-h-10 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}
