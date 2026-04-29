import type { HistoryDetailLine, HistoryTransition } from "@/types/workorder";

export type AdminHistoryCategory = "work" | "inventory" | "attachment";
export type AdminHistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type AdminHistoryFilter = "all" | AdminHistoryCategory;
export type AdminHistoryDateFilter = "all" | "today" | "week" | "month";

export type AdminHistoryEvent = {
  id: string;
  workOrderId: string;
  category: AdminHistoryCategory;
  action: string;
  message: string;
  actorName: string;
  occurredAt: string;
  tone: AdminHistoryTone;
  summary: string;
  detailLines?: HistoryDetailLine[];
  transition?: HistoryTransition | null;
};
