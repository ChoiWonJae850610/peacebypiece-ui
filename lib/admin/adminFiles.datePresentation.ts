export const ADMIN_STORAGE_TIME_ZONE = "Asia/Seoul";

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

function getDatePartMap(
  formatter: Intl.DateTimeFormat,
  date: Date,
): Record<string, string> {
  return formatter.formatToParts(date).reduce<Record<string, string>>(
    (parts, part) => {
      if (part.type !== "literal") parts[part.type] = part.value;
      return parts;
    },
    {},
  );
}

export function formatAdminStorageDate(value: string | Date | null | undefined): string {
  const date = parseAdminStorageDate(value);
  if (!date) return value ? String(value) : "-";
  const parts = getDatePartMap(ADMIN_STORAGE_DATE_FORMATTER, date);
  const year = parts.year ?? "0000";
  const month = parts.month ?? "00";
  const day = parts.day ?? "00";
  return `${year}-${month}-${day}`;
}

export function formatAdminStorageDateTime(value: string | Date | null | undefined): string {
  const date = parseAdminStorageDate(value);
  if (!date) return value ? String(value) : "-";
  const parts = getDatePartMap(ADMIN_STORAGE_DATE_TIME_FORMATTER, date);
  const year = parts.year ?? "0000";
  const month = parts.month ?? "00";
  const day = parts.day ?? "00";
  const hour = parts.hour === "24" ? "00" : parts.hour ?? "00";
  const minute = parts.minute ?? "00";
  return `${year.slice(2)}.${month}.${day} ${hour}:${minute}`;
}
