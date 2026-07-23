import {
  archiveWorkOrderMaterial,
  createWorkOrderMaterial,
  patchWorkOrderBasicInfo,
  patchWorkOrderMaterial,
  restoreWorkOrderMaterial,
} from "../../lib/apiClient";
import type {
  CreateMaterialLineInput,
  MaterialLifecycleCommandInput,
  PatchMaterialLineInput,
  PatchWorkOrderBasicInfoInput,
} from "../../domain/mobileContract";

export const workOrderMutationController = {
  updateOverview(workOrderId: string, command: PatchWorkOrderBasicInfoInput) {
    return patchWorkOrderBasicInfo(workOrderId, command);
  },
  createMaterial(workOrderId: string, command: CreateMaterialLineInput, idempotencyKey: string) {
    return createWorkOrderMaterial(workOrderId, command, idempotencyKey);
  },
  updateMaterial(workOrderId: string, materialLineId: string, command: PatchMaterialLineInput) {
    return patchWorkOrderMaterial(workOrderId, materialLineId, command);
  },
  archiveMaterial(workOrderId: string, materialLineId: string, command: MaterialLifecycleCommandInput, idempotencyKey: string) {
    return archiveWorkOrderMaterial(workOrderId, materialLineId, command, idempotencyKey);
  },
  restoreMaterial(workOrderId: string, materialLineId: string, command: MaterialLifecycleCommandInput, idempotencyKey: string) {
    return restoreWorkOrderMaterial(workOrderId, materialLineId, command, idempotencyKey);
  },
} as const;
