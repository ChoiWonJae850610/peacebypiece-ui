import type { Dispatch, SetStateAction } from "react";

import type { createExplicitMutationController } from "@/application/mutationController";
import type {
  MobileCurrentUser,
  WorkOrderAttachmentAsset,
  WorkOrderDetailCore,
  WorkOrderImageAsset,
  WorkOrderListItem,
} from "@/domain/mobileContract";

export type WorkOrderAssetRequestIdentity = {
  readonly clientRequestId: string;
  readonly idempotencyKey: string;
};

export type WorkOrderAssetAuthoringInput = {
  readonly detail: WorkOrderDetailCore | null;
  readonly selected: WorkOrderListItem | null;
  readonly user: MobileCurrentUser | null;
  readonly nextIdentity: (kind: "upload" | "representative" | "delete" | "image-output" | "attachment-upload" | "attachment-delete" | "attachment-output") => WorkOrderAssetRequestIdentity;
  readonly beforeAssetMutation?: (workOrderId: string) => Promise<WorkOrderDetailCore | null>;
  readonly onDetailProjection: (detail: WorkOrderDetailCore) => void;
  readonly onMessage: (message: string) => void;
};

export type WorkOrderAssetProjectionController = {
  readonly images: readonly WorkOrderImageAsset[];
  readonly attachments: readonly WorkOrderAttachmentAsset[];
  readonly getImages: () => readonly WorkOrderImageAsset[];
  readonly getAttachments: () => readonly WorkOrderAttachmentAsset[];
  readonly hydrate: (images: readonly WorkOrderImageAsset[], attachments: readonly WorkOrderAttachmentAsset[]) => void;
  readonly reset: () => void;
  readonly refreshProjection: (workOrderId: string, expectedVersion: number) => Promise<void>;
  readonly refreshLatestProjection: (workOrderId: string) => Promise<void>;
};

export type WorkOrderAssetAuthoringRuntime = {
  readonly mutation: ReturnType<typeof createExplicitMutationController>;
  readonly getInput: () => WorkOrderAssetAuthoringInput;
  readonly projection: WorkOrderAssetProjectionController;
  readonly setBusy: Dispatch<SetStateAction<boolean>>;
  readonly setBusyId: Dispatch<SetStateAction<string | null>>;
  readonly setMessage: (message: string) => void;
};
