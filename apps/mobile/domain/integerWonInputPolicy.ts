export const INTEGER_WON_MAX_DIGITS = 12;

const INTEGER_WON_PATTERN = new RegExp(`^(?:0|[1-9]\\d{0,${INTEGER_WON_MAX_DIGITS - 1}})$`, "u");
const INTEGER_WON_DRAFT_PATTERN = new RegExp(`^\\d{0,${INTEGER_WON_MAX_DIGITS}}$`, "u");

export function isIntegerWonValue(value: string) {
  return INTEGER_WON_PATTERN.test(value.trim());
}

export function isIntegerWonDraft(value: string) {
  return INTEGER_WON_DRAFT_PATTERN.test(value);
}
