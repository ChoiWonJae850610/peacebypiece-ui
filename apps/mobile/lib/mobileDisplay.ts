const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

const NUMERIC_DRAFT_PATTERN = /^(\d*)(?:\.(\d*))?$/;
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatKoreanCalendarDate(value: string, fallback = "미정"): string {
  const matched = CALENDAR_DATE_PATTERN.exec(value);
  return matched
    ? `${Number(matched[1])}년 ${Number(matched[2])}월 ${Number(matched[3])}일`
    : fallback;
}

export function normalizeNumericDraft(value: string): string {
  if (value === "") return "";
  const matched = NUMERIC_DRAFT_PATTERN.exec(value);
  if (!matched) return value;
  const [, rawWhole, rawFraction] = matched;
  if (rawWhole === "" && rawFraction !== undefined) return `0.${rawFraction}`;
  const whole = rawWhole.replace(/^0+(?=\d)/, "") || "0";
  return rawFraction === undefined ? whole : `${whole}.${rawFraction}`;
}

export function canonicalizeNumericInput(value: string): string {
  const draft = normalizeNumericDraft(value.trim());
  const matched = NUMERIC_DRAFT_PATTERN.exec(draft);
  if (!matched || (matched[1] === "" && matched[2] === undefined)) return draft;
  const [, rawWhole, rawFraction] = matched;
  const whole = rawWhole === "" ? "0" : rawWhole.replace(/^0+(?=\d)/, "") || "0";
  const fraction = (rawFraction ?? "").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

export function normalizeNumericCommitValue(value: string): string {
  return canonicalizeNumericInput(value) || "0";
}

export function shouldSelectNumericValueOnFocus(value: string): boolean {
  const canonical = canonicalizeNumericInput(value);
  return canonical === "0" && value.trim() !== "";
}

export function prepareNumericDraftOnFocus(value: string): string {
  return shouldSelectNumericValueOnFocus(value) ? "" : value;
}

export function stripDecimalTrailingZeros(value: string): string {
  const canonical = canonicalizeNumericInput(value);
  const matched = DECIMAL_PATTERN.exec(canonical);
  if (!matched) return canonical;
  const [, sign, rawWhole, rawFraction = ""] = matched;
  const whole = rawWhole.replace(/^0+(?=\d)/, "") || "0";
  const fraction = rawFraction.replace(/0+$/, "");
  const normalizedSign = sign === "-" && (whole !== "0" || fraction.length > 0) ? "-" : "";
  return `${normalizedSign}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function formatQuantity(value: string | null | undefined, unit: string | null | undefined = ""): string {
  if (typeof value !== "string" || !DECIMAL_PATTERN.test(value.trim())) return "미입력";
  const normalized = stripDecimalTrailingZeros(value);
  const normalizedUnit = typeof unit === "string" ? unit.trim() : "";
  return `${normalized}${normalizedUnit ? ` ${normalizedUnit}` : ""}`;
}

export type QuantityDisplayParts = {
  readonly value: string;
  readonly unit: string;
  readonly combined: string;
};

export function formatQuantityParts(
  value: string | null | undefined,
  unit: string | null | undefined = "",
): QuantityDisplayParts {
  const valueText = formatQuantity(value);
  const unitText = valueText === "미입력" || typeof unit !== "string" ? "" : unit.trim();
  return {
    value: valueText,
    unit: unitText,
    combined: `${valueText}${unitText ? ` ${unitText}` : ""}`,
  };
}

export function formatWon(value: string | null | undefined): string {
  const matched = DECIMAL_PATTERN.exec(value?.trim() ?? "");
  if (!matched) return "미입력";
  const [, sign, rawWhole, rawFraction = ""] = matched;
  const whole = BigInt(rawWhole);
  const fractionForRounding = `${rawFraction}00`;
  const roundUp = fractionForRounding[0] >= "5";
  const rounded = whole + (roundUp ? 1n : 0n);
  const grouped = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign === "-" && rounded !== 0n ? "-" : ""}${grouped}원`;
}

export function formatEstimatedUnitCost(
  estimatedTotal: string | null | undefined,
  totalQuantity: number | null | undefined,
): string {
  const matched = DECIMAL_PATTERN.exec(estimatedTotal?.trim() ?? "");
  if (
    !matched
    || matched[1] === "-"
    || typeof totalQuantity !== "number"
    || !Number.isSafeInteger(totalQuantity)
    || totalQuantity <= 0
  ) return "미산정";

  const rawFraction = matched[3] ?? "";
  const scale = 10n ** BigInt(rawFraction.length);
  const scaledTotal = BigInt(`${matched[2]}${rawFraction}`);
  const denominator = scale * BigInt(totalQuantity);
  const roundedWon = (scaledTotal * 2n + denominator) / (denominator * 2n);
  return formatWon(roundedWon.toString());
}

function quantityToScaled(value: string | null | undefined): bigint | null {
  if (typeof value !== "string") return null;
  const matched = /^(\d+)(?:\.(\d{1,3}))?$/.exec(value.trim());
  if (!matched) return null;
  return BigInt(matched[1]) * 1000n + BigInt((matched[2] ?? "").padEnd(3, "0"));
}

function priceToCents(value: string | null | undefined): bigint | null {
  if (typeof value !== "string") return null;
  const matched = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!matched) return null;
  return BigInt(matched[1]) * 100n + BigInt((matched[2] ?? "").padEnd(2, "0"));
}

function scaledQuantityToString(value: bigint): string {
  const whole = value / 1000n;
  const fraction = (value % 1000n).toString().padStart(3, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

export function calculateOrderQuantity(input: {
  readonly requiredQuantity?: string | null;
  readonly allowanceQuantity?: string | null;
  readonly inventoryUsageQuantity?: string | null;
}): string | null {
  const required = quantityToScaled(input.requiredQuantity);
  const allowance = quantityToScaled(input.allowanceQuantity);
  if (required === null || allowance === null) return null;
  return scaledQuantityToString(required + allowance);
}

export function calculateMaterialAmount(
  orderQuantity: string | null | undefined,
  unitPrice: string | null | undefined,
): string | null {
  if (orderQuantity === null) return null;
  const quantity = quantityToScaled(orderQuantity);
  const price = priceToCents(unitPrice);
  if (quantity === null || price === null) return null;
  const cents = (quantity * price + 500n) / 1000n;
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}
