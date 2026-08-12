import { canonicalizeNumericInput } from "../../../lib/mobileDisplay.ts";

export const REEL_STEPS = ["0.1", "0.5", "1", "5", "10", "50"] as const;
export type ReelStep = (typeof REEL_STEPS)[number];
export const INTEGER_REEL_STEPS = ["1", "5", "10", "50"] as const satisfies readonly ReelStep[];

export const MATERIAL_REEL_UNITS = ["개", "장", "벌", "m", "yd", "kg"] as const;
export const MATERIAL_QUANTITY_MIN = "0";
export const MATERIAL_QUANTITY_MAX = "99999999999.999";
export const MATERIAL_REEL_WINDOW_RADIUS = 50;
export const CIRCULAR_REEL_COPY_COUNT = 9;
export const QUARTER_FRACTION_VALUES = ["0", "0.25", "0.5", "0.75"] as const;

const SCALE = 1000n;
const MAX_SCALED = 99_999_999_999_999n;
const COUNT_UNITS = new Set(["개", "장", "벌", "ea", "set"]);

export type ReelOption = {
  readonly key: string;
  readonly value: string;
  readonly label?: string;
  readonly metadata?: string | null;
  readonly swatchHex?: string | null;
};

export type ReelWindow = {
  readonly options: readonly ReelOption[];
  readonly selectedIndex: number;
};

export type CircularReelOption = ReelOption & {
  readonly logicalIndex: number;
  readonly logicalPosition: number;
};

export type CircularReelWindow = {
  readonly options: readonly CircularReelOption[];
  readonly optionCount: number;
  readonly selectedIndex: number;
  readonly circular: boolean;
};

export type QuarterQuantityParts = {
  readonly integerPart: string;
  readonly fractionPart: (typeof QUARTER_FRACTION_VALUES)[number];
  readonly exactQuarter: boolean;
  readonly preservedValue: string | null;
};

function scaled(value: string): bigint | null {
  const canonical = canonicalizeNumericInput(value);
  const matched = /^(\d{1,11})(?:\.(\d{1,3}))?$/u.exec(canonical);
  if (!matched) return null;
  return BigInt(matched[1]) * SCALE + BigInt((matched[2] ?? "").padEnd(3, "0"));
}

function displayValue(value: bigint): string {
  const bounded = value < 0n ? 0n : value > MAX_SCALED ? MAX_SCALED : value;
  const whole = bounded / SCALE;
  const fraction = (bounded % SCALE).toString().padStart(3, "0").replace(/0+$/u, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

function modulo(value: number, divisor: number): number {
  if (divisor <= 0) return 0;
  return ((value % divisor) + divisor) % divisor;
}

export function createCircularReelWindow(
  options: readonly ReelOption[],
  selectedValue: string,
  copyCount = CIRCULAR_REEL_COPY_COUNT,
): CircularReelWindow {
  const optionCount = options.length;
  const selectedLogicalIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));
  if (optionCount <= 1) {
    return {
      options: options.map((option, logicalIndex) => ({ ...option, logicalIndex, logicalPosition: logicalIndex + 1 })),
      optionCount,
      selectedIndex: selectedLogicalIndex,
      circular: false,
    };
  }
  const safeCopies = Math.max(5, Math.trunc(copyCount) | 1);
  const middleCopy = Math.floor(safeCopies / 2);
  const repeated: CircularReelOption[] = [];
  for (let copy = 0; copy < safeCopies; copy += 1) {
    options.forEach((option, logicalIndex) => repeated.push({
      ...option,
      key: `${copy}:${option.key}`,
      logicalIndex,
      logicalPosition: logicalIndex + 1,
    }));
  }
  return {
    options: repeated,
    optionCount,
    selectedIndex: middleCopy * optionCount + selectedLogicalIndex,
    circular: true,
  };
}

export function circularLogicalIndex(window: CircularReelWindow, visualIndex: number): number {
  return modulo(Math.round(visualIndex), window.optionCount);
}

export function circularRecenterIndex(window: CircularReelWindow, visualIndex: number): number | null {
  if (!window.circular || window.optionCount <= 1) return null;
  const bounded = Math.max(0, Math.min(window.options.length - 1, Math.round(visualIndex)));
  const edgeSize = window.optionCount * 2;
  if (bounded >= edgeSize && bounded < window.options.length - edgeSize) return null;
  const logicalIndex = circularLogicalIndex(window, bounded);
  const middleCopy = Math.floor((window.options.length / window.optionCount) / 2);
  return middleCopy * window.optionCount + logicalIndex;
}

