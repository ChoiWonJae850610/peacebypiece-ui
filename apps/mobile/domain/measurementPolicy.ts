export const MEASUREMENT_UNITS = ["cm", "inch"] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const INCH_EIGHTH_FRACTIONS = ["", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8"] as const;
export type InchEighthFraction = (typeof INCH_EIGHTH_FRACTIONS)[number];
export const CM_PER_INCH = 2.54;
export const MEASUREMENT_CENTIMETER_MAX = 1000;

const CM_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/u;
const INCH_PATTERN = /^(\d+)(?:\s+(1\/8|1\/4|3\/8|1\/2|5\/8|3\/4|7\/8))?$/u;
const fractionIndex = new Map<string, number>(INCH_EIGHTH_FRACTIONS.map((value, index) => [value, index]));

export type InchMeasurementParts = {
  readonly integerPart: string;
  readonly fractionPart: InchEighthFraction;
};

export type MeasurementSnapshotBaseline = {
  readonly sourceTemplateId: string | null;
  readonly sourceTemplateVersion: number | null;
  readonly sourceApplyEntityVersion: number | null;
  readonly latestContentEntityVersion: number | null;
};

export type MeasurementSizeSource = {
  readonly code: string;
  readonly displayLabel: string;
};

export function normalizeMeasurementSizeSemanticKey(value: string): string {
  return value.normalize("NFKC").trim().toUpperCase().replace(/\s+/gu, "");
}

export function projectMeasurementSizesFromWorkOrder<TWorkOrderSize extends MeasurementSizeSource>(
  workOrderSizes: readonly TWorkOrderSize[],
  sourceSizes: readonly MeasurementSizeSource[],
) {
  const sourceKeys = new Set(sourceSizes.map((size) => normalizeMeasurementSizeSemanticKey(size.code)));
  return workOrderSizes.map((size) => ({
    ...size,
    sourceValueAvailable: sourceKeys.has(normalizeMeasurementSizeSemanticKey(size.code)),
  }));
}

export function isMeasurementUnit(value: unknown): value is MeasurementUnit {
  return typeof value === "string" && (MEASUREMENT_UNITS as readonly string[]).includes(value);
}

export function normalizeMeasurementText(value: unknown): string {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/gu, " ").replace(/\s+/gu, " ").trim().slice(0, 32);
}

export function normalizeCentimeterDraft(value: string): string {
  let result = "";
  let separatorSeen = false;
  let fractionDigits = 0;
  for (const character of value.normalize("NFKC")) {
    if (/\d/u.test(character)) {
      if (separatorSeen && fractionDigits >= 4) continue;
      result += character;
      if (separatorSeen) fractionDigits += 1;
      continue;
    }
    if ((character === "." || character === ",") && !separatorSeen) {
      result += ".";
      separatorSeen = true;
    }
  }
  return result.slice(0, 16);
}

export function parseMeasurementToCm(value: unknown, unit: MeasurementUnit): { readonly centimeters: number; readonly displayFraction: string | null } | null {
  const text = normalizeMeasurementText(value).replace(",", ".");
  if (!text) return null;
  if (unit === "cm") {
    if (!CM_PATTERN.test(text)) return null;
    const centimeters = Number(text);
    if (!Number.isFinite(centimeters) || centimeters < 0 || centimeters > MEASUREMENT_CENTIMETER_MAX) return null;
    return { centimeters: Math.round(centimeters * 10000) / 10000, displayFraction: null };
  }
  const matched = INCH_PATTERN.exec(text);
  if (!matched) return null;
  const eighths = fractionIndex.get(matched[2] ?? "");
  if (eighths === undefined) return null;
  const inches = Number(matched[1]) + eighths / 8;
  const centimeters = inches * CM_PER_INCH;
  if (!Number.isFinite(centimeters) || centimeters < 0 || centimeters > MEASUREMENT_CENTIMETER_MAX) return null;
  return { centimeters: Math.round(centimeters * 10000) / 10000, displayFraction: matched[2] || null };
}

export function formatCanonicalDecimal(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 10000) / 10000);
}

export function formatMeasurementFromCm(centimeters: number | null, unit: MeasurementUnit): string {
  if (centimeters === null || !Number.isFinite(centimeters) || centimeters < 0 || centimeters > MEASUREMENT_CENTIMETER_MAX) return "";
  if (unit === "cm") return formatCanonicalDecimal(centimeters);
  const totalEighths = Math.round((centimeters / CM_PER_INCH) * 8);
  const whole = Math.floor(totalEighths / 8);
  const fraction = INCH_EIGHTH_FRACTIONS[totalEighths % 8];
  return fraction ? `${whole} ${fraction}` : String(whole);
}

export function decomposeInchMeasurement(value: string): InchMeasurementParts {
  const matched = INCH_PATTERN.exec(normalizeMeasurementText(value));
  if (!matched) return { integerPart: "0", fractionPart: "" };
  return {
    integerPart: String(Number(matched[1])),
    fractionPart: (matched[2] ?? "") as InchEighthFraction,
  };
}

export function composeInchMeasurement(integerPart: string, fractionPart: string): string | null {
  if (!/^\d+$/u.test(integerPart) || !INCH_EIGHTH_FRACTIONS.includes(fractionPart as InchEighthFraction)) return null;
  const whole = Number(integerPart);
  if (!Number.isSafeInteger(whole) || whole < 0) return null;
  const value = fractionPart ? `${whole} ${fractionPart}` : String(whole);
  return parseMeasurementToCm(value, "inch") ? value : null;
}

export function inchEighthOptions(): readonly { readonly key: string; readonly value: InchEighthFraction; readonly label: string }[] {
  return INCH_EIGHTH_FRACTIONS.map((value, index) => ({ key: `eighth-${index}`, value, label: value || "없음" }));
}

export function isMeasurementSnapshotModified(input: MeasurementSnapshotBaseline): boolean {
  if (!input.sourceTemplateId || input.sourceTemplateVersion === null || input.sourceApplyEntityVersion === null) return false;
  return input.latestContentEntityVersion !== null && input.latestContentEntityVersion > input.sourceApplyEntityVersion;
}
