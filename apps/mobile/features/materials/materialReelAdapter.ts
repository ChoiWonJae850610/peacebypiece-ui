import type { MaterialDraftFields } from "@/domain/mobileContract";

export type MaterialReelField = "requiredQuantity" | "allowanceQuantity" | "inventoryUsageQuantity" | "unitCode";

export function materialReelDraftPatch(input: {
  readonly field: MaterialReelField;
  readonly value: string;
  readonly unitCode: string;
  readonly currentUnitCode: string;
}): Partial<MaterialDraftFields> {
  if (input.field === "unitCode") return { unitCode: input.unitCode };
  return { [input.field]: input.value };
}
