export type QuantityDirtyCell = {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly quantity: number;
};

type DirtyEntry = {
  readonly cell: QuantityDirtyCell;
  readonly generation: number;
};

export type QuantityDirtyDelta = Map<string, DirtyEntry>;

export function quantityDirtyCellKey(cell: Pick<QuantityDirtyCell, "colorId" | "sizeRowId">) {
  return `${cell.colorId}:${cell.sizeRowId}`;
}

export function stageQuantityDirtyCell(delta: QuantityDirtyDelta, cell: QuantityDirtyCell, generation: number) {
  delta.set(quantityDirtyCellKey(cell), { cell, generation });
}

export function snapshotQuantityDirtyDelta(delta: QuantityDirtyDelta) {
  return [...delta.entries()].map(([key, entry]) => ({ key, ...entry }));
}

export function acknowledgeQuantityDirtySnapshot(
  delta: QuantityDirtyDelta,
  snapshot: readonly { readonly key: string; readonly generation: number }[],
) {
  for (const committed of snapshot) {
    if (delta.get(committed.key)?.generation === committed.generation) delta.delete(committed.key);
  }
}
