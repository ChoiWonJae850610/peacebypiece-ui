import {
  CALCULATED_TABLE_CELL_CLASS,
  DeleteButton,
  EDITABLE_TABLE_CELL_CLASS,
  SELECTABLE_TABLE_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
} from "@/components/workorder/detail/shared/detailEditorShared";
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
    <table className="w-full min-w-[540px] table-fixed text-left">
      <colgroup>
        <col className="w-[27%]" />
        <col className="w-[13%]" />
        <col className="w-[15%]" />
        <col className="w-[18%]" />
        <col className="w-[20%]" />
        <col className="w-[7%]" />
      </colgroup>
      <thead className="pbp-text-muted">
        <tr className="border-b border-[var(--pbp-border)]">
          {["품목명", "단위", "수량", "단가", "금액", ""].map(
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
            <td
              className="h-20 px-3 text-center text-xs pbp-text-muted"
              colSpan={6}
            >
              주문할 자재를 선택하세요.
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
      className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-[var(--pbp-surface)]" : "bg-stone-50/70"} hover:bg-stone-50`}
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
        <select
          value={resolveUnitSelectValue(line.unit)}
          disabled={!editable}
          onChange={(event) =>
            onChangeLine(line.id, { unit: event.target.value })
          }
          className={compactSelectClassName("text-center")}
        >
          <option value="">단위</option>
          {MATERIAL_ORDER_UNIT_OPTIONS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
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
        <DeleteButton
          onClick={() => onRemoveLine(line.id)}
          srLabel="주문 내역 삭제"
          disabled={!editable}
        />
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
    "pbp-field-interaction pbp-workorder-editable-input h-7 block w-full min-w-0 max-w-full overflow-hidden rounded-md border px-2 text-xs outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-70",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

function compactSelectClassName(extra = "") {
  return [
    "pbp-field-interaction pbp-workorder-editable-input h-7 block w-full min-w-0 max-w-full overflow-hidden rounded-md border px-2 pr-6 text-xs outline-none ring-0 disabled:cursor-not-allowed disabled:opacity-70",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}
