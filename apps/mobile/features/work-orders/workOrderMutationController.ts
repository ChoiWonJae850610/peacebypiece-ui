import {
  completeWorkOrderImageUpload,
  deleteWorkOrderImage,
  deleteWorkOrderAttachment,
  completeWorkOrderAttachmentUpload,
  prepareWorkOrderImageUpload,
  prepareWorkOrderAttachmentUpload,
  putWorkOrderImageBlob,
  setRepresentativeWorkOrderImage,
  issueWorkOrderAttachmentPreview,
  reconcileWorkOrderImageUpload,
} from "../../lib/api/assetsApi";
import { createWorkOrderDraft, createWorkOrderReorder, patchWorkOrderBasicInfo, setWorkOrderSample } from "../../lib/api/workOrdersApi";
import {
  archiveWorkOrderMaterial,
  createWorkOrderMaterial,
  deleteWorkOrderMaterial,
  patchWorkOrderMaterial,
  restoreWorkOrderMaterial,
  transitionWorkOrderMaterialOrder,
} from "../../lib/api/materialsApi";
import {
  addWorkOrderColor,
  addWorkOrderSize,
  batchWorkOrderStructureSelection,
  createWorkOrderStructureOption,
  deleteWorkOrderColor,
  deleteWorkOrderSize,
  patchWorkOrderColor,
  removeWorkOrderStructureOption,
  renameWorkOrderStructureOption,
  renameWorkOrderSize,
  reorderWorkOrderColors,
  reorderWorkOrderSizes,
  upsertWorkOrderColorSizeQuantity,
} from "../../lib/api/sizeColorApi";
import { mutateWorkOrderMeasurement } from "../../lib/api/measurementApi";
import type {
  CreateMaterialLineInput,
  CreateWorkOrderDraftInput,
  CreateWorkOrderReorderInput,
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
  createReorder(sourceWorkOrderId: string, command: CreateWorkOrderReorderInput, idempotencyKey: string) {
    return createWorkOrderReorder(sourceWorkOrderId, command, idempotencyKey);
  },
  updateOverview(workOrderId: string, command: PatchWorkOrderBasicInfoInput) {
    return patchWorkOrderBasicInfo(workOrderId, command);
  },
  setSample: setWorkOrderSample,
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
  renameStructureOption: renameWorkOrderStructureOption,
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
  reconcileImageUpload(workOrderId: string, input: Parameters<typeof reconcileWorkOrderImageUpload>[1]) {
    return reconcileWorkOrderImageUpload(workOrderId, input);
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
