import { EMPTY_DISPLAY } from "@/lib/constants/display";

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
  return value && value.trim() ? value : EMPTY_DISPLAY;
}
