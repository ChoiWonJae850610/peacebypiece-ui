import type { WorkOrderImageAsset, WorkOrderImageCommandResult } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { completeImageWithSingleConflictRebase } from "@/domain/workOrderImageCompletionPolicy";
import { canEditWorkOrder } from "@/domain/workOrderPolicy";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import { workOrderMutationController } from "../workOrderMutationController";
import { workOrderQueryController } from "../workOrderQueryController";
import {
  acquireWorkOrderImage,
  prepareAcquiredImageForUpload,
  type WorkOrderImageAcquisitionSource,
} from "./workOrderImageAcquisition";
import type { WorkOrderAssetAuthoringRuntime, WorkOrderAssetRequestIdentity } from "./workOrderAssetAuthoringTypes";

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

export function useWorkOrderImageAuthoringActions(runtime: WorkOrderAssetAuthoringRuntime) {
  async function acquireImage(source: WorkOrderImageAcquisitionSource) {
    const started = runtime.getInput();
    if (!started.detail || !started.selected || !canEditWorkOrder(started.detail, started.user)) return;
    const workOrderId = started.selected.workOrderId;
    if (runtime.mutation.tryBegin() !== "started") return;
    runtime.setBusy(true);
    runtime.setBusyId(null);
    let failureStage: ImageUploadStage = "acquire";
    try {
      const acquired = await acquireWorkOrderImage(source);
      if (acquired.status === "cancelled") return;
      if (acquired.status === "denied") return runtime.setMessage(acquired.message);
      const currentAfterAcquire = runtime.getInput();
      if (currentAfterAcquire.selected?.workOrderId !== workOrderId || currentAfterAcquire.detail?.header.id !== workOrderId) return;
      if (runtime.projection.getImages().length >= 20) return runtime.setMessage("레시피 이미지는 최대 20장까지 등록할 수 있습니다.");
      failureStage = "local-read";
      const localResponse = await fetch(acquired.asset.uri);
      if (!localResponse.ok) throw new Error("LOCAL_IMAGE_READ_FAILED");
      const originalBlob = await localResponse.blob();
      failureStage = "prepare";
      const { blob, file } = await prepareAcquiredImageForUpload(acquired.asset, originalBlob);
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) return runtime.setMessage("JPG, PNG, WEBP 이미지만 등록할 수 있습니다.");
      if (file.size <= 0 || file.size > 10 * 1024 * 1024) return runtime.setMessage("이미지는 1장당 10MB 이하만 등록할 수 있습니다.");
      failureStage = "prepare-command";
      const uploadTarget = await workOrderMutationController.prepareImageUpload(workOrderId, file);
      failureStage = "r2-put";
      await workOrderMutationController.putImageBlob(uploadTarget, blob);
      failureStage = "save-barrier";
      const beforeAssetMutation = runtime.getInput().beforeAssetMutation;
      const barrierDetail = await beforeAssetMutation?.(workOrderId);
      if (beforeAssetMutation && !barrierDetail) {
        throw new MobileApiError({ code: "CONFLICT", message: "이미지 등록 전에 최신 레시피 이름을 저장하지 못했습니다." });
      }
      const currentBeforeComplete = runtime.getInput();
      if (currentBeforeComplete.selected?.workOrderId !== workOrderId || currentBeforeComplete.detail?.header.id !== workOrderId) return;
      const uploadIdentity = currentBeforeComplete.nextIdentity("upload");
      const completeInput = {
        expectedVersion: barrierDetail?.header.id === workOrderId
          ? barrierDetail.header.entityVersion
          : currentBeforeComplete.detail?.header.id === workOrderId
            ? currentBeforeComplete.detail.header.entityVersion
            : started.detail.header.entityVersion,
        ...uploadIdentity,
        uploadTarget,
      };
      failureStage = "complete-reconcile";
      async function completeAndReconcile(
        commandInput: typeof completeInput,
        identity: WorkOrderAssetRequestIdentity,
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
      let conflictAssets: Awaited<ReturnType<typeof workOrderQueryController.images>> | null = null;
      const completion = await completeImageWithSingleConflictRebase({
        initialDetail: barrierDetail ?? currentBeforeComplete.detail ?? started.detail,
        isConflict: (error) => error instanceof MobileApiError && error.code === "CONFLICT",
        refresh: async () => {
          const refreshedDetail = await workOrderQueryController.detail(workOrderId);
          conflictAssets = await workOrderQueryController.images(workOrderId);
          return refreshedDetail;
        },
        canRetry: (initial, refreshedDetail) => {
          const current = runtime.getInput();
          return current.selected?.workOrderId === workOrderId
            && current.detail?.header.id === workOrderId
            && refreshedDetail.header.status === "draft"
            && refreshedDetail.header.currentRevisionId === initial.header.currentRevisionId
            && canEditWorkOrder(refreshedDetail, current.user);
        },
        complete: async (completionDetail, retry) => {
          if (!retry) return completeAndReconcile(completeInput, uploadIdentity);
          const current = runtime.getInput();
          current.onDetailProjection(completionDetail);
          if (conflictAssets) runtime.projection.hydrate(conflictAssets.items, conflictAssets.attachments);
          const retryIdentity = current.nextIdentity("upload");
          return completeAndReconcile({
            expectedVersion: completionDetail.header.entityVersion,
            ...retryIdentity,
            uploadTarget,
          }, retryIdentity);
        },
      });
      if (runtime.getInput().selected?.workOrderId !== workOrderId) return;
      failureStage = "projection";
      await runtime.projection.refreshProjection(workOrderId, completion.result.nextVersion);
      runtime.setMessage(completion.result.isRepresentative ? "첫 이미지를 등록하고 대표이미지로 지정했습니다." : "이미지를 등록했습니다. 기존 대표이미지는 유지됩니다.");
    } catch (error) {
      const stage = imageUploadFailureStage(failureStage, error);
      if (process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
        console.info("[WAFL_IMAGE_UPLOAD_FAILED]", { source, stage, errorName: error instanceof Error ? error.name : "UnknownError" });
      }
      runtime.setMessage(error instanceof MobileApiError ? error.message : imageUploadFailureMessage(stage));
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  async function setRepresentativeImage(image: WorkOrderImageAsset) {
    const input = runtime.getInput();
    if (!input.detail || !input.selected || image.isRepresentative || !canEditWorkOrder(input.detail, input.user)) return;
    if (runtime.mutation.tryBegin() !== "started") return;
    runtime.setBusy(true);
    runtime.setBusyId(image.id);
    try {
      const result = await workOrderMutationController.setRepresentativeImage(input.selected.workOrderId, image.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("representative"),
      });
      await runtime.projection.refreshProjection(input.selected.workOrderId, result.nextVersion);
      runtime.setMessage("대표이미지를 변경했습니다.");
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "대표이미지를 변경하지 못했습니다.");
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  async function setImageOutputInclude(image: WorkOrderImageAsset, includeInDocument: boolean) {
    const input = runtime.getInput();
    if (!input.detail || !input.selected || image.isRepresentative || !canEditWorkOrder(input.detail, input.user)) return;
    if (runtime.mutation.tryBegin() !== "started") return;
    runtime.setBusy(true);
    runtime.setBusyId(image.id);
    try {
      const result = await workOrderMutationController.setImageOutputInclude(input.selected.workOrderId, image.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("image-output"),
        includeInDocument,
      });
      await runtime.projection.refreshProjection(input.selected.workOrderId, result.nextVersion);
      runtime.setMessage(includeInDocument ? "이미지를 작업지시서에 포함했습니다." : "이미지를 작업지시서에서 제외했습니다.");
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "이미지 출력 설정을 변경하지 못했습니다.");
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  async function deleteImage(image: WorkOrderImageAsset) {
    const input = runtime.getInput();
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (runtime.mutation.tryBegin() !== "started") return;
    runtime.setBusy(true);
    runtime.setBusyId(image.id);
    try {
      const result = await workOrderMutationController.deleteImage(input.selected.workOrderId, image.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("delete"),
      });
      await runtime.projection.refreshProjection(input.selected.workOrderId, result.nextVersion);
      runtime.setMessage(image.isRepresentative ? "대표이미지를 삭제했습니다. 다른 이미지가 자동으로 대표 지정되지는 않습니다." : "이미지를 삭제했습니다.");
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "이미지를 삭제하지 못했습니다.");
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  function requestDeleteImage(image: WorkOrderImageAsset) {
    if (runtime.mutation.inFlight) return;
    confirmWaflDestructiveAction({
      title: "이미지를 삭제할까요?",
      message: image.isRepresentative ? "대표이미지를 삭제하면 대표가 없는 상태로 돌아갑니다." : "삭제한 이미지는 복구할 수 없습니다.",
      onConfirm: () => void deleteImage(image),
    });
  }

  return { acquireImage, setRepresentativeImage, setImageOutputInclude, requestDeleteImage } as const;
}
