const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function isIsoCalendarDate(value) {
  if (typeof value !== "string") return false;
  const matched = ISO_DATE_ONLY_PATTERN.exec(value);
  if (!matched) return false;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

export function serializePostgresDateOnly(value, errorCode = "WORK_ORDER_INVALID_DATE_ONLY") {
  if (value === null || value === undefined) return null;
  if (!isIsoCalendarDate(value)) throw new Error(errorCode);
  return value;
}
