import type { WorkOrder } from "@/types/workorder";

export const WORKORDER_SIZE_SPEC_UNITS = ["cm", "inch"] as const;
export type WorkOrderSizeSpecUnit = (typeof WORKORDER_SIZE_SPEC_UNITS)[number];

export type WorkOrderSizeSpecSize = {
  code: string;
  displayLabel: string;
  sortOrder: number;
};

export type WorkOrderSizeSpecPom = {
  code: string;
  displayName: string;
  measurementType: string;
  instruction: string | null;
  sortOrder: number;
};

export type WorkOrderSizeSpecValue = {
  sizeCode: string;
  pomCode: string;
  displayValue: string;
};

export type WorkOrderSizeSpec = {
  workOrderId: string;
  sizeSetCode: string | null;
  measurementUnit: WorkOrderSizeSpecUnit;
  sizes: WorkOrderSizeSpecSize[];
  poms: WorkOrderSizeSpecPom[];
  values: WorkOrderSizeSpecValue[];
  updatedAt: string | null;
};

export type WorkOrderSizeSpecPatch = {
  sizeSetCode?: string | null;
  measurementUnit?: WorkOrderSizeSpecUnit;
  values?: WorkOrderSizeSpecValue[];
};

export type WorkOrderPdfKind = "incomplete" | "final";

export type WorkOrderPdfReadiness = {
  ok: boolean;
  missingItems: string[];
  blockedCode: string | null;
};

export function isWorkOrderSizeSpecUnit(value: unknown): value is WorkOrderSizeSpecUnit {
  return typeof value === "string" && (WORKORDER_SIZE_SPEC_UNITS as readonly string[]).includes(value);
}

export function getWorkOrderCategoryCode(workOrder: Pick<WorkOrder, "category1Id" | "category2Id" | "category3Id" | "category1" | "category2" | "category3">): string | null {
  const candidates = [
    workOrder.category3Id,
    workOrder.category2Id,
    workOrder.category1Id,
    workOrder.category3,
    workOrder.category2,
    workOrder.category1,
  ];

  for (const value of candidates) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }

  return null;
}
