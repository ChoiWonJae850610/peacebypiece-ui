export type PbpDateLocale = "ko" | "en";

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parsePbpLocalDateValue(value: string | null | undefined) {
  if (!value) return undefined;
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toPbpLocalDateValue(date: Date | undefined | null) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayPbpLocalDateValue() {
  return toPbpLocalDateValue(new Date());
}

export function formatPbpDateDisplay(value: string | null | undefined, locale: PbpDateLocale) {
  const date = parsePbpLocalDateValue(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
