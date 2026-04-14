import type { Dispatch, SetStateAction } from "react";
import type { WorkOrder } from "@/types/workorder";
import { normalizeWorkOrdersReorderIdentity } from "@/lib/workorder/reorder/helpers";
import { normalizeSharedInventoryByReorderGroup } from "@/lib/workorder/reorder/inventory";
import { normalizeWorkOrderDataList } from "@/lib/workorder/normalization";

export function stabilizeWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
  return normalizeSharedInventoryByReorderGroup(normalizeWorkOrdersReorderIdentity(normalizeWorkOrderDataList(workOrders)));
}

export function createStabilizedWorkOrdersSetter(
  setState: Dispatch<SetStateAction<WorkOrder[]>>,
): Dispatch<SetStateAction<WorkOrder[]>> {
  return (value) => {
    setState((prev) => {
      const next = typeof value === "function" ? (value as (prevState: WorkOrder[]) => WorkOrder[])(prev) : value;
      return stabilizeWorkOrders(next);
    });
  };
}
