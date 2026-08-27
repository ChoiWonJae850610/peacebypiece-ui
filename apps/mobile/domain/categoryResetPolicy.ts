export function hasCategoryDependentWorkOrderData(input: {
  readonly itemCode: string | null;
  readonly totalQuantity: number;
  readonly sizeCount: number;
  readonly colorCount: number;
  readonly allocationCount: number;
  readonly specPomCount: number;
  readonly specCellCount: number;
  readonly sourceTemplateId: string | null;
}) {
  return Boolean(input.itemCode)
    || input.totalQuantity > 0
    || input.sizeCount > 0
    || input.colorCount > 0
    || input.allocationCount > 0
    || input.specPomCount > 0
    || input.specCellCount > 0
    || Boolean(input.sourceTemplateId);
}
