import type { MeasurementTemplateContent, WorkOrderSizeColorBundle } from "../../../domain/mobileContract.ts";
import { formatMeasurementFromCm, normalizeMeasurementSizeSemanticKey } from "../../../domain/measurementPolicy.ts";
import { sortColorRows, sortSizeRows } from "../../../domain/sizeColorStructurePolicy.ts";
import { reconcileSizeColorTotals } from "./sizeColorReconciliation.ts";
import type { QuantityDirtyCell } from "./quantityDirtyDeltaPolicy.ts";

export function createLocalSizeColorIdentity(target: "size" | "color", sequence: number) {
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new Error("LOCAL_SIZE_COLOR_SEQUENCE_INVALID");
  return `local-${target}-${sequence}`;
}

export function remapLocalQuantityIdentity(cell: QuantityDirtyCell, fromId: string, toId: string): QuantityDirtyCell {
  return {
    ...cell,
    colorId: cell.colorId === fromId ? toId : cell.colorId,
    sizeRowId: cell.sizeRowId === fromId ? toId : cell.sizeRowId,
  };
}

export function resolveTemplateModifiedAfterSizeReconcile(currentModified: boolean) {
  return currentModified;
}

export function projectAppliedTemplateValuesForLocalSizes(
  bundle: WorkOrderSizeColorBundle,
  template: MeasurementTemplateContent | null,
): WorkOrderSizeColorBundle {
  if (!template || bundle.specifications.templateId !== template.templateId
    || bundle.specifications.templateVersion !== template.templateVersion) return bundle;
  const templateValues = new Map(template.values.map((value) => [
    `${normalizeMeasurementSizeSemanticKey(value.sizeCode)}:${value.pomCode}`,
    value.decimalValue,
  ]));
  const existing = new Set(bundle.specifications.cells.map((cell) => `${cell.sizeRowId}:${cell.pomColumnId}`));
  const additions = bundle.specifications.sizes.flatMap((size) => bundle.specifications.pomColumns.flatMap((pom) => {
    if (existing.has(`${size.id}:${pom.id}`)) return [];
    const decimalValue = templateValues.get(`${normalizeMeasurementSizeSemanticKey(size.code || size.displayLabel)}:${pom.code}`);
    return decimalValue === undefined ? [] : [{
      sizeRowId: size.id,
      pomColumnId: pom.id,
      decimalValue,
      displayValue: formatMeasurementFromCm(Number(decimalValue), bundle.specifications.measurementUnit),
    }];
  }));
  if (additions.length === 0) return bundle;
  return {
    ...bundle,
    specifications: {
      ...bundle.specifications,
      cells: [...bundle.specifications.cells, ...additions],
      sourceTemplateModified: resolveTemplateModifiedAfterSizeReconcile(bundle.specifications.sourceTemplateModified),
    },
  };
}

export function reconcileLocalFinishedSpecSizes(
  bundle: WorkOrderSizeColorBundle,
  matrixSizes = bundle.matrix.sizes,
  template: MeasurementTemplateContent | null = null,
): WorkOrderSizeColorBundle {
  const existingByKey = new Map(bundle.specifications.sizes.map((size) => [
    normalizeMeasurementSizeSemanticKey(size.code || size.displayLabel),
    size,
  ]));
  const sizes = matrixSizes.map((matrixSize, displayOrder) => {
    const key = normalizeMeasurementSizeSemanticKey(matrixSize.code || matrixSize.displayLabel);
    const existing = existingByKey.get(key);
    return {
      id: matrixSize.id,
      code: matrixSize.code || existing?.code || key,
      displayLabel: matrixSize.displayLabel,
      displayOrder,
    };
  });
  const sizeIds = new Set(sizes.map((size) => size.id));
  return projectAppliedTemplateValuesForLocalSizes({
    ...bundle,
    matrix: { ...bundle.matrix, sizes: matrixSizes },
    specifications: {
      ...bundle.specifications,
      sizes,
      cells: bundle.specifications.cells.filter((cell) => sizeIds.has(cell.sizeRowId)),
      sourceTemplateModified: resolveTemplateModifiedAfterSizeReconcile(bundle.specifications.sourceTemplateModified),
    },
  }, template);
}

export function applyLocalSelectionBatchProjection(input: {
  readonly bundle: WorkOrderSizeColorBundle;
  readonly targetKind: "size" | "color";
  readonly additions: readonly {
    readonly tempId: string;
    readonly displayName: string;
    readonly hexValue: string | null;
  }[];
  readonly deletionIds: readonly string[];
  readonly template: MeasurementTemplateContent | null;
}) {
  const deletionIds = new Set(input.deletionIds);
  if (input.targetKind === "size") {
    const sizes = sortSizeRows([
      ...input.bundle.matrix.sizes.filter((row) => !deletionIds.has(row.id)),
      ...input.additions.map((addition, displayOrder) => ({
        id: addition.tempId,
        code: addition.displayName,
        displayLabel: addition.displayName,
        displayOrder: input.bundle.matrix.sizes.length + displayOrder,
      })),
    ]).map((row, displayOrder) => ({ ...row, displayOrder }));
    const synchronized = reconcileSizeColorTotals({
      ...input.bundle,
      matrix: {
        ...input.bundle.matrix,
        sizes,
        quantityCells: input.bundle.matrix.quantityCells.filter((cell) => !deletionIds.has(cell.sizeRowId)),
      },
    });
    return reconcileLocalFinishedSpecSizes(synchronized, sizes, input.template);
  }
  const colors = sortColorRows([
    ...input.bundle.matrix.colors.filter((row) => !deletionIds.has(row.id)),
    ...input.additions.map((addition, displayOrder) => ({
      id: addition.tempId,
      displayName: addition.displayName,
      hexValue: addition.hexValue,
      displayOrder: input.bundle.matrix.colors.length + displayOrder,
    })),
  ]).map((row, displayOrder) => ({ ...row, displayOrder }));
  return reconcileSizeColorTotals({
    ...input.bundle,
    matrix: {
      ...input.bundle.matrix,
      colors,
      quantityCells: input.bundle.matrix.quantityCells.filter((cell) => !deletionIds.has(cell.colorId)),
    },
  });
}
