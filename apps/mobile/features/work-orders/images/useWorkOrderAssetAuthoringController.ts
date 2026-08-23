import { useCallback, useRef, useState } from "react";
import { Linking } from "react-native";

import { createExplicitMutationController } from "@/application/mutationController";
import type {
  MobileCurrentUser,
  WorkOrderAttachmentAsset,
  WorkOrderDetailCore,
  WorkOrderImageAsset,
  WorkOrderImageCommandResult,
  WorkOrderListItem,
} from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { canEditWorkOrder } from "@/domain/workOrderPolicy";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { workOrderMutationController } from "../workOrderMutationController";
import { workOrderQueryController } from "../workOrderQueryController";
import { acquireWorkOrderAttachment } from "./workOrderAttachmentAcquisition";
import {
  acquireWorkOrderImage,
  normalizeAcquiredImageFile,
  type WorkOrderImageAcquisitionSource,
} from "./workOrderImageAcquisition";

type RequestIdentity = {
  readonly clientRequestId: string;
  readonly idempotencyKey: string;
};

type Input = {
  readonly detail: WorkOrderDetailCore | null;
  readonly selected: WorkOrderListItem | null;
  readonly user: MobileCurrentUser | null;
  readonly nextIdentity: (kind: "upload" | "representative" | "delete" | "attachment-upload" | "attachment-delete") => RequestIdentity;
  readonly onDetailProjection: (detail: WorkOrderDetailCore) => void;
  readonly onMessage: (message: string) => void;
};

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isAmbiguousUploadCompletion(error: unknown): boolean {
  return error instanceof MobileApiError && (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR");
}

export function useWorkOrderAssetAuthoringController(input: Input) {
  const [images, setImages] = useState<readonly WorkOrderImageAsset[]>([]);
  const [attachments, setAttachments] = useState<readonly WorkOrderAttachmentAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const mutation = useRef(createExplicitMutationController()).current;

  function setMessage(message: string | null) {
    if (message) input.onMessage(message);
  }

  const hydrate = useCallback((nextImages: readonly WorkOrderImageAsset[], nextAttachments: readonly WorkOrderAttachmentAsset[]) => {
    setImages(nextImages);
    setAttachments(nextAttachments);
  }, []);

  const reset = useCallback(() => {
    hydrate([], []);
    setBusy(false);
    setBusyId(null);
  }, [hydrate]);

  async function refreshProjection(workOrderId: string, expectedVersion: number) {
    const [refreshedDetail, refreshedImages] = await Promise.all([
      workOrderQueryController.detail(workOrderId),
      workOrderQueryController.images(workOrderId),
    ]);
    if (refreshedDetail.header.entityVersion !== expectedVersion || refreshedImages.entityVersion !== expectedVersion) {
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 변경 후 최신 버전을 확인하지 못했습니다." });
    }
    input.onDetailProjection(refreshedDetail);
    hydrate(refreshedImages.items, refreshedImages.attachments);
  }

  async function acquireImage(source: WorkOrderImageAcquisitionSource) {
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(null);
    try {
      const acquired = await acquireWorkOrderImage(source);
      if (acquired.status === "cancelled") return;
      if (acquired.status === "denied") return setMessage(acquired.message);
      if (images.length >= 20) return setMessage("작업지시서 이미지는 최대 20장까지 등록할 수 있습니다.");
      const localResponse = await fetch(acquired.asset.uri);
      if (!localResponse.ok) throw new Error("LOCAL_IMAGE_READ_FAILED");
      const blob = await localResponse.blob();
      const file = normalizeAcquiredImageFile(acquired.asset, blob);
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) return setMessage("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) return setMessage("이미지는 1장당 10MB 이하만 등록할 수 있습니다.");
      const uploadTarget = await workOrderMutationController.prepareImageUpload(input.selected.workOrderId, file);
      await workOrderMutationController.putImageBlob(uploadTarget, blob);
      const uploadIdentity = input.nextIdentity("upload");
      const completeInput = {
        expectedVersion: input.detail.header.entityVersion,
        ...uploadIdentity,
        uploadTarget,
      };
      let result: WorkOrderImageCommandResult | null;
      try {
        result = await workOrderMutationController.completeImageUpload(input.selected.workOrderId, completeInput);
      } catch (error) {
        if (!isAmbiguousUploadCompletion(error)) throw error;
        result = null;
        for (let attempt = 0; attempt < 9 && !result; attempt += 1) {
          await wait(attempt === 0 ? 1_200 : 4_000);
          try {
            result = await workOrderMutationController.reconcileImageUpload(input.selected.workOrderId, uploadIdentity);
          } catch (reconcileError) {
            if (!isAmbiguousUploadCompletion(reconcileError)) throw reconcileError;
          }
        }
        if (!result) {
          throw new MobileApiError({ code: "TIMEOUT", message: "이미지 등록 결과를 아직 확인하지 못했습니다. 잠시 후 이미지 목록을 다시 확인해 주세요." });
        }
      }
      await refreshProjection(input.selected.workOrderId, result.nextVersion);
      setMessage(result.isRepresentative ? "첫 이미지를 등록하고 대표이미지로 지정했습니다." : "이미지를 등록했습니다. 기존 대표이미지는 유지됩니다.");
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "이미지를 등록하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.");
    } finally {
      mutation.complete();
      setBusy(false);
      setBusyId(null);
    }
  }

  async function acquireAttachment() {
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(null);
    try {
      if (images.length + attachments.length >= 20) return setMessage("이미지와 첨부는 합쳐 최대 20개까지 등록할 수 있습니다.");
      const acquired = await acquireWorkOrderAttachment();
      if (acquired.status === "cancelled") return;
      if (acquired.status === "invalid") return setMessage(acquired.message);
      const localResponse = await fetch(acquired.asset.uri);
      if (!localResponse.ok) throw new Error("LOCAL_ATTACHMENT_READ_FAILED");
      const blob = await localResponse.blob();
      if (blob.size !== acquired.asset.size) throw new Error("LOCAL_ATTACHMENT_SIZE_MISMATCH");
      const uploadTarget = await workOrderMutationController.prepareAttachmentUpload(input.selected.workOrderId, {
        name: acquired.asset.name,
        type: acquired.asset.mimeType,
        size: acquired.asset.size,
      });
      await workOrderMutationController.putImageBlob(uploadTarget, blob);
      const result = await workOrderMutationController.completeAttachmentUpload(input.selected.workOrderId, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("attachment-upload"),
        uploadTarget,
      });
      await refreshProjection(input.selected.workOrderId, result.nextVersion);
      setMessage("첨부파일을 등록했습니다.");
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "첨부파일을 등록하지 못했습니다.");
    } finally {
      mutation.complete();
      setBusy(false);
      setBusyId(null);
    }
  }

  async function deleteAttachment(attachment: WorkOrderAttachmentAsset) {
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(attachment.id);
    try {
      const result = await workOrderMutationController.deleteAttachment(input.selected.workOrderId, attachment.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("attachment-delete"),
      });
      await refreshProjection(input.selected.workOrderId, result.nextVersion);
      setMessage("첨부파일을 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "첨부파일을 삭제하지 못했습니다.");
    } finally {
      mutation.complete();
      setBusy(false);
      setBusyId(null);
    }
  }

  function requestDeleteAttachment(attachment: WorkOrderAttachmentAsset) {
    if (busy) return;
    confirmWaflDestructiveAction({ title: "첨부파일을 삭제할까요?", message: attachment.filename, onConfirm: () => void deleteAttachment(attachment) });
  }

  async function openAttachment(attachment: WorkOrderAttachmentAsset) {
    try {
      if (!input.selected) throw new Error("WORK_ORDER_NOT_SELECTED");
      const preview = await workOrderMutationController.issueAttachmentPreview(input.selected.workOrderId, attachment.id);
      const url = resolveMobileApiUrl(preview.previewUrl);
      if (!url) throw new Error("ATTACHMENT_PREVIEW_URL_INVALID");
      await Linking.openURL(url);
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "첨부파일을 열 수 없습니다.");
    }
  }

  async function setRepresentativeImage(image: WorkOrderImageAsset) {
    if (!input.detail || !input.selected || image.isRepresentative || !canEditWorkOrder(input.detail, input.user)) return;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(image.id);
    try {
      const result = await workOrderMutationController.setRepresentativeImage(input.selected.workOrderId, image.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("representative"),
      });
      await refreshProjection(input.selected.workOrderId, result.nextVersion);
      setMessage("대표이미지를 변경했습니다.");
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "대표이미지를 변경하지 못했습니다.");
    } finally {
      mutation.complete();
      setBusy(false);
      setBusyId(null);
    }
  }

  async function deleteImage(image: WorkOrderImageAsset) {
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(image.id);
    try {
      const result = await workOrderMutationController.deleteImage(input.selected.workOrderId, image.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("delete"),
      });
      await refreshProjection(input.selected.workOrderId, result.nextVersion);
      setMessage(image.isRepresentative ? "대표이미지를 삭제했습니다. 다른 이미지가 자동으로 대표 지정되지는 않습니다." : "이미지를 삭제했습니다.");
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "이미지를 삭제하지 못했습니다.");
    } finally {
      mutation.complete();
      setBusy(false);
      setBusyId(null);
    }
  }

  function requestDeleteImage(image: WorkOrderImageAsset) {
    if (busy) return;
    confirmWaflDestructiveAction({
      title: "이미지를 삭제할까요?",
      message: image.isRepresentative ? "대표이미지를 삭제하면 대표가 없는 상태로 돌아갑니다." : "삭제한 이미지는 복구할 수 없습니다.",
      onConfirm: () => void deleteImage(image),
    });
  }

  return {
    images,
    attachments,
    busy,
    busyId,
    isMutationInFlight: () => mutation.inFlight,
    hydrate,
    reset,
    acquireImage,
    acquireAttachment,
    requestDeleteAttachment,
    openAttachment,
    setRepresentativeImage,
    requestDeleteImage,
  } as const;
}
