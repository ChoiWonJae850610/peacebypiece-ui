import { WaflCostSummaryCard, WaflEmptyWorkspaceState, WaflSurface } from "@/components/common/ui";

import {
  calculateMaterialOrderLineAllocatedQuantity,
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftTotals,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";
import { MATERIAL_ORDER_EMPTY_STATE_COPY } from "@/features/material-orders/materialOrderEmptyStates";

type MaterialOrderSummaryFooterProps = {
  totals: MaterialOrderDraftTotals;
  lines: MaterialOrderDraftLine[];
  materialType?: "fabric" | "submaterial" | "";
  workOrderCandidates?: MaterialOrderWorkspaceWorkOrderCandidate[];
};

type SummaryGroup = {
  key: string;
  itemName: string;
  rows: Array<{
    key: string;
    factoryName: string;
    orderQuantity: number;
    extraQuantity: number;
    unit: string;
    amount: number;
  }>;
};

export function MaterialOrderSummaryCards({
  totals,
  lines,
  materialType = "",
  workOrderCandidates = [],
}: MaterialOrderSummaryFooterProps) {
  const currentMaterialLabel = materialType === "fabric"
    ? "원단 주문 요약"
    : materialType === "submaterial"
      ? "부자재 주문 요약"
      : "자재 주문 요약";
  const factoryNameByWorkOrderId = new Map(
    workOrderCandidates.map((candidate) => [candidate.id, candidate.factoryLabel]),
  );
  const groups = buildSummaryGroups(lines, factoryNameByWorkOrderId);

  return (
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(150px,0.34fr)_minmax(0,1fr)]">
      <WaflCostSummaryCard label="총 비용" value={formatMaterialOrderAmount(totals.totalAmount)} emphasize />
      <WaflSurface component="material-order-line-summary" shape="control" tone="muted" className="min-w-0 p-3">
        <p className="text-[11px] font-semibold pbp-text-subtle">{currentMaterialLabel}</p>
        {groups.length > 0 ? (
          <div className="mt-2 grid gap-3">
            {groups.map((group) => (
              <div key={group.key} className="border-t border-[var(--pbp-border)] pt-2 first:border-t-0 first:pt-0">
                <p className="truncate text-xs font-semibold pbp-text-primary">{group.itemName}</p>
                <div className="mt-1.5 grid gap-2 border-l border-[var(--pbp-border)] pl-5">
                  {group.rows.map((row) => (
                    <div key={row.key} className="grid min-w-0 gap-1 text-[11px] font-medium pbp-text-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                      <p className="truncate font-semibold pbp-text-primary">{row.factoryName}</p>
                      <p className="tabular-nums sm:text-right">
                        발주 {row.orderQuantity.toLocaleString()}{row.unit} · 여유 {row.extraQuantity.toLocaleString()}{row.unit} · 금액 {formatMaterialOrderAmount(row.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <WaflEmptyWorkspaceState
            title={MATERIAL_ORDER_EMPTY_STATE_COPY.noOrderLineSummary.title}
            variant="inline-section"
            className="mt-2 min-h-[72px]"
          />
        )}
      </WaflSurface>
    </div>
  );
}

function buildSummaryGroups(
  lines: MaterialOrderDraftLine[],
  factoryNameByWorkOrderId: ReadonlyMap<string, string>,
): SummaryGroup[] {
  const groups = new Map<string, SummaryGroup>();

  for (const line of lines) {
    const itemName = line.itemName.trim() || "품목명 미입력";
    const groupKey = `${itemName}::${line.unit}`;
    const allocatedQuantity = calculateMaterialOrderLineAllocatedQuantity(line);
    const extraQuantity = Math.max(0, Number((line.orderQuantity - allocatedQuantity).toFixed(2)));
    const factoryName = factoryNameByWorkOrderId.get(line.sourceWorkOrderId ?? "") || "공장 미지정";
    const group = groups.get(groupKey) ?? { key: groupKey, itemName, rows: [] };

    group.rows.push({
      key: line.id,
      factoryName,
      orderQuantity: line.orderQuantity,
      extraQuantity,
      unit: line.unit,
      amount: calculateMaterialOrderLineAmount(line),
    });
    groups.set(groupKey, group);
  }

  return Array.from(groups.values());
}
