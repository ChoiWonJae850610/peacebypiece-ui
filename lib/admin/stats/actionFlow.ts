import type { AdminStatsSnapshot } from "@/lib/admin/stats/types";

export type AdminStatsLoadActionState = AdminStatsSnapshot["sourceState"];

export function selectAdminStatsLoadActionState(snapshot: AdminStatsSnapshot): AdminStatsLoadActionState {
  return snapshot.sourceState;
}
