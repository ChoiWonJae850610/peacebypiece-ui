const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function getTodayDateInputValue(referenceDate = new Date()) {
  return `${referenceDate.getFullYear()}-${padDatePart(referenceDate.getMonth() + 1)}-${padDatePart(referenceDate.getDate())}`;
}

export function isDateInputValue(value: string) {
  return DATE_INPUT_PATTERN.test(value);
}

export function isPastDateInputValue(value: string, minDate = getTodayDateInputValue()) {
  if (!isDateInputValue(value)) return false;
  return value < minDate;
}

export function clampPastDateInputValue(value: string, minDate = getTodayDateInputValue()) {
  if (!isPastDateInputValue(value, minDate)) return value;
  return minDate;
}
