const KST_TIME_ZONE = "Asia/Seoul";

const FULL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatRecentKstDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return FULL_DATE_TIME_FORMATTER.format(date).replace(",", "").replace("24:", "00:");
}
