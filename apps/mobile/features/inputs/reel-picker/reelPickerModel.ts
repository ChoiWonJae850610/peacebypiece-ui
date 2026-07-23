import { canonicalizeNumericInput } from "../../../lib/mobileDisplay.ts";

export const REEL_STEPS = ["0.1", "0.5", "1", "5", "10", "50"] as const;
export type ReelStep = (typeof REEL_STEPS)[number];
export const INTEGER_REEL_STEPS = ["1", "5", "10", "50"] as const satisfies readonly ReelStep[];

export const MATERIAL_REEL_UNITS = ["개", "장", "벌", "m", "yd", "kg"] as const;
export const MATERIAL_QUANTITY_MIN = "0";
export const MATERIAL_QUANTITY_MAX = "99999999999.999";
export const MATERIAL_REEL_WINDOW_RADIUS = 50;

const SCALE = 1000n;
const MAX_SCALED = 99_999_999_999_999n;
const COUNT_UNITS = new Set(["개", "장", "벌", "ea", "set"]);

export type ReelOption = {
  readonly key: string;
  readonly value: string;
};

export type ReelWindow = {
  readonly options: readonly ReelOption[];
  readonly selectedIndex: number;
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
