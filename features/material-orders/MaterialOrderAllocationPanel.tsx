import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import {
  MATERIAL_ORDER_EMPTY_STATE_CLASS,
  MATERIAL_ORDER_LIST_CARD_BASE_CLASS,
  MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS,
  MATERIAL_ORDER_NESTED_ROW_CLASS,
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
  MATERIAL_ORDER_PANEL_HEADER_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
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
      workOrder.requestedMaterialLabel,
    ].join(" ").toLowerCase().includes(normalizedSearchQuery));
  }, [candidates, searchQuery]);

  return (
    <AdminCard className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      <div className={MATERIAL_ORDER_PANEL_HEADER_CLASS}>
        <div className="flex items-end justify-between gap-2">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">작업지시서</h2>
          <AdminStatusBadge tone={filteredCandidates.length > 0 ? "info" : "neutral"} size="xs" className="translate-y-0.5">
            {filteredCandidates.length}건
          </AdminStatusBadge>
        </div>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="제품·자재 검색"
          className={fieldClassName("mt-3 min-h-9 text-xs")}
        />
      </div>

      <div className={MATERIAL_ORDER_PANEL_LIST_CLASS}>
        {loading ? (
          <PanelMessage title="불러오는 중" description="작업지시서 목록을 조회하고 있습니다." />
        ) : errorMessage ? (
          <PanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} />
        ) : candidates.length === 0 ? (
          <PanelMessage
            title="표시할 작업지시서 없음"
            description="자재 발주 대기 상태의 작업지시서가 없습니다."
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
  return (
    <div className={`${MATERIAL_ORDER_LIST_CARD_BASE_CLASS} ${MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS}`}>
      <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.productName || workOrder.code}</p>

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
    <div className={MATERIAL_ORDER_NESTED_ROW_CLASS}>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold pbp-text-primary">{material.itemName}</p>
        <p className="mt-0.5 text-[11px] pbp-text-muted">
          {formatMaterialItemTypeLabel(material.itemType)} · {formatMaterialQuantity(material.quantity, material.unit)}
        </p>
      </div>
      <AdminButton
        size="sm"
        className="min-h-7 px-3 py-1 text-xs"
        variant={isAdded ? "ghost" : "secondary"}
        disabled={!editable || isAdded}
        onClick={() => onAddMaterialToOrder(workOrder, material)}
      >
        {isAdded ? "선택됨" : "선택"}
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


function fieldClassName(extra = "") {
  return [
    MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
    extra,
  ].filter(Boolean).join(" ");
}
