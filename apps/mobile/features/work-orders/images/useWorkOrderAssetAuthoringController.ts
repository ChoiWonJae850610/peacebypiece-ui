import { useCallback, useEffect, useRef, useState } from "react";

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
import { applyVersionedAttachmentOutputSelection } from "@/domain/workOrderAttachmentSelectionPolicy";
import { canEditWorkOrder } from "@/domain/workOrderPolicy";
import { completeImageWithSingleConflictRebase } from "@/domain/workOrderImageCompletionPolicy";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { workOrderMutationController } from "../workOrderMutationController";
import { workOrderQueryController } from "../workOrderQueryController";
import { acquireWorkOrderAttachment } from "./workOrderAttachmentAcquisition";
import {
  acquireWorkOrderImage,
  prepareAcquiredImageForUpload,
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
  readonly nextIdentity: (kind: "upload" | "representative" | "delete" | "image-output" | "attachment-upload" | "attachment-delete" | "attachment-output") => RequestIdentity;
  readonly beforeAssetMutation?: (workOrderId: string) => Promise<WorkOrderDetailCore | null>;
  readonly onDetailProjection: (detail: WorkOrderDetailCore) => void;
  readonly onMessage: (message: string) => void;
};

const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

function isAmbiguousUploadCompletion(error: unknown): boolean {
  return error instanceof MobileApiError && (error.code === "TIMEOUT" || error.code === "NETWORK_ERROR");
}

type ImageUploadStage = "acquire" | "local-read" | "prepare" | "prepare-command" | "r2-put" | "save-barrier" | "complete-reconcile" | "projection";

function imageUploadFailureStage(stage: ImageUploadStage, error: unknown): ImageUploadStage | "heic-convert" {
  const code = error instanceof Error ? error.message : "";
  return code.startsWith("HEIC_JPEG_") ? "heic-convert" : stage;
}

function imageUploadFailureMessage(stage: ImageUploadStage | "heic-convert") {
  if (stage === "local-read" || stage === "prepare" || stage === "heic-convert") return "이미지를 준비하지 못했습니다. 다시 선택해 주세요.";
  if (stage === "prepare-command" || stage === "r2-put") return "이미지를 전송하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.";
  if (stage === "save-barrier") return "이미지 등록 전에 최신 레시피 이름을 저장하지 못했습니다.";
  if (stage === "complete-reconcile" || stage === "projection") return "이미지 등록 결과를 확인하지 못했습니다. 이미지 목록을 새로고침해 주세요.";
  return "이미지를 등록하지 못했습니다. 다시 시도해 주세요.";
}

