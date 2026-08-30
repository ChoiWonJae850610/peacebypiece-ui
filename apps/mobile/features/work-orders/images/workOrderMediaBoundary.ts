import type { WorkOrderAttachmentAsset, WorkOrderImageAsset } from "@/domain/mobileContract";
import type { WorkOrderImageAcquisitionSource } from "./workOrderImageAcquisition";

/**
 * Current Maker media boundary. It deliberately contains only persisted image
 * and attachment projection/actions. Future Drawing scene, tool, viewport,
 * history, selection, and export state must live behind a separate adapter and
 * must never be added to MobileWorkOrderExperience as flat fields.
 */
export type WorkOrderMediaBoundary = {
  readonly projection: {
    readonly images: readonly WorkOrderImageAsset[];
    readonly attachments: readonly WorkOrderAttachmentAsset[];
  };
  readonly mutation: {
    readonly busy: boolean;
    readonly busyAssetId: string | null;
    readonly message: string | null;
  };
  readonly imageActions: {
    readonly acquire: (source: WorkOrderImageAcquisitionSource) => void;
    readonly delete: (image: WorkOrderImageAsset) => void;
    readonly setRepresentative: (image: WorkOrderImageAsset) => void;
    readonly setOutputInclude: (image: WorkOrderImageAsset, includeInDocument: boolean) => void;
  };
  readonly attachmentActions: {
    readonly acquire: () => void;
    readonly applyOutputSelection: (changes: readonly { readonly attachmentId: string; readonly includeInDocument: boolean }[]) => Promise<boolean>;
    readonly delete: (attachment: WorkOrderAttachmentAsset) => void;
    readonly open: (attachment: WorkOrderAttachmentAsset) => void;
  };
};
