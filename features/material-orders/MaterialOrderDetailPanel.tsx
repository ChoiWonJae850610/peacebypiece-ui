import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
  type MaterialOrderDraftTotals,
  type MaterialOrderDraftType,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  formatMaterialOrderCode,
  formatMaterialOrderStatusLabel,
  formatMaterialOrderTypeLabel,
  resolveMaterialOrderType,
} from "@/lib/material-orders/materialOrderWorkspaceClient";
import type { MaterialOrder } from "@/lib/material-orders/types";

type MaterialOrderDetailPanelProps = {
  selectedOrder: MaterialOrder | null;
  materialType: MaterialOrderDraftType;
  destinationMemo: string;
  orderNote: string;
  lines: MaterialOrderDraftLine[];
  totals: MaterialOrderDraftTotals;
  onChangeMaterialType: (materialType: MaterialOrderDraftType) => void;
  onChangeDestinationMemo: (memo: string) => void;
  onChangeOrderNote: (memo: string) => void;
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (lineId: string) => void;
};

export default function MaterialOrderDetailPanel({
  selectedOrder,
  materialType,
  destinationMemo,
  orderNote,
  lines,
  totals,
  onChangeMaterialType,
  onChangeDestinationMemo,
  onChangeOrderNote,
  onChangeLine,
  onAddLine,
  onRemoveLine,
}: MaterialOrderDetailPanelProps) {
  const selectedOrderType = selectedOrder ? resolveMaterialOrderType(selectedOrder) : null;
  const displayMaterialType = selectedOrderType ?? materialType;

  return (
    <AdminCard className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-3">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--pbp-border)] pb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Selected order</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">선택 발주서 상세</h2>
          {selectedOrder ? (
            <p className="mt-1 text-xs pbp-text-muted">{formatMaterialOrderCode(selectedOrder)} · {selectedOrder.supplierPartnerName ?? "공급처 미지정"}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {selectedOrder ? <AdminStatusBadge tone="neutral">{formatMaterialOrderStatusLabel(selectedOrder.status)}</AdminStatusBadge> : null}
          <AdminStatusBadge tone="info">{formatMaterialOrderTypeLabel(displayMaterialType)}</AdminStatusBadge>
        </div>
      </div>

      {selectedOrder ? (
        <>
          <div className="mt-3 grid shrink-0 gap-2 xl:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold pbp-text-subtle">
              발주 종류
              <select
                value={displayMaterialType ?? "fabric"}
                onChange={(event) => onChangeMaterialType(event.target.value as MaterialOrderDraftType)}
                className={fieldClassName()}
              >
                <option value="fabric">원단</option>
                <option value="submaterial">부자재</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold pbp-text-subtle">
              공급처
              <input
                value={selectedOrder.supplierPartnerName ?? ""}
                readOnly
                placeholder="공급처 선택은 다음 단계에서 연결"
                className={fieldClassName("read-only:opacity-80")}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold pbp-text-subtle">
              전달/보관 메모
              <input
                value={destinationMemo}
                onChange={(event) => onChangeDestinationMemo(event.target.value)}
                placeholder="예: B 봉제 전달, 남은 수량 고객사 보관"
                className={fieldClassName()}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold pbp-text-subtle">
              내부 메모
              <input
                value={orderNote}
                onChange={(event) => onChangeOrderNote(event.target.value)}
                placeholder="단가/검토/발주 조건 등 내부 확인용 메모"
                className={fieldClassName()}
              />
            </label>
          </div>

          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold pbp-text-primary">품목 라인</h3>
                <p className="mt-0.5 text-xs leading-5 pbp-text-muted">새 품목부터 실제 저장 연결 예정입니다.</p>
              </div>
              <AdminButton onClick={onAddLine}>품목 추가</AdminButton>
            </div>

            <div className="mt-2 min-h-0 shrink-0 overflow-hidden rounded-3xl border border-[var(--pbp-border)]">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[var(--pbp-surface-soft)] text-xs font-semibold pbp-text-subtle">
                  <tr>
                    <th className="px-3 py-2 text-left">품목명</th>
                    <th className="px-2 py-2 text-left">단위</th>
                    <th className="px-2 py-2 text-right">수량</th>
                    <th className="px-2 py-2 text-right">단가</th>
                    <th className="px-2 py-2 text-right">금액</th>
                    <th className="px-3 py-2 text-center">배분</th>
                    <th className="px-3 py-2 text-right">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--pbp-border)]">
                  {lines.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-sm pbp-text-muted" colSpan={7}>
                        등록된 품목 라인이 없습니다. 품목 추가 버튼으로 입력을 시작합니다.
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <MaterialOrderLineRow
                        key={line.id}
                        line={line}
                        onChangeLine={onChangeLine}
                        onRemoveLine={onRemoveLine}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-2 grid shrink-0 gap-2 rounded-3xl bg-[var(--pbp-surface-soft)] p-2.5 text-sm sm:grid-cols-3">
              <SummaryValue label="품목 수" value={`${totals.lineCount}개`} />
              <SummaryValue label="주문수량 합계" value={String(totals.totalOrderQuantity)} />
              <SummaryValue label="금액 합계" value={formatMaterialOrderAmount(totals.totalAmount)} />
            </div>

            <div className="mt-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
              <AdminButton disabled>저장 연결 예정</AdminButton>
              <AdminButton variant="primary" disabled>검토 요청 예정</AdminButton>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-3xl border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-6 text-center">
          <div>
            <p className="text-base font-semibold pbp-text-primary">선택된 발주서가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">왼쪽 패널에서 새 발주를 만들거나 기존 발주서를 선택하면 상세 입력 영역이 열립니다.</p>
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function MaterialOrderLineRow({
  line,
  onChangeLine,
  onRemoveLine,
}: {
  line: MaterialOrderDraftLine;
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onRemoveLine: (lineId: string) => void;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);

  return (
    <tr className="bg-[var(--pbp-surface-base)] align-middle">
      <td className="px-3 py-2">
        <input
          value={line.itemName}
          onChange={(event) => onChangeLine(line.id, { itemName: event.target.value })}
          placeholder="예: 30수 면 블랙"
          className={fieldClassName("min-w-[160px]")}
        />
      </td>
      <td className="px-2 py-2">
        <input
          value={line.unit}
          onChange={(event) => onChangeLine(line.id, { unit: event.target.value })}
          placeholder="마"
          className={fieldClassName("w-20")}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          value={line.orderQuantity}
          onChange={(event) => onChangeLine(line.id, { orderQuantity: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-24 text-right")}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          min={0}
          value={line.unitPrice}
          onChange={(event) => onChangeLine(line.id, { unitPrice: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-28 text-right")}
        />
      </td>
      <td className="px-2 py-2 text-right font-semibold pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</td>
      <td className="px-3 py-2 text-center text-xs pbp-text-muted">미배분</td>
      <td className="px-3 py-2 text-right">
        <AdminButton size="sm" variant="ghost" onClick={() => onRemoveLine(line.id)}>
          삭제
        </AdminButton>
      </td>
    </tr>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold pbp-text-subtle">{label}</p>
      <p className="mt-0.5 text-base font-semibold pbp-text-primary">{value}</p>
    </div>
  );
}

function normalizeNumberInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fieldClassName(extra = "") {
  return [
    "min-h-9 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]",
    extra,
  ].filter(Boolean).join(" ");
}