export function decomposeQuarterQuantity(value: string): QuarterQuantityParts {
  const canonical = normalizeReelValue(value);
  if (canonical === null) {
    return { integerPart: "0", fractionPart: "0", exactQuarter: false, preservedValue: value };
  }
  const [integerPart = "0", rawFraction = ""] = canonical.split(".");
  const thousandths = rawFraction.padEnd(3, "0");
  const quarter = thousandths === "000" ? "0"
    : thousandths === "250" ? "0.25"
      : thousandths === "500" ? "0.5"
        : thousandths === "750" ? "0.75"
          : null;
  return quarter === null
    ? { integerPart, fractionPart: "0", exactQuarter: false, preservedValue: canonical }
    : { integerPart, fractionPart: quarter, exactQuarter: true, preservedValue: null };
}

export function composeQuarterQuantity(integerPart: string, fractionPart: string): string | null {
  const normalizedInteger = normalizeReelValue(integerPart);
  if (normalizedInteger === null || normalizedInteger.includes(".")) return null;
  if (!QUARTER_FRACTION_VALUES.includes(fractionPart as (typeof QUARTER_FRACTION_VALUES)[number])) return null;
  return fractionPart === "0" ? normalizedInteger : `${normalizedInteger}${fractionPart.slice(1)}`;
}

export function quarterFractionOptions(): readonly ReelOption[] {
  return QUARTER_FRACTION_VALUES.map((value) => ({ key: `quarter-${value}`, value }));
}

export function defaultReelStep(unitCode: string): ReelStep {
  return COUNT_UNITS.has(unitCode.trim().toLowerCase()) ? "1" : "0.1";
}

export function materialUnitOptions(currentUnit: string): readonly string[] {
  const normalized = currentUnit.trim();
  if (!normalized || MATERIAL_REEL_UNITS.includes(normalized as (typeof MATERIAL_REEL_UNITS)[number])) {
    return MATERIAL_REEL_UNITS;
  }
  return [...MATERIAL_REEL_UNITS, normalized];
}

export function reelStepOptions(integerOnly = false): readonly ReelOption[] {
  const steps = integerOnly ? INTEGER_REEL_STEPS : REEL_STEPS;
  return steps.map((step) => ({ key: step, value: step }));
}

export function normalizeReelValue(value: string): string | null {
  const parsed = scaled(value);
  return parsed === null || parsed > MAX_SCALED ? null : displayValue(parsed);
}

export function createReelWindow(
  currentValue: string,
  step: ReelStep,
  radius = MATERIAL_REEL_WINDOW_RADIUS,
): ReelWindow {
  const anchor = scaled(currentValue) ?? 0n;
  const stepScaled = scaled(step);
  if (stepScaled === null || stepScaled <= 0n) throw new Error("invalid-reel-step");
  const safeRadius = Math.max(1, Math.min(100, Math.trunc(radius)));
  const before = anchor / stepScaled < BigInt(safeRadius) ? Number(anchor / stepScaled) : safeRadius;
  const afterCapacity = (MAX_SCALED - anchor) / stepScaled;
  const after = afterCapacity < BigInt(safeRadius) ? Number(afterCapacity) : safeRadius;
  const options: ReelOption[] = [];
  for (let offset = -before; offset <= after; offset += 1) {
    const value = displayValue(anchor + BigInt(offset) * stepScaled);
    options.push({ key: `${offset}:${value}`, value });
  }
  return { options, selectedIndex: before };
}

export function reelValueAtIndex(window: ReelWindow, index: number): string {
  const boundedIndex = Math.max(0, Math.min(window.options.length - 1, Math.round(index)));
  return window.options[boundedIndex]?.value ?? "0";
}

export function reelIndexForValue(window: ReelWindow, value: string): number {
  const normalized = normalizeReelValue(value);
  if (normalized === null) return window.selectedIndex;
  const exact = window.options.findIndex((option) => option.value === normalized);
  return exact >= 0 ? exact : window.selectedIndex;
}
