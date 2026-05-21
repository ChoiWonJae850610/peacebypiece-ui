import type { WorkOrderServiceCodeValue } from "@/lib/constants/workorderServiceCodes";
import {
  WORKORDER_SERVICE_OPERATION,
  WORKORDER_SERVICE_RESOURCE,
  canWorkOrderServiceDeleteR2Object,
  canWorkOrderServiceTouchResource,
  canWorkOrderServiceUseOperation,
  getWorkOrderServiceSideEffect,
  type WorkOrderServiceOperationValue,
  type WorkOrderServiceResourceValue,
} from "@/lib/workorder/serviceCodeSideEffects";
import type { WorkOrderStatePatch } from "@/types/workorder";

const PRODUCTION_COMPOSITION_PATCH_KEYS = [
  "factoryOrderRequest",
  "orderEntries",
  "materials",
  "outsourcing",
] as const satisfies readonly (keyof WorkOrderStatePatch)[];

export type WorkOrderServiceSideEffectGuardInput = {
  serviceCode: WorkOrderServiceCodeValue | null | undefined;
  resource: WorkOrderServiceResourceValue;
  operation: WorkOrderServiceOperationValue;
};

export function canServiceUseSideEffect(input: WorkOrderServiceSideEffectGuardInput): boolean {
  return (
    canWorkOrderServiceTouchResource({ serviceCode: input.serviceCode, resource: input.resource }) &&
    canWorkOrderServiceUseOperation({ serviceCode: input.serviceCode, operation: input.operation })
  );
}

export function assertServiceCanUseSideEffect(input: WorkOrderServiceSideEffectGuardInput): void {
  if (canServiceUseSideEffect(input)) return;
  throw new Error(`WORKORDER_SERVICE_SIDE_EFFECT_BLOCKED:${input.serviceCode ?? "UNKNOWN"}:${input.resource}:${input.operation}`);
}

export function assertServiceCanPurgeR2Objects(serviceCode: WorkOrderServiceCodeValue | null | undefined): void {
  const canPurge =
    canWorkOrderServiceDeleteR2Object(serviceCode) &&
    canServiceUseSideEffect({
      serviceCode,
      resource: WORKORDER_SERVICE_RESOURCE.r2Objects,
      operation: WORKORDER_SERVICE_OPERATION.r2Purge,
    });

  if (canPurge) return;
  throw new Error(`WORKORDER_SERVICE_R2_PURGE_BLOCKED:${serviceCode ?? "UNKNOWN"}`);
}

export function canServiceReplaceProductionComposition(
  serviceCode: WorkOrderServiceCodeValue | null | undefined,
): boolean {
  if (!serviceCode) return false;

  const sideEffect = getWorkOrderServiceSideEffect(serviceCode);
  if (!sideEffect.allowsProductionCompositionReplace) return false;

  return canWorkOrderServiceUseOperation({
    serviceCode,
    operation: WORKORDER_SERVICE_OPERATION.replace,
  });
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
