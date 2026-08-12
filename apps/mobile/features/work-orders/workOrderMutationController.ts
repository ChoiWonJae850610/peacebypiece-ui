import {
  archiveWorkOrderMaterial,
  completeWorkOrderImageUpload,
  createWorkOrderDraft,
  createWorkOrderMaterial,
  deleteWorkOrderColor,
  deleteWorkOrderMaterial,
  deleteWorkOrderSize,
  deleteWorkOrderImage,
  deleteWorkOrderAttachment,
  patchWorkOrderBasicInfo,
  completeWorkOrderAttachmentUpload,
  patchWorkOrderMaterial,
  prepareWorkOrderImageUpload,
  prepareWorkOrderAttachmentUpload,
  putWorkOrderImageBlob,
  restoreWorkOrderMaterial,
  setRepresentativeWorkOrderImage,
  transitionWorkOrderMaterialOrder,
  issueWorkOrderAttachmentPreview,
  addWorkOrderColor,
  addWorkOrderSize,
  patchWorkOrderColor,
  renameWorkOrderSize,
  reorderWorkOrderColors,
  reorderWorkOrderSizes,
  upsertWorkOrderColorSizeQuantity,
  mutateWorkOrderMeasurement,
  createWorkOrderStructureOption,
  removeWorkOrderStructureOption,
  batchWorkOrderStructureSelection,
} from "../../lib/apiClient";
import type {
  CreateMaterialLineInput,
  CreateWorkOrderDraftInput,
  MaterialLifecycleCommandInput,
  MaterialOrderCommandInput,
  MaterialOrderCommandKind,
  PatchMaterialLineInput,
  PatchWorkOrderBasicInfoInput,
} from "../../domain/mobileContract";

export const workOrderMutationController = {
  createDraft(command: CreateWorkOrderDraftInput, idempotencyKey: string) {
    return createWorkOrderDraft(command, idempotencyKey);
  },
  updateOverview(workOrderId: string, command: PatchWorkOrderBasicInfoInput) {
    return patchWorkOrderBasicInfo(workOrderId, command);
  },
  addSize: addWorkOrderSize,
  renameSize: renameWorkOrderSize,
  deleteSize: deleteWorkOrderSize,
  reorderSizes: reorderWorkOrderSizes,
  addColor: addWorkOrderColor,
  patchColor: patchWorkOrderColor,
  deleteColor: deleteWorkOrderColor,
  reorderColors: reorderWorkOrderColors,
  upsertQuantity: upsertWorkOrderColorSizeQuantity,
  mutateMeasurement: mutateWorkOrderMeasurement,
  createStructureOption: createWorkOrderStructureOption,
  removeStructureOption: removeWorkOrderStructureOption,
  batchStructureSelection: batchWorkOrderStructureSelection,
  createMaterial(workOrderId: string, command: CreateMaterialLineInput, idempotencyKey: string) {
    return createWorkOrderMaterial(workOrderId, command, idempotencyKey);
  },
  updateMaterial(workOrderId: string, materialLineId: string, command: PatchMaterialLineInput) {
    return patchWorkOrderMaterial(workOrderId, materialLineId, command);
  },
  deleteMaterial(workOrderId: string, materialLineId: string, command: MaterialLifecycleCommandInput, idempotencyKey: string) {
    return deleteWorkOrderMaterial(workOrderId, materialLineId, command, idempotencyKey);
  },
  archiveMaterial(workOrderId: string, materialLineId: string, command: MaterialLifecycleCommandInput, idempotencyKey: string) {
    return archiveWorkOrderMaterial(workOrderId, materialLineId, command, idempotencyKey);
  },
  restoreMaterial(workOrderId: string, materialLineId: string, command: MaterialLifecycleCommandInput, idempotencyKey: string) {
    return restoreWorkOrderMaterial(workOrderId, materialLineId, command, idempotencyKey);
  },
  transitionMaterialOrder(
    workOrderId: string,
    materialLineId: string,
    kind: MaterialOrderCommandKind,
    command: MaterialOrderCommandInput,
    idempotencyKey: string,
  ) {
    return transitionWorkOrderMaterialOrder(workOrderId, materialLineId, kind, command, idempotencyKey);
  },
  prepareImageUpload(workOrderId: string, file: { readonly name: string; readonly type: string; readonly size: number }) {
    return prepareWorkOrderImageUpload(workOrderId, file);
  },
  putImageBlob(target: Parameters<typeof putWorkOrderImageBlob>[0], blob: Blob) {
    return putWorkOrderImageBlob(target, blob);
  },
  completeImageUpload(workOrderId: string, input: Parameters<typeof completeWorkOrderImageUpload>[1]) {
    return completeWorkOrderImageUpload(workOrderId, input);
  },
  setRepresentativeImage(workOrderId: string, imageId: string, input: Parameters<typeof setRepresentativeWorkOrderImage>[2]) {
    return setRepresentativeWorkOrderImage(workOrderId, imageId, input);
  },
  deleteImage(workOrderId: string, imageId: string, input: Parameters<typeof deleteWorkOrderImage>[2]) {
    return deleteWorkOrderImage(workOrderId, imageId, input);
  },
  prepareAttachmentUpload(workOrderId: string, file: { readonly name: string; readonly type: string; readonly size: number }) {
    return prepareWorkOrderAttachmentUpload(workOrderId, file);
  },
  completeAttachmentUpload(workOrderId: string, input: Parameters<typeof completeWorkOrderAttachmentUpload>[1]) {
    return completeWorkOrderAttachmentUpload(workOrderId, input);
  },
  deleteAttachment(workOrderId: string, attachmentId: string, input: Parameters<typeof deleteWorkOrderAttachment>[2]) {
    return deleteWorkOrderAttachment(workOrderId, attachmentId, input);
  },
  issueAttachmentPreview(workOrderId: string, attachmentId: string) {
    return issueWorkOrderAttachmentPreview(workOrderId, attachmentId);
  },
} as const;
