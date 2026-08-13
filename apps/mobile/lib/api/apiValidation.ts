const NON_NEGATIVE_DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export const COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

export function isDecimalString(value: unknown): value is string {
  return typeof value === "string" && NON_NEGATIVE_DECIMAL_PATTERN.test(value);
}
