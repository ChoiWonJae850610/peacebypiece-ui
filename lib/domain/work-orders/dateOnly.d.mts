import type { IsoDate } from "./contracts/index";

export function isIsoCalendarDate(value: unknown): value is IsoDate;
export function serializePostgresDateOnly(value: unknown, errorCode?: string): IsoDate | null;
