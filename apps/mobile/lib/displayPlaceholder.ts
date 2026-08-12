export const WAFL_UNSET_PLACEHOLDER = "미지정";

export function displayValueOrUnset(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || WAFL_UNSET_PLACEHOLDER;
}

export function isUnsetDisplayValue(value: string | null | undefined) {
  return !value?.trim();
}
