export const PBP_DEFAULT_NUMBER_LOCALE = "ko-KR";

export type PbpFormatNumberInput = string | number | null | undefined;

export type PbpBinaryBytesOptions = {
  zeroLabel?: string;
  gbFractionDigits?: number;
  mbFractionDigits?: number;
  kbFractionDigits?: number;
  minimumMbValue?: number;
};

export function normalizeFiniteNumber(value: PbpFormatNumberInput, fallback = 0): number {
  const next = typeof value === "number" ? value : Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

export function formatPbpInteger(value: PbpFormatNumberInput, locale = PBP_DEFAULT_NUMBER_LOCALE): string {
  return Math.max(0, Math.round(normalizeFiniteNumber(value))).toLocaleString(locale);
}

export function formatPbpNumberWithUnit(
  value: PbpFormatNumberInput,
  unit: string,
  options?: { locale?: string; separator?: string },
): string {
  const separator = options?.separator ?? "";
  return `${formatPbpInteger(value, options?.locale)}${separator}${unit}`;
}

export function formatPbpKrw(
  value: PbpFormatNumberInput,
  options?: { monthly?: boolean; locale?: string },
): string {
  const suffix = options?.monthly ? "원 / 월" : "원";
  return `${formatPbpInteger(value, options?.locale)}${suffix}`;
}

function formatFixed(value: number, fractionDigits: number): string {
  if (fractionDigits <= 0) return `${Math.round(value)}`;
  return value.toFixed(fractionDigits);
}

export function formatPbpBinaryBytes(
  bytes: PbpFormatNumberInput,
  options?: PbpBinaryBytesOptions,
): string {
  const normalized = normalizeFiniteNumber(bytes);
  const safeBytes = Math.max(0, normalized);
  const zeroLabel = options?.zeroLabel ?? "0B";

  if (safeBytes <= 0) return zeroLabel;

  const gb = safeBytes / 1024 ** 3;
  if (gb >= 1) {
    return `${formatFixed(gb, options?.gbFractionDigits ?? 1)}GB`;
  }

  const mb = safeBytes / 1024 ** 2;
  if (mb >= 1) {
    return `${formatFixed(mb, options?.mbFractionDigits ?? 0)}MB`;
  }

  if (options?.minimumMbValue && safeBytes > 0) {
    return `${options.minimumMbValue.toFixed(options.mbFractionDigits ?? 2)}MB`;
  }

  const kb = safeBytes / 1024;
  if (kb >= 1) {
    return `${formatFixed(kb, options?.kbFractionDigits ?? 0)}KB`;
  }

  return `${Math.round(safeBytes)}B`;
}

export function formatPbpFixedGigabytes(
  bytes: PbpFormatNumberInput,
  fractionDigits = 2,
): string {
  const safeBytes = Math.max(0, normalizeFiniteNumber(bytes));
  const safeFractionDigits = Math.max(0, Math.trunc(fractionDigits));
  return `${(safeBytes / 1024 ** 3).toFixed(safeFractionDigits)}GB`;
}
