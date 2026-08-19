export const WORK_ORDER_FACTORY_PROCESS_CODE = "production_factory" as const;
export const WORK_ORDER_PROCESS_UNIT_CODE = "ea" as const;

export type WorkOrderProductionRole = "factory" | "additional";

export function classifyWorkOrderProductionRole(processTypeCode: string): WorkOrderProductionRole {
  return processTypeCode === WORK_ORDER_FACTORY_PROCESS_CODE ? "factory" : "additional";
}

export function calculateProductionExpectedCost(totalQuantity: string | number, unitPrice: string | number): number {
  const total = Number(totalQuantity);
  const price = Number(unitPrice);
  if (!Number.isFinite(total) || total < 0 || !Number.isFinite(price) || price < 0) return 0;
  return Math.round(total * price * 100) / 100;
}
