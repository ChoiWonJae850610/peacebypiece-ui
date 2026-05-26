import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineRemainingQuantity,
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
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
  onRetry: () => void;
};

export default function MaterialOrderAllocationPanel({
  guideItems,
  candidates,
  lines,
  editable,
  loading,
  errorMessage,
  onAddMaterialToOrder,
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
      workOrder.materialReadinessLabel,
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
            description="자재 발주 대기 또는 진행중인 작업지시서가 없습니다."
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
              onAddMaterialToOrder={onAddMaterialToOrder}
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
  onAddMaterialToOrder,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
}) {
  const linkedLines = lines.filter((line) => line.allocations.some((allocation) => allocation.workOrderId === workOrder.id));

  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-3 transition hover:bg-[var(--pbp-surface-soft)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.productName || workOrder.code}</p>
          <p className="mt-1 truncate text-xs pbp-text-muted">{workOrder.reorderLabel} · {workOrder.managerLabel}</p>
        </div>
        <AdminStatusBadge tone={linkedLines.length > 0 ? "success" : "warning"} size="xs">
          {linkedLines.length > 0 ? "연결" : "대기"}
        </AdminStatusBadge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] pbp-text-muted">
        <span>{workOrder.materialReadinessLabel}</span>
        <span>·</span>
        <span>{workOrder.materialCountLabel}</span>
        <span>·</span>
        <span>{workOrder.dueDateLabel}</span>
      </div>

      <div className="mt-3 grid gap-1.5">
        {workOrder.materialItems.map((material) => (
          <WorkOrderMaterialRequestRow
            key={material.key}
            workOrder={workOrder}
            material={material}
            lines={lines}
            editable={editable}
            onAddMaterialToOrder={onAddMaterialToOrder}
          />
        ))}
      </div>

      {linkedLines.length > 0 ? (
        <div className="mt-2 grid gap-1 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs pbp-text-muted">
          {linkedLines.map((line) => (
            <p key={line.id} className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold pbp-text-primary">{line.itemName || "품목"}</span>
              <span className="shrink-0">할당 {calculateMaterialOrderLineAllocatedQuantity(line)} / 잔여 {calculateMaterialOrderLineRemainingQuantity(line)} {line.unit}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WorkOrderMaterialRequestRow({
  workOrder,
  material,
  lines,
  editable,
  onAddMaterialToOrder,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number];
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
}) {
  const existingLine = lines.find((line) => (
    line.sourceWorkOrderId === workOrder.id
    && line.sourceMaterialKey === material.key
  ));
  const isAdded = Boolean(existingLine);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold pbp-text-primary">{material.itemName}</p>
        <p className="mt-0.5 text-[11px] pbp-text-muted">
          {formatMaterialItemTypeLabel(material.itemType)} · {formatMaterialQuantity(material.quantity, material.unit)}
        </p>
      </div>
      <AdminButton
        size="sm"
        variant={isAdded ? "ghost" : "secondary"}
        disabled={!editable || isAdded}
        onClick={() => onAddMaterialToOrder(workOrder, material)}
      >
        {isAdded ? "추가됨" : "품목 추가"}
      </AdminButton>
    </div>
  );
}

function formatMaterialItemTypeLabel(itemType: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number]["itemType"]): string {
  return itemType === "submaterial" ? "부자재" : "원단";
}

function formatMaterialQuantity(quantity: number, unit: string): string {
  const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
  const normalizedUnit = unit.trim();
  return `${normalizedQuantity}${normalizedUnit ? ` ${normalizedUnit}` : ""}`;
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
    "min-h-9 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] disabled:bg-[var(--pbp-surface-soft)] disabled:opacity-70",
    extra,
  ].filter(Boolean).join(" ");
}
