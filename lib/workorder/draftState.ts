import type { WorkOrder } from "@/types/workorder";
import { hasWorkOrderDraftChangesByStoragePolicy } from "@/lib/workorder/storagePolicy";

export function hasWorkOrderDraftChanges(current: WorkOrder | null | undefined, persisted: WorkOrder | null | undefined): boolean {
  return hasWorkOrderDraftChangesByStoragePolicy(current, persisted);
}
