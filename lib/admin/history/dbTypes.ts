import type { HistoryLogActionType, HistoryLogTargetType } from "@/lib/constants/history";

export type AdminHistoryLogMetadata = Record<string, unknown>;

export type AdminHistoryLogRecord = {
  id: string;
  company_id: string;
  user_id: string | null;
  action_type: HistoryLogActionType;
  target_type: HistoryLogTargetType;
  target_id: string | null;
  message: string;
  metadata: AdminHistoryLogMetadata;
  created_at: string;
};

export type CreateAdminHistoryLogInput = {
  company_id: string;
  user_id?: string | null;
  action_type: HistoryLogActionType;
  target_type: HistoryLogTargetType;
  target_id?: string | null;
  message: string;
  metadata?: AdminHistoryLogMetadata;
};
