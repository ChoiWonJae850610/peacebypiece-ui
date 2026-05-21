export const HISTORY_CATEGORY = {
  work: "work",
  inventory: "inventory",
  attachment: "attachment",
} as const;

export const HISTORY_CATEGORIES = [
  HISTORY_CATEGORY.work,
  HISTORY_CATEGORY.inventory,
  HISTORY_CATEGORY.attachment,
] as const;

export type HistoryCategoryValue = (typeof HISTORY_CATEGORIES)[number];

export const HISTORY_FILTER = {
  all: "all",
  work: HISTORY_CATEGORY.work,
  inventory: HISTORY_CATEGORY.inventory,
  attachment: HISTORY_CATEGORY.attachment,
} as const;

export const HISTORY_FILTERS = [
  HISTORY_FILTER.all,
  HISTORY_FILTER.work,
  HISTORY_FILTER.inventory,
  HISTORY_FILTER.attachment,
] as const;

export type HistoryFilterValue = (typeof HISTORY_FILTERS)[number];

export const HISTORY_TONE = {
  blue: "blue",
  violet: "violet",
  emerald: "emerald",
  rose: "rose",
  amber: "amber",
  stone: "stone",
} as const;

export const HISTORY_TONES = [
  HISTORY_TONE.blue,
  HISTORY_TONE.violet,
  HISTORY_TONE.emerald,
  HISTORY_TONE.rose,
  HISTORY_TONE.amber,
  HISTORY_TONE.stone,
] as const;

export type HistoryToneValue = (typeof HISTORY_TONES)[number];

export const MEMO_HISTORY_ACTION = {
  thread: "thread",
  reply: "reply",
} as const;

export const MEMO_HISTORY_ACTIONS = [
  MEMO_HISTORY_ACTION.thread,
  MEMO_HISTORY_ACTION.reply,
] as const;

export type MemoHistoryActionValue = (typeof MEMO_HISTORY_ACTIONS)[number];

export function isHistoryCategory(value: string | null | undefined): value is HistoryCategoryValue {
  return Boolean(value) && (HISTORY_CATEGORIES as readonly string[]).includes(value as string);
}

export function isHistoryFilter(value: string | null | undefined): value is HistoryFilterValue {
  return Boolean(value) && (HISTORY_FILTERS as readonly string[]).includes(value as string);
}

export function isHistoryTone(value: string | null | undefined): value is HistoryToneValue {
  return Boolean(value) && (HISTORY_TONES as readonly string[]).includes(value as string);
}
