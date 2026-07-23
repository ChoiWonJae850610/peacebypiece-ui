import {
  isHangulInitialQuery,
  normalizeSearchText,
} from "./workOrderSearchPolicy.ts";

export const WORK_ORDER_SEARCH_DEBOUNCE_MS = 200;

export const WORK_ORDER_SEARCH_LAYOUT = {
  rowHeight: 44,
  fieldHeight: 44,
  inputHeight: 42,
  inputLineHeight: 18,
  accessorySize: 36,
  filterRailHeight: 44,
} as const;

export function workOrderSearchLayoutState(input: {
  readonly query: string;
  readonly searching: boolean;
}) {
  return {
    rowHeight: WORK_ORDER_SEARCH_LAYOUT.rowHeight,
    fieldHeight: WORK_ORDER_SEARCH_LAYOUT.fieldHeight,
    inputHeight: WORK_ORDER_SEARCH_LAYOUT.inputHeight,
    accessorySize: WORK_ORDER_SEARCH_LAYOUT.accessorySize,
    accessory: input.searching ? "loading" : input.query.length > 0 ? "clear" : "empty",
  } as const;
}

export function normalizeWorkOrderSearchQuery(query: string): string {
  return query.trim();
}

export function resolveWorkOrderServerSearchQuery(previous: string, next: string): string | null {
  const normalizedPrevious = normalizeWorkOrderSearchQuery(previous);
  const normalizedNext = normalizeWorkOrderSearchQuery(next);
  if (isHangulInitialQuery(normalizedNext)) {
    return normalizeSearchText(normalizedPrevious) ? "" : null;
  }
  return normalizeSearchText(normalizedPrevious) === normalizeSearchText(normalizedNext)
    ? null
    : normalizedNext;
}

export function shouldIssueWorkOrderSearch(previous: string, next: string): boolean {
  return resolveWorkOrderServerSearchQuery(previous, next) !== null;
}
