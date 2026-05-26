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
  materialOrderSupplierOptions,
  materialTypeLabels,
  type MaterialOrderSupplierOption,
} from "@/lib/material-orders/materialOrderDraftWorkspace";

type MaterialOrderDetailPanelProps = {
  materialType: MaterialOrderDraftType;
  supplierId: string;
  destinationMemo: string;
  orderNote: string;
  lines: MaterialOrderDraftLine[];
  totals: MaterialOrderDraftTotals;
  selectedSupplier?: MaterialOrderSupplierOption;
  onChangeMaterialType: (materialType: MaterialOrderDraftType) => void;
  onChangeSupplierId: (supplierId: string) => void;
  onChangeDestinationMemo: (memo: string) => void;
  onChangeOrderNote: (memo: string) => void;
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onAddLine: () => void;
  onRemoveLine: (lineId: string) => void;
};

export default function MaterialOrderDetailPanel({
  materialType,
  supplierId,
  destinationMemo,
  orderNote,
  lines,
  totals,
  selectedSupplier,
  onChangeMaterialType,
  onChangeSupplierId,
  onChangeDestinationMemo,
  onChangeOrderNote,
  onChangeLine,
  onAddLine,
  onRemoveLine,
}: MaterialOrderDetailPanelProps) {
  const filteredSupplierOptions = materialOrderSupplierOptions.filter((supplier) => supplier.materialType === materialType);

  return (
    <AdminCard className="flex min-h-[420px] flex-[1_1_680px] flex-col p-4 lg:min-h-0 lg:min-w-[560px] lg:overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">Selected order</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight pbp-text-primary">선택 발주서 상세</h2>
          <p className="mt-1 text-xs leading-5 pbp-text-muted">발주 기본 정보는 상단에 모으고, 품목은 표에서 빠르게 입력합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="neutral">작성중</AdminStatusBadge>
          <AdminStatusBadge tone="info">{materialTypeLabels[materialType]}</AdminStatusBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
            발주 종류
            <select
              value={materialType}
              onChange={(event) => onChangeMaterialType(event.target.value as MaterialOrderDraftType)}
              className={fieldClassName()}
            >
              <option value="fabric">원단</option>
              <option value="submaterial">부자재</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
            공급처
            <select
              value={supplierId}
              onChange={(event) => onChangeSupplierId(event.target.value)}
              className={fieldClassName()}
            >
              {filteredSupplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
            전달/보관 메모
            <input
              value={destinationMemo}
              onChange={(event) => onChangeDestinationMemo(event.target.value)}
              placeholder="예: B 봉제 전달, 남은 수량 고객사 보관"
              className={fieldClassName()}
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold pbp-text-subtle">
            내부 메모
            <textarea
              value={orderNote}
              onChange={(event) => onChangeOrderNote(event.target.value)}
              placeholder="단가/검토/발주 조건 등 내부 확인용 메모"
              className={fieldClassName("min-h-[76px] resize-none")}
            />
          </label>
        </div>
      </div>

      {selectedSupplier ? (
        <p className="mt-3 rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
          {selectedSupplier.helperText}
        </p>
      ) : null}

      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold pbp-text-primary">품목 라인</h3>
            <p className="mt-1 text-xs leading-5 pbp-text-muted">품목명, 단위, 수량, 단가만 입력합니다. 배분은 오른쪽 패널에서 처리합니다.</p>
          </div>
          <AdminButton onClick={onAddLine}>품목 추가</AdminButton>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-3xl border border-[var(--pbp-border)]">
          <table className="min-w-[680px] w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--pbp-surface-soft)] text-xs font-semibold pbp-text-subtle">
              <tr>
                <th className="px-4 py-3 text-left">품목명</th>
                <th className="px-3 py-3 text-left">단위</th>
                <th className="px-3 py-3 text-right">수량</th>
                <th className="px-3 py-3 text-right">단가</th>
                <th className="px-3 py-3 text-right">금액</th>
                <th className="px-4 py-3 text-center">배분</th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pbp-border)]">
              {lines.map((line) => (
                <MaterialOrderLineRow
                  key={line.id}
                  line={line}
                  canRemove={lines.length > 1}
                  onChangeLine={onChangeLine}
                  onRemoveLine={onRemoveLine}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid gap-3 rounded-3xl bg-[var(--pbp-surface-soft)] p-3 text-sm sm:grid-cols-3">
          <SummaryValue label="품목 수" value={`${totals.lineCount}개`} />
          <SummaryValue label="주문수량 합계" value={String(totals.totalOrderQuantity)} />
          <SummaryValue label="금액 합계" value={formatMaterialOrderAmount(totals.totalAmount)} />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <AdminButton disabled>임시 저장 예정</AdminButton>
          <AdminButton variant="primary" disabled>검토 요청 예정</AdminButton>
        </div>
      </div>
    </AdminCard>
  );
}

function MaterialOrderLineRow({
  line,
  canRemove,
  onChangeLine,
  onRemoveLine,
}: {
  line: MaterialOrderDraftLine;
  canRemove: boolean;
  onChangeLine: (lineId: string, patch: Partial<MaterialOrderDraftLine>) => void;
  onRemoveLine: (lineId: string) => void;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);

  return (
    <tr className="bg-[var(--pbp-surface-base)] align-middle">
      <td className="px-4 py-3">
        <input
          value={line.itemName}
          onChange={(event) => onChangeLine(line.id, { itemName: event.target.value })}
          placeholder="예: 30수 면 블랙"
          className={fieldClassName("min-w-[220px]")}
        />
      </td>
      <td className="px-3 py-3">
        <input
          value={line.unit}
          onChange={(event) => onChangeLine(line.id, { unit: event.target.value })}
          placeholder="마"
          className={fieldClassName("w-24")}
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="number"
          min={0}
          value={line.orderQuantity}
          onChange={(event) => onChangeLine(line.id, { orderQuantity: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-28 text-right")}
        />
      </td>
      <td className="px-3 py-3">
        <input
          type="number"
          min={0}
          value={line.unitPrice}
          onChange={(event) => onChangeLine(line.id, { unitPrice: normalizeNumberInput(event.target.value) })}
          className={fieldClassName("w-32 text-right")}
        />
      </td>
      <td className="px-3 py-3 text-right font-semibold pbp-text-primary">{formatMaterialOrderAmount(lineAmount)}</td>
      <td className="px-4 py-3 text-center text-xs pbp-text-muted">미배분</td>
      <td className="px-4 py-3 text-right">
        <AdminButton size="sm" variant="ghost" disabled={!canRemove} onClick={() => onRemoveLine(line.id)}>
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
      <p className="mt-1 text-base font-semibold pbp-text-primary">{value}</p>
    </div>
  );
}

function normalizeNumberInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fieldClassName(extra = "") {
  return [
    "min-h-10 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm pbp-text-primary outline-none transition placeholder:pbp-text-subtle focus:border-[var(--pbp-action-primary)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)]",
    extra,
  ].filter(Boolean).join(" ");
}
