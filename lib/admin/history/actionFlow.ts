import { selectAdminHistoryEventsByCategory } from "@/lib/admin/history/selectors";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

export type AdminHistoryFilterActionInput = {
  events: AdminHistoryEvent[];
  filter: AdminHistoryFilter;
};

export function applyAdminHistoryFilterAction(input: AdminHistoryFilterActionInput): AdminHistoryEvent[] {
  return selectAdminHistoryEventsByCategory(input.events, input.filter);
}
