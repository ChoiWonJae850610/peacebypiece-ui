import { DISPLAY_EMPTY } from "@/lib/constants/display";

export function toDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return DISPLAY_EMPTY;
  return String(value);
}

export function toCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return DISPLAY_EMPTY;
  return `${value.toLocaleString()}원`;
}
