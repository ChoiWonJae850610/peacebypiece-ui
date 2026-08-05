export type QuantityProjectionPlan = {
  readonly semantic: "no-op" | "changed" | "reconcile";
  readonly canonicalTotalQuantity: number;
  readonly quantityChanged: boolean;
  readonly projectionChanged: boolean;
};

function quantity(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`COLOR_SIZE_QUANTITY_PROJECTION_INVALID_${field}`);
  }
  return value;
}

export function planColorSizeQuantityProjection(input: {
  readonly currentQuantity: number;
  readonly requestedQuantity: number;
  readonly currentMatrixTotal: number;
  readonly workOrderTotal: number;
  readonly revisionTotal: number;
}): QuantityProjectionPlan {
  const currentQuantity = quantity(input.currentQuantity, "CURRENT_QUANTITY");
  const requestedQuantity = quantity(input.requestedQuantity, "REQUESTED_QUANTITY");
  const currentMatrixTotal = quantity(input.currentMatrixTotal, "MATRIX_TOTAL");
  const workOrderTotal = quantity(input.workOrderTotal, "WORK_ORDER_TOTAL");
  const revisionTotal = quantity(input.revisionTotal, "REVISION_TOTAL");
  const canonicalTotalQuantity = currentMatrixTotal - currentQuantity + requestedQuantity;
  quantity(canonicalTotalQuantity, "NEXT_TOTAL");
  const quantityChanged = currentQuantity !== requestedQuantity;
  const projectionChanged = workOrderTotal !== canonicalTotalQuantity
    || revisionTotal !== canonicalTotalQuantity;
  return {
    semantic: quantityChanged ? "changed" : projectionChanged ? "reconcile" : "no-op",
    canonicalTotalQuantity,
    quantityChanged,
    projectionChanged,
  };
}
