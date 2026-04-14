import { MATERIAL_STATUS, MATERIAL_TYPE, MATERIAL_UNIT } from "@/lib/constants/material";
import { recalculateMaterial } from "@/lib/workorder/detail/detailCalculations";
import { createId } from "@/lib/workorder/detail/detailSanitizers";
import type { Material } from "@/types/workorder";

export const DEFAULT_NEW_MATERIAL_NAME = "새 자재" as const;

export function createDefaultMaterial(overrides: Partial<Material> = {}): Material {
  return recalculateMaterial({
    id: overrides.id || createId("material"),
    type: overrides.type || MATERIAL_TYPE.unselected,
    name: overrides.name || DEFAULT_NEW_MATERIAL_NAME,
    vendor: overrides.vendor || "",
    vendorRef: overrides.vendorRef ?? null,
    quantity: typeof overrides.quantity === "number" && Number.isFinite(overrides.quantity) ? overrides.quantity : 0,
    unit: overrides.unit || MATERIAL_UNIT.yard,
    unitCost: typeof overrides.unitCost === "number" && Number.isFinite(overrides.unitCost) ? overrides.unitCost : 0,
    totalCost: typeof overrides.totalCost === "number" && Number.isFinite(overrides.totalCost) ? overrides.totalCost : 0,
    status: overrides.status || MATERIAL_STATUS.ready,
  });
}
