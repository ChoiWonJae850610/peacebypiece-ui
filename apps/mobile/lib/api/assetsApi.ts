/**
 * Compatibility facade. Existing callers may keep the historical import
 * while each media responsibility has a bounded implementation owner.
 */
export { getWorkOrderImages } from "./assetReadApi";
export { putWorkOrderAssetBlob, putWorkOrderImageBlob } from "./assetUploadTransport";
export {
  completeWorkOrderImageUpload,
  deleteWorkOrderImage,
  prepareWorkOrderImageUpload,
  reconcileWorkOrderImageUpload,
  setRepresentativeWorkOrderImage,
  setWorkOrderImageOutputInclude,
} from "./imageAssetsApi";
export {
  completeWorkOrderAttachmentUpload,
  deleteWorkOrderAttachment,
  issueWorkOrderAttachmentPreview,
  prepareWorkOrderAttachmentUpload,
} from "./attachmentAssetsApi";
