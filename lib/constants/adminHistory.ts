import type { AdminHistoryDateFilter } from "@/lib/admin/history/types";

export const ADMIN_HISTORY_DATE_FILTER_OPTIONS: { value: AdminHistoryDateFilter; label: string }[] = [
  { value: "all", label: "전체 날짜" },
  { value: "today", label: "오늘" },
  { value: "week", label: "최근 7일" },
  { value: "month", label: "최근 30일" },
];

export const ADMIN_HISTORY_USER_ALL_OPTION = { value: "all", label: "전체 사용자" } as const;
export const ADMIN_HISTORY_DATE_MS = 24 * 60 * 60 * 1000;
