import type { WorkOrderSizeColorBundle } from "@/domain/mobileContract";

function integerQuantity(value: string) {
  return /^\d+$/.test(value) ? BigInt(value) : 0n;
}

export function reconcileQuantityCell(
  bundle: WorkOrderSizeColorBundle,
  colorId: string,
  sizeRowId: string,
  quantity: number,
): WorkOrderSizeColorBundle {
  const remaining = bundle.matrix.quantityCells.filter(
    (cell) => cell.colorId !== colorId || cell.sizeRowId !== sizeRowId,
  );
  const quantityCells = quantity === 0
    ? remaining
    : [...remaining, { colorId, sizeRowId, quantity: String(quantity) }];
  const matrixTotal = quantityCells.reduce((total, cell) => total + integerQuantity(cell.quantity), 0n).toString();
  return {
    ...bundle,
    matrix: {
      ...bundle.matrix,
      quantityCells,
      matrixTotal,
      expectedTotal: matrixTotal,
      workOrderTotal: matrixTotal,
      revisionTotal: matrixTotal,
      projectionsMatch: true,
      totalsMatch: true,
    },
  };
}

export function promoteSizeColorBundleVersion(
  bundle: WorkOrderSizeColorBundle,
  nextVersion: number,
): WorkOrderSizeColorBundle {
  return {
    matrix: { ...bundle.matrix, entityVersion: nextVersion },
    specifications: { ...bundle.specifications, entityVersion: nextVersion },
  };
}
