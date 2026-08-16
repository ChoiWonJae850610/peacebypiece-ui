import type { WorkOrderSizeColorMatrix } from "@/domain/mobileContract";

export const DOCUMENT_QUANTITY_INLINE_LIMIT = 6;

export type DocumentQuantityDisclosureRow = {
  readonly key: string;
  readonly label: string;
  readonly quantity: number;
};

export function documentQuantityDisclosureRows(matrix: WorkOrderSizeColorMatrix | null): readonly DocumentQuantityDisclosureRow[] {
  if (!matrix) return [];
  const sizes = new Map(matrix.sizes.map((item) => [item.id, item]));
  const colors = new Map(matrix.colors.map((item) => [item.id, item]));
  return matrix.quantityCells
    .map((cell) => ({ cell, size: sizes.get(cell.sizeRowId), color: colors.get(cell.colorId), quantity: Number(cell.quantity) }))
    .filter((item) => Number.isFinite(item.quantity) && item.quantity !== 0)
    .sort((left, right) => (left.color?.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.color?.displayOrder ?? Number.MAX_SAFE_INTEGER)
      || (left.size?.displayOrder ?? Number.MAX_SAFE_INTEGER) - (right.size?.displayOrder ?? Number.MAX_SAFE_INTEGER)
      || left.cell.colorId.localeCompare(right.cell.colorId)
      || left.cell.sizeRowId.localeCompare(right.cell.sizeRowId))
    .map(({ cell, size, color, quantity }) => ({
      key: `${cell.colorId}:${cell.sizeRowId}`,
      label: `${color?.displayName ?? "색상"} · ${size?.displayLabel ?? "사이즈"}`,
      quantity,
    }));
}