export function useWorkOrderAssetAuthoringController(input: Input) {
  const [images, setImages] = useState<readonly WorkOrderImageAsset[]>([]);
  const [attachments, setAttachments] = useState<readonly WorkOrderAttachmentAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{ readonly attachment: WorkOrderAttachmentAsset; readonly url: string } | null>(null);
  const mutation = useRef(createExplicitMutationController()).current;
  const latestInput = useRef(input);
  useEffect(() => { latestInput.current = input; }, [input]);

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
    setAttachmentPreview(null);
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

  async function refreshLatestProjection(workOrderId: string) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const [refreshedDetail, refreshedImages] = await Promise.all([
        workOrderQueryController.detail(workOrderId),
        workOrderQueryController.images(workOrderId),
      ]);
      if (refreshedDetail.header.entityVersion !== refreshedImages.entityVersion) continue;
      latestInput.current.onDetailProjection(refreshedDetail);
      hydrate(refreshedImages.items, refreshedImages.attachments);
      return;
    }
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 선택 후 최신 버전을 확인하지 못했습니다." });
  }

  async function acquireImage(source: WorkOrderImageAcquisitionSource) {
    const started = latestInput.current;
    if (!started.detail || !started.selected || !canEditWorkOrder(started.detail, started.user)) return;
    const workOrderId = started.selected.workOrderId;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(null);
    let failureStage: ImageUploadStage = "acquire";
    try {
      const acquired = await acquireWorkOrderImage(source);
      if (acquired.status === "cancelled") return;
      if (acquired.status === "denied") return setMessage(acquired.message);
      if (latestInput.current.selected?.workOrderId !== workOrderId || latestInput.current.detail?.header.id !== workOrderId) return;
      if (images.length >= 20) return setMessage("레시피 이미지는 최대 20장까지 등록할 수 있습니다.");
      failureStage = "local-read";
      const localResponse = await fetch(acquired.asset.uri);
      if (!localResponse.ok) throw new Error("LOCAL_IMAGE_READ_FAILED");
      const originalBlob = await localResponse.blob();
      failureStage = "prepare";
      const normalized = await prepareAcquiredImageForUpload(acquired.asset, originalBlob);
      const { blob, file } = normalized;
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) return setMessage("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) return setMessage("이미지는 1장당 10MB 이하만 등록할 수 있습니다.");
      failureStage = "prepare-command";
      const uploadTarget = await workOrderMutationController.prepareImageUpload(workOrderId, file);
      failureStage = "r2-put";
      await workOrderMutationController.putImageBlob(uploadTarget, blob);
      failureStage = "save-barrier";
      const barrierDetail = await latestInput.current.beforeAssetMutation?.(workOrderId);
      if (latestInput.current.beforeAssetMutation && !barrierDetail) {
        throw new MobileApiError({ code: "CONFLICT", message: "이미지 등록 전에 최신 레시피 이름을 저장하지 못했습니다." });
      }
      if (latestInput.current.selected?.workOrderId !== workOrderId || latestInput.current.detail?.header.id !== workOrderId) return;
      const uploadIdentity = input.nextIdentity("upload");
      const completeInput = {
        expectedVersion: barrierDetail?.header.id === workOrderId
          ? barrierDetail.header.entityVersion
          : latestInput.current.detail?.header.id === workOrderId
            ? latestInput.current.detail.header.entityVersion
          : started.detail.header.entityVersion,
        ...uploadIdentity,
        uploadTarget,
      };
      failureStage = "complete-reconcile";
      async function completeAndReconcile(
        commandInput: typeof completeInput,
        identity: RequestIdentity,
      ): Promise<WorkOrderImageCommandResult> {
        try {
          return await workOrderMutationController.completeImageUpload(workOrderId, commandInput);
        } catch (error) {
          if (!isAmbiguousUploadCompletion(error)) throw error;
          let reconciled: WorkOrderImageCommandResult | null = null;
          for (let attempt = 0; attempt < 9 && !reconciled; attempt += 1) {
            await wait(attempt === 0 ? 1_200 : 4_000);
            try {
              reconciled = await workOrderMutationController.reconcileImageUpload(workOrderId, identity);
            } catch (reconcileError) {
              if (!isAmbiguousUploadCompletion(reconcileError)) throw reconcileError;
            }
          }
          if (!reconciled) {
            throw new MobileApiError({ code: "TIMEOUT", message: "이미지 등록 결과를 아직 확인하지 못했습니다. 잠시 후 이미지 목록을 다시 확인해 주세요." });
          }
          return reconciled;
        }
      }
      let conflictImages: Awaited<ReturnType<typeof workOrderQueryController.images>> | null = null;
      const completion = await completeImageWithSingleConflictRebase({
        initialDetail: barrierDetail ?? latestInput.current.detail ?? started.detail,
        isConflict: (error) => error instanceof MobileApiError && error.code === "CONFLICT",
        refresh: async () => {
          const refreshedDetail = await workOrderQueryController.detail(workOrderId);
          conflictImages = await workOrderQueryController.images(workOrderId);
          return refreshedDetail;
        },
        canRetry: (initial, refreshedDetail) => {
          const current = latestInput.current;
          return current.selected?.workOrderId === workOrderId
            && current.detail?.header.id === workOrderId
            && refreshedDetail.header.status === "draft"
            && refreshedDetail.header.currentRevisionId === initial.header.currentRevisionId
            && canEditWorkOrder(refreshedDetail, current.user);
        },
        complete: async (completionDetail, retry) => {
          if (!retry) return completeAndReconcile(completeInput, uploadIdentity);
          const current = latestInput.current;
          current.onDetailProjection(completionDetail);
          if (conflictImages) hydrate(conflictImages.items, conflictImages.attachments);
          const retryIdentity = latestInput.current.nextIdentity("upload");
          return completeAndReconcile({
            expectedVersion: completionDetail.header.entityVersion,
            ...retryIdentity,
            uploadTarget,
          }, retryIdentity);
        },
      });
      const result = completion.result;
      if (latestInput.current.selected?.workOrderId !== workOrderId) return;
      failureStage = "projection";
      await refreshProjection(workOrderId, result.nextVersion);
      setMessage(result.isRepresentative ? "첫 이미지를 등록하고 대표이미지로 지정했습니다." : "이미지를 등록했습니다. 기존 대표이미지는 유지됩니다.");
    } catch (error) {
      const stage = imageUploadFailureStage(failureStage, error);
      if (process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
        console.info("[WAFL_IMAGE_UPLOAD_FAILED]", {
          source,
          stage,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }
      setMessage(error instanceof MobileApiError ? error.message : imageUploadFailureMessage(stage));
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

  async function setAttachmentOutputIncludes(changes: readonly { readonly attachmentId: string; readonly includeInDocument: boolean }[]) {
    const started = latestInput.current;
    if (!started.detail || !started.selected || !canEditWorkOrder(started.detail, started.user)) return false;
    if (changes.length === 0) return true;
    if (mutation.tryBegin() !== "started") return false;
    const workOrderId = started.selected.workOrderId;
    setBusy(true);
    setBusyId(null);
    try {
      const result = await applyVersionedAttachmentOutputSelection({
        initialVersion: started.detail.header.entityVersion,
        changes,
        execute: async (change, expectedVersion) => {
          const identity = latestInput.current.nextIdentity("attachment-output");
          const response = await workOrderMutationController.setAttachmentOutputInclude({
            workOrderId,
            attachmentId: change.attachmentId,
            expectedVersion,
            includeInDocument: change.includeInDocument,
            clientRequestId: identity.clientRequestId,
          });
          if (!response.ok || !Number.isSafeInteger(response.data?.nextVersion)) {
            throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 선택 응답이 올바르지 않습니다." });
          }
          return response.data.nextVersion;
        },
        reconcile: async (authoritativeVersion) => {
          if (authoritativeVersion === null) await refreshLatestProjection(workOrderId);
          else await refreshProjection(workOrderId, authoritativeVersion);
        },
      });
      if (!result.ok) throw result.error;
      setMessage("문서에 포함할 첨부를 저장했습니다.");
      return true;
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "첨부 출력 설정을 모두 저장하지 못했습니다. 최신 선택을 확인해 주세요.");
      return false;
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
      setAttachmentPreview({ attachment, url });
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

  async function setImageOutputInclude(image: WorkOrderImageAsset, includeInDocument: boolean) {
    if (!input.detail || !input.selected || image.isRepresentative || !canEditWorkOrder(input.detail, input.user)) return;
    if (mutation.tryBegin() !== "started") return;
    setBusy(true);
    setBusyId(image.id);
    try {
      const result = await workOrderMutationController.setImageOutputInclude(input.selected.workOrderId, image.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("image-output"),
        includeInDocument,
      });
      await refreshProjection(input.selected.workOrderId, result.nextVersion);
      setMessage(includeInDocument ? "이미지를 작업지시서에 포함했습니다." : "이미지를 작업지시서에서 제외했습니다.");
    } catch (error) {
      setMessage(error instanceof MobileApiError ? error.message : "이미지 출력 설정을 변경하지 못했습니다.");
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
    attachmentPreview,
    isMutationInFlight: () => mutation.inFlight,
    hydrate,
    reset,
    acquireImage,
    acquireAttachment,
    setAttachmentOutputIncludes,
    requestDeleteAttachment,
    openAttachment,
    closeAttachmentPreview: () => setAttachmentPreview(null),
    setRepresentativeImage,
    setImageOutputInclude,
    requestDeleteImage,
  } as const;
}
