import { DISPLAY_EMPTY } from "@/lib/constants/display";

export function toDisplayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return DISPLAY_EMPTY;
  if (typeof value === "string" && value.trim() === "") return DISPLAY_EMPTY;
  return String(value);
}

export function toCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DISPLAY_EMPTY;
  return `${value.toLocaleString()}원`;
}

export function toNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DISPLAY_EMPTY;
  return value.toLocaleString();
}
