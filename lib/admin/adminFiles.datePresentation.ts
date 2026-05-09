const ADMIN_STORAGE_TIME_ZONE = "Asia/Seoul";

const ADMIN_STORAGE_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ADMIN_STORAGE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const ADMIN_STORAGE_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ADMIN_STORAGE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function parseAdminStorageDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatAdminStorageDate(value: string | Date | null | undefined): string {
  const date = parseAdminStorageDate(value);
  if (!date) return value ? String(value) : "-";
  return ADMIN_STORAGE_DATE_FORMATTER.format(date);
}

export function formatAdminStorageDateTime(value: string | Date | null | undefined): string {
  const date = parseAdminStorageDate(value);
  if (!date) return value ? String(value) : "-";
  const formatted = ADMIN_STORAGE_DATE_TIME_FORMATTER.format(date).replace(",", "").replace("24:", "00:");
  const [datePart, timePart] = formatted.split(" ");
  const [year, month, day] = datePart.split("-");
  return `${year.slice(2)}.${month}.${day} ${timePart}`;
}
