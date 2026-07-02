import type { WorkOrderSizeSpecUnit } from "@/lib/workorder/sizeSpec/types";

const INCH_FRACTIONS = new Map<string, number>([
  ["1/8", 0.125],
  ["1/4", 0.25],
  ["3/8", 0.375],
  ["1/2", 0.5],
  ["5/8", 0.625],
  ["3/4", 0.75],
  ["7/8", 0.875],
]);

export function normalizeMeasurementDisplayValue(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

export function parseMeasurementValue(value: string, unit: WorkOrderSizeSpecUnit): number | null {
  const normalized = normalizeMeasurementDisplayValue(value);
  if (!normalized) return null;

  if (unit === "cm") {
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1000) return null;
    return Math.round(numeric * 100) / 100;
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)(?:\s+(1\/8|1\/4|3\/8|1\/2|5\/8|3\/4|7\/8))?$/);
  if (!match) {
    const fractionOnly = INCH_FRACTIONS.get(normalized);
    return fractionOnly ?? null;
  }

  const whole = Number(match[1]);
  const fraction = match[2] ? INCH_FRACTIONS.get(match[2]) ?? null : 0;
  if (!Number.isFinite(whole) || whole < 0 || whole > 400 || fraction === null) return null;
  return Math.round((whole + fraction) * 1000) / 1000;
}

export function assertMeasurementValue(value: string, unit: WorkOrderSizeSpecUnit): void {
  if (!value) return;
  if (parseMeasurementValue(value, unit) === null) {
    throw new Error(unit === "inch" ? "INVALID_INCH_MEASUREMENT" : "INVALID_CM_MEASUREMENT");
  }
}
