export type DestinationQuantityCell = {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly quantity: number;
};

export function encodeDestinationQuantityCells(cells: readonly DestinationQuantityCell[]): string {
  return JSON.stringify(cells.map((cell) => ({
    color_id: cell.colorId,
    size_row_id: cell.sizeRowId,
    quantity: cell.quantity,
  })));
}
