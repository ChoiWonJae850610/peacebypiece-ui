import type { HistoryDetailLine, HistoryTransition } from "@/types/workorder";

export type AdminHistoryCategory = "work" | "inventory" | "attachment";
export type AdminHistoryTone = "blue" | "violet" | "emerald" | "rose" | "amber" | "stone";
export type AdminHistoryFilter = "all" | AdminHistoryCategory;
export type AdminHistoryDateFilter = "all" | "today" | "week" | "month";

export type AdminHistoryActor = {
  id: string | null;
  name: string;
  email?: string | null;
};

export type AdminHistoryTarget = {
  type: string;
  id: string | null;
  label?: string | null;
};

export type AdminHistoryTimestamp = {
  iso: string;
  display: string;
};

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
  actor: AdminHistoryActor;
  target: AdminHistoryTarget;
  timestamp: AdminHistoryTimestamp;
  detailLines?: HistoryDetailLine[];
  transition?: HistoryTransition | null;
};
