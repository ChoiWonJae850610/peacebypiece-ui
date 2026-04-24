const KST_TIME_ZONE = "Asia/Seoul";

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const SAME_DAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const FULL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: KST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getKstDateKey(date: Date) {
  return DATE_KEY_FORMATTER.format(date);
}

export function formatRecentKstDateTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const todayKst = getKstDateKey(new Date());
  const targetKst = getKstDateKey(date);
  if (todayKst === targetKst) {
    return SAME_DAY_FORMATTER.format(date).replace("24:", "00:");
  }

  return FULL_DATE_TIME_FORMATTER.format(date).replace(",", "").replace("24:", "00:");
}
