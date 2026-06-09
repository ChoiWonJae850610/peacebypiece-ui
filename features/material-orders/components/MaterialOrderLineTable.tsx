import { AppSelect, WaflEmptyState, type AppSelectOption } from "@/components/common/ui";
import {
  CALCULATED_TABLE_CELL_CLASS,
  EDITABLE_TABLE_CELL_CLASS,
  SELECTABLE_TABLE_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
} from "@/components/workorder/detail/shared/detailEditorShared";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import {
  calculateMaterialOrderLineAmount,
  formatMaterialOrderAmount,
  type MaterialOrderDraftLine,
} from "@/lib/material-orders/materialOrderDraftCalculator";

const MATERIAL_ORDER_UNIT_OPTIONS = [
  "마",
  "야드",
  "개",
  "세트",
  "롤",
  "봉",
  "박스",
] as const;

const MATERIAL_ORDER_UNIT_SELECT_OPTIONS: AppSelectOption[] = [
  { value: "", label: "단위" },
  ...MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => ({ value: unit, label: unit })),
];

type MaterialOrderLineTableProps = {
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
};

export function MaterialOrderLineTable({
  lines,
  editable,
  onChangeLine,
  onRemoveLine,
}: MaterialOrderLineTableProps) {
  return (
    <table className="w-full min-w-[540px] table-fixed border-separate border-spacing-0 text-left">
      <colgroup>
        <col className="w-[27%]" />
        <col className="w-[13%]" />
        <col className="w-[15%]" />
        <col className="w-[18%]" />
        <col className="w-[20%]" />
        <col className="w-[7%]" />
      </colgroup>
      <thead className="bg-[var(--pbp-surface-soft)] pbp-text-muted">
        <tr>
          {["품목명", "단위", "수량", "단가", "금액", "관리"].map(
            (header, index) => (
              <th
                key={`${header}-${index}`}
                className={`${TABLE_HEADER_CELL_CLASS} text-center`}
              >
                <span className="block w-full whitespace-nowrap leading-4">
                  {header}
                </span>
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr>
            <td className="px-3 py-4" colSpan={6}>
              <WaflEmptyState
                title="발주 품목을 추가하세요."
                description="작업지시서 자재 선택 패널에서 이번 발주서에 담을 품목을 추가합니다."
                size="sm"
                minHeightClassName="min-h-[96px]"
                className="rounded-[var(--pbp-radius-empty-card)] border-dashed bg-[var(--pbp-empty-state-surface)] shadow-none"
              />
            </td>
          </tr>
        ) : (
          lines.map((line, rowIndex) => (
            <MaterialOrderLineRow
              key={line.id}
              line={line}
              rowIndex={rowIndex}
              editable={editable}
              onChangeLine={onChangeLine}
              onRemoveLine={onRemoveLine}
            />
          ))
        )}
      </tbody>
    </table>
  );
}

function MaterialOrderLineRow({
  line,
  rowIndex,
  editable,
  onChangeLine,
  onRemoveLine,
}: {
  line: MaterialOrderDraftLine;
  rowIndex: number;
  editable: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);

  return (
    <tr
      className={`border-b border-[var(--pbp-border)] transition hover:bg-[var(--pbp-surface-soft)] ${rowIndex % 2 === 0 ? "bg-[var(--pbp-surface)]" : "bg-[var(--pbp-surface-soft)]"}`}
    >
      <td className={EDITABLE_TABLE_CELL_CLASS}>
        <input
          value={line.itemName}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, { itemName: event.target.value })
          }
          placeholder="예: 30수 면 블랙"
          className={compactInputClassName("text-center")}
        />
      </td>
      <td className={SELECTABLE_TABLE_CELL_CLASS}>
        <AppSelect
          value={resolveUnitSelectValue(line.unit)}
          disabled={!editable}
          onValueChange={(value) => onChangeLine(line.id, { unit: value })}
          options={MATERIAL_ORDER_UNIT_SELECT_OPTIONS}
          placeholder="단위"
          size="sm"
          ariaLabel="발주 단위"
          triggerClassName="h-8 min-h-8 justify-center rounded-xl px-2.5 text-center text-xs"
        />
      </td>
      <td className={EDITABLE_TABLE_CELL_CLASS}>
        <input
          type="text"
          inputMode="decimal"
          value={line.orderQuantity}
          disabled={!editable}
          onChange={(event) => {
            const nextOrderQuantity = normalizeNumberInput(event.target.value);
            onChangeLine(line.id, {
              orderQuantity: nextOrderQuantity,
              allocations: line.allocations.length > 0
                ? line.allocations.map((allocation) => ({
                  ...allocation,
                  allocatedQuantity: nextOrderQuantity,
                }))
                : line.allocations,
            });
          }}
          className={compactInputClassName("text-center tabular-nums")}
        />
      </td>
      <td className={EDITABLE_TABLE_CELL_CLASS}>
        <input
          type="text"
          inputMode="numeric"
          value={line.unitPrice}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, {
              unitPrice: normalizeNumberInput(event.target.value),
            })
          }
          className={compactInputClassName("text-right tabular-nums")}
        />
      </td>
      <td
        className={CALCULATED_TABLE_CELL_CLASS}
        title={formatMaterialOrderAmount(lineAmount)}
      >
        <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {formatMaterialOrderAmount(lineAmount)}
        </span>
      </td>
      <td className="px-1.5 py-2 text-center align-middle lg:px-2">
        <div className="flex justify-center">
          {editable ? (
            <WorkOrderCardActionMenu
              menuLabel="발주 품목 작업"
              deleteLabel="발주 품목 삭제"
              deleteText="삭제"
              onDelete={() => onRemoveLine(line.id)}
            />
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function normalizeNumberInput(value: string): number {
  const normalizedValue = value.replace(/,/g, "").trim();
  const parsed = Number(normalizedValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveUnitSelectValue(unit: string): string {
  return MATERIAL_ORDER_UNIT_OPTIONS.includes(
    unit as (typeof MATERIAL_ORDER_UNIT_OPTIONS)[number],
  )
    ? unit
    : "";
}

function compactInputClassName(extra = "") {
  return [
    "pbp-field-interaction pbp-workorder-editable-input h-8 block w-full min-w-0 max-w-full overflow-hidden rounded-xl border px-2.5 text-xs outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-70",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function MaterialOrderLineMobileCards({
  lines,
  editable,
  onChangeLine,
  onRemoveLine,
}: MaterialOrderLineTableProps) {
  if (lines.length === 0) {
    return (
      <WaflEmptyState
        title="발주 품목을 추가하세요."
        description="작업지시서 자재 선택 패널에서 이번 발주서에 담을 품목을 추가합니다."
        size="sm"
        minHeightClassName="min-h-[120px]"
        className="rounded-[var(--pbp-radius-empty-card)] border-dashed bg-[var(--pbp-empty-state-surface)] shadow-none"
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-2">
      {lines.map((line) => (
        <MaterialOrderLineMobileCard
          key={line.id}
          line={line}
          editable={editable}
          onChangeLine={onChangeLine}
          onRemoveLine={onRemoveLine}
        />
      ))}
    </div>
  );
}

function MaterialOrderLineMobileCard({
  line,
  editable,
  onChangeLine,
  onRemoveLine,
}: {
  line: MaterialOrderDraftLine;
  editable: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
}) {
  const lineAmount = calculateMaterialOrderLineAmount(line);

  return (
    <article className="min-w-0 rounded-[var(--pbp-radius-content-card)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 shadow-[var(--pbp-shadow-content-card)]">
      <div className="grid gap-2">
        <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
          <span className="flex min-w-0 items-center justify-between gap-2">
            <span>품목명</span>
            {editable ? (
              <WorkOrderCardActionMenu
                menuLabel="발주 품목 작업"
                deleteLabel="발주 품목 삭제"
                deleteText="삭제"
                onDelete={() => onRemoveLine(line.id)}
              />
            ) : null}
          </span>
          <input
            value={line.itemName}
            disabled={!editable}
            onChange={(event) =>
              onChangeLine(line.id, { itemName: event.target.value })
            }
            placeholder="예: 30수 면 블랙"
            className={compactInputClassName()}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            단위
            <AppSelect
              value={resolveUnitSelectValue(line.unit)}
              disabled={!editable}
              onValueChange={(value) => onChangeLine(line.id, { unit: value })}
              options={MATERIAL_ORDER_UNIT_SELECT_OPTIONS}
              placeholder="단위"
              size="sm"
              ariaLabel="발주 단위"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            수량
            <input
              type="text"
              inputMode="decimal"
              value={line.orderQuantity}
              disabled={!editable}
              onChange={(event) => {
                const nextOrderQuantity = normalizeNumberInput(event.target.value);
                onChangeLine(line.id, {
                  orderQuantity: nextOrderQuantity,
                  allocations: line.allocations.length > 0
                    ? line.allocations.map((allocation) => ({
                      ...allocation,
                      allocatedQuantity: nextOrderQuantity,
                    }))
                    : line.allocations,
                });
              }}
              className={compactInputClassName("text-right tabular-nums")}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            단가
            <input
              type="text"
              inputMode="numeric"
              value={line.unitPrice}
              disabled={!editable}
              onChange={(event) =>
                onChangeLine(line.id, {
                  unitPrice: normalizeNumberInput(event.target.value),
                })
              }
              className={compactInputClassName("text-right tabular-nums")}
            />
          </label>
          <div className="grid gap-1 text-[11px] font-semibold pbp-text-subtle">
            금액
            <div className="flex min-h-8 items-center justify-end rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-info-surface)] px-2.5 text-xs font-semibold tabular-nums pbp-text-primary">
              {formatMaterialOrderAmount(lineAmount)}
            </div>
          </div>
        </div>

      </div>
    </article>
  );
}
