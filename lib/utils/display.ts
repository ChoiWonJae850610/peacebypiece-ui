import { EMPTY_DISPLAY } from "@/lib/constants/display";

export function hasDisplayText(value: string | null | undefined) {
  return Boolean(value && value.trim());
}

export function joinDisplayParts(parts: Array<string | null | undefined>, separator = " > ") {
  const visibleParts = parts.filter(hasDisplayText).map((part) => String(part).trim());
  return visibleParts.length > 0 ? visibleParts.join(separator) : EMPTY_DISPLAY;
}

export function toDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return EMPTY_DISPLAY;
  if (typeof value === "string" && value.trim() === "") return EMPTY_DISPLAY;
  return value;
}

export function toNumber(value: unknown) {
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function toCurrency(value: unknown) {
  return `${toNumber(value).toLocaleString()}원`;
}

export function toDate(value: string | null | undefined) {
  return hasDisplayText(value) ? String(value).trim() : EMPTY_DISPLAY;
}
