export type DraftStructureTargetKind = "size" | "color";

export type DraftQuantityCell = {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly quantity: number | string;
};

export type DraftStructureDeleteImpact = {
  readonly quantityCellCount: number;
  readonly removedQuantity: number;
};

export function summarizeDraftStructureDeleteImpact(
  cells: readonly DraftQuantityCell[],
  targetKind: DraftStructureTargetKind,
  targetId: string,
): DraftStructureDeleteImpact {
  return cells.reduce<DraftStructureDeleteImpact>((impact, cell) => {
    const matches = targetKind === "size" ? cell.sizeRowId === targetId : cell.colorId === targetId;
    if (!matches) return impact;
    return {
      quantityCellCount: impact.quantityCellCount + 1,
      removedQuantity: impact.removedQuantity + Number(cell.quantity),
    };
  }, { quantityCellCount: 0, removedQuantity: 0 });
}

export function reconcileSelectionAfterDelete(
  orderedIds: readonly string[],
  deletedId: string,
  previousSelectedId: string,
): string {
  const survivors = orderedIds.filter((id) => id !== deletedId);
  if (previousSelectedId !== deletedId && survivors.includes(previousSelectedId)) return previousSelectedId;
  const deletedIndex = orderedIds.indexOf(deletedId);
  return survivors[Math.min(Math.max(deletedIndex, 0), Math.max(survivors.length - 1, 0))] ?? "";
}
