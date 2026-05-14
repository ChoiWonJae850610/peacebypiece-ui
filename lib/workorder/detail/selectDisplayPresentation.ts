import {
  DEFAULT_UNSELECTED_OPTION,
  isUnavailableWorkOrderSelectOption,
} from "@/lib/constants/workorderDomain";

export const EMPTY_WORKORDER_SELECT_DISPLAY = "-";

export function getWorkOrderSelectDisplayValue(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return EMPTY_WORKORDER_SELECT_DISPLAY;
  if (normalized === DEFAULT_UNSELECTED_OPTION) return EMPTY_WORKORDER_SELECT_DISPLAY;
  if (isUnavailableWorkOrderSelectOption(normalized)) return EMPTY_WORKORDER_SELECT_DISPLAY;
  return normalized;
}

export function getTranslatedWorkOrderSelectDisplayValue(
  value: string | null | undefined,
  translate: (value: string) => string,
) {
  const displayValue = getWorkOrderSelectDisplayValue(value);
  if (displayValue === EMPTY_WORKORDER_SELECT_DISPLAY) return displayValue;
  return translate(displayValue);
}
