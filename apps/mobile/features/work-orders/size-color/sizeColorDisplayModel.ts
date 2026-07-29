import type {
  WorkOrderQuantityCell,
  WorkOrderSizeColorBundle,
  WorkOrderSizeSpecCell,
} from "@/domain/mobileContract";

const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const EIGHTH_INCH_FRACTIONS = ["", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"] as const;

export type MeasurementDisplayUnit = "cm" | "inch";

export function isNonNegativeDecimalString(value: unknown): value is string {
  return typeof value === "string" && DECIMAL_PATTERN.test(value);
}

export function decimalValue(value: string) {
  return Number(value);
}

export function formatDecimal(value: string) {
  const numeric = decimalValue(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 20 }).format(numeric)
    : value;
}

export function normalizeSameUnitCentimeterDisplay(value: unknown) {
  const displayValue = typeof value === "string" ? value.trim() : "";
  if (!displayValue) return "-";
  if (!isNonNegativeDecimalString(displayValue) || !displayValue.includes(".")) {
    return displayValue;
  }

  const [whole, fraction] = displayValue.split(".");
  const meaningfulFraction = fraction.replace(/0+$/, "");
  return meaningfulFraction ? `${whole}.${meaningfulFraction}` : whole;
}

export function quantityCellMap(cells: readonly WorkOrderQuantityCell[]) {
  return new Map(cells.map((cell) => [`${cell.colorId}:${cell.sizeRowId}`, cell.quantity]));
}

export function sizeSpecCellMap(cells: readonly WorkOrderSizeSpecCell[]) {
  return new Map(cells.map((cell) => [`${cell.pomColumnId}:${cell.sizeRowId}`, cell]));
}

export function sumQuantities(values: readonly string[]) {
  return values.reduce((sum, value) => sum + decimalValue(value), 0);
}

export function matrixComputedTotal(bundle: WorkOrderSizeColorBundle) {
  return sumQuantities(bundle.matrix.quantityCells.map((cell) => cell.quantity));
}

function formatNearestEighthInch(value: number) {
  const totalEighths = Math.round(value * 8);
  const whole = Math.floor(totalEighths / 8);
  const fraction = EIGHTH_INCH_FRACTIONS[totalEighths % 8];
  if (!fraction) return String(whole);
  return whole > 0 ? `${whole} ${fraction}` : fraction;
}

function formatOneDecimal(value: number) {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function displayMeasurement(
  cell: WorkOrderSizeSpecCell | undefined,
  storedUnit: MeasurementDisplayUnit,
  displayUnit: MeasurementDisplayUnit,
) {
  const displayValue = cell?.displayValue?.trim();
  if (storedUnit === displayUnit) {
    if (storedUnit === "cm") {
      return normalizeSameUnitCentimeterDisplay(displayValue || cell?.decimalValue);
    }
    if (displayValue) return displayValue;
    return cell?.decimalValue ?? "-";
  }

  if (!isNonNegativeDecimalString(cell?.decimalValue)) return "-";
  const numeric = decimalValue(cell.decimalValue);
  if (!Number.isFinite(numeric)) return "-";

  return storedUnit === "cm"
    ? formatNearestEighthInch(numeric / 2.54)
    : formatOneDecimal(numeric * 2.54);
}
