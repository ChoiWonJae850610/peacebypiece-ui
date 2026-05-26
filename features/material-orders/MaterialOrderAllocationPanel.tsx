import { useMemo, useState } from "react";

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

  const [searchQuery, setSearchQuery] = useState("");
  const filteredCandidates = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    if (!normalizedSearchQuery) return candidates;

    return candidates.filter((workOrder) => [
      workOrder.code,
      workOrder.productName,
      workOrder.reorderLabel,
      workOrder.managerLabel,
      workOrder.requestedMaterialLabel,
      workOrder.materialCountLabel,
      workOrder.dueDateLabel,
    ].join(" ").toLowerCase().includes(normalizedSearchQuery));
  }, [candidates, searchQuery]);

  return (
    <AdminCard className="flex h-full min-h-0 flex-col overflow-hidden p-3">
      <div className="shrink-0 border-b border-[var(--pbp-border)] pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Allocation</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">작업지시서</h2>
          </div>
          <AdminStatusBadge tone={candidates.length > 0 ? "info" : "neutral"} size="xs">
            {candidates.length}건
          </AdminStatusBadge>
        </div>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="제품·담당 검색"
          className={fieldClassName("mt-3 min-h-9 text-xs")}
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <PanelMessage title="불러오는 중" description="작업지시서 목록을 조회하고 있습니다." />
        ) : errorMessage ? (
          <PanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} />
        ) : candidates.length === 0 ? (
          <PanelMessage
            title="표시할 작업지시서 없음"
            description="발주 요청 이후 자재 할당 대상 작업지시서가 없습니다."
          />
        ) : filteredCandidates.length === 0 ? (
          <PanelMessage title="검색 결과 없음" description="검색어를 조정해보세요." />
        ) : (
          filteredCandidates.map((workOrder) => (
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
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-3 transition hover:bg-[var(--pbp-surface-soft)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.productName || workOrder.code}</p>
          <p className="mt-1 truncate text-xs pbp-text-muted">{workOrder.reorderLabel} · {workOrder.managerLabel}</p>
        </div>
        <AdminStatusBadge tone={selectedLine ? "success" : "warning"} size="xs">
          {selectedLine ? "할당" : "대기"}
        </AdminStatusBadge>
      </div>

      <div className="mt-3 grid gap-1 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold pbp-text-subtle">자재</span>
          <span className="font-semibold pbp-text-primary">{workOrder.materialCountLabel}</span>
        </div>
        <p className="max-h-10 overflow-hidden text-xs leading-5 pbp-text-muted">{workOrder.requestedMaterialLabel}</p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] pbp-text-muted">
        <span>{workOrder.dueDateLabel}</span>
        <span>·</span>
        <span>{workOrder.code}</span>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-2">
        <select className={fieldClassName("text-xs")} disabled={!editable || lines.length === 0} value={selectedLine?.id ?? ""} onChange={(event) => changeLine(event.target.value)}>
          <option value="">할당할 품목 선택</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.itemName.trim() || "이름 없는 품목"} · 잔여 {calculateMaterialOrderLineRemainingQuantity(line)}{line.unit}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] gap-2">
          <input
            type="number"
            min={0}
            className={fieldClassName("text-right text-xs")}
            disabled={!editable || !selectedLine}
            value={selectedAllocation?.allocatedQuantity ?? 0}
            onChange={(event) => {
              if (!selectedLine) return;
              onChangeAllocation(selectedLine.id, workOrder.id, { allocatedQuantity: normalizeNumberInput(event.target.value) });
            }}
            placeholder="수량"
          />
          <input
            className={fieldClassName("text-xs")}
            disabled={!editable || !selectedLine}
            value={selectedAllocation?.allocationNote ?? ""}
            onChange={(event) => {
              if (!selectedLine) return;
              onChangeAllocation(selectedLine.id, workOrder.id, { allocationNote: event.target.value });
            }}
            placeholder="메모"
          />
        </div>
        {lines.length === 0 ? (
          <p className="text-xs leading-5 pbp-text-muted">가운데 패널에서 품목 라인을 먼저 추가합니다.</p>
        ) : null}
      </div>

      {selectedLine ? (
        <p className="mt-2 text-xs leading-5 pbp-text-muted">
          <span className="font-semibold pbp-text-primary">{selectedLine.itemName || "품목"}</span> 할당 {calculateMaterialOrderLineAllocatedQuantity(selectedLine)} / 잔여 {calculateMaterialOrderLineRemainingQuantity(selectedLine)} {selectedLine.unit}
        </p>
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
    "min-h-9 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] disabled:bg-[var(--pbp-surface-soft)] disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}
