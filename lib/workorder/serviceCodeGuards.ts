import type { WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import {
  WORKORDER_SERVICE_OPERATION,
  WORKORDER_SERVICE_RESOURCE,
  canWorkOrderServiceTouchResource,
  canWorkOrderServiceUseOperation,
} from "@/lib/workorder/serviceCodeSideEffects";
import type { WorkOrderStatePatch } from "@/types/workorder";

const PRODUCTION_COMPOSITION_RESOURCES = [
  WORKORDER_SERVICE_RESOURCE.factoryOrders,
  WORKORDER_SERVICE_RESOURCE.materials,
  WORKORDER_SERVICE_RESOURCE.outsourcing,
] as const;

const PRODUCTION_COMPOSITION_PATCH_KEYS = [
  "factoryOrderRequest",
  "orderEntries",
  "materials",
  "outsourcing",
] as const satisfies readonly (keyof WorkOrderStatePatch)[];

export function canServiceReplaceProductionComposition(
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): boolean {
  if (!serviceCode) return false;
  const canReplace = canWorkOrderServiceUseOperation({
    serviceCode,
    operation: WORKORDER_SERVICE_OPERATION.replace,
  });
  if (!canReplace) return false;

  return PRODUCTION_COMPOSITION_RESOURCES.every((resource) =>
    canWorkOrderServiceTouchResource({ serviceCode, resource }),
  );
}

export function hasProductionCompositionPatch(patch: WorkOrderStatePatch): boolean {
  return PRODUCTION_COMPOSITION_PATCH_KEYS.some((key) => Object.prototype.hasOwnProperty.call(patch, key));
}

export function stripProductionCompositionPatch(patch: WorkOrderStatePatch): WorkOrderStatePatch {
  const nextPatch = { ...patch };
  for (const key of PRODUCTION_COMPOSITION_PATCH_KEYS) {
    delete nextPatch[key];
  }
  return nextPatch;
}

export function guardProductionCompositionPatchByServiceCode(
  patch: WorkOrderStatePatch,
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): WorkOrderStatePatch {
  if (!hasProductionCompositionPatch(patch)) return patch;
  if (canServiceReplaceProductionComposition(serviceCode)) return patch;
  return stripProductionCompositionPatch(patch);
}
