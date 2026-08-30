import { useCallback, useState } from "react";

import type { WorkOrderAttachmentAsset } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { applyVersionedAttachmentOutputSelection } from "@/domain/workOrderAttachmentSelectionPolicy";
import { canEditWorkOrder } from "@/domain/workOrderPolicy";
import { confirmWaflDestructiveAction } from "@/features/feedback/confirmWaflDestructiveAction";
import { resolveMobileApiUrl } from "@/lib/apiTransport";
import { workOrderMutationController } from "../workOrderMutationController";
import { acquireWorkOrderAttachment } from "./workOrderAttachmentAcquisition";
import type { WorkOrderAssetAuthoringRuntime } from "./workOrderAssetAuthoringTypes";

export function useWorkOrderAttachmentAuthoring(runtime: WorkOrderAssetAuthoringRuntime) {
  const [attachmentPreview, setAttachmentPreview] = useState<{ readonly attachment: WorkOrderAttachmentAsset; readonly url: string } | null>(null);
  const closeAttachmentPreview = useCallback(() => { setAttachmentPreview(null); }, []);

  async function acquireAttachment() {
    const input = runtime.getInput();
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (runtime.mutation.tryBegin() !== "started") return;
    runtime.setBusy(true);
    runtime.setBusyId(null);
    try {
      if (runtime.projection.getImages().length + runtime.projection.getAttachments().length >= 20) {
        return runtime.setMessage("이미지와 첨부는 합쳐 최대 20개까지 등록할 수 있습니다.");
      }
      const acquired = await acquireWorkOrderAttachment();
      if (acquired.status === "cancelled") return;
      if (acquired.status === "invalid") return runtime.setMessage(acquired.message);
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
      await runtime.projection.refreshProjection(input.selected.workOrderId, result.nextVersion);
      runtime.setMessage("첨부파일을 등록했습니다.");
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "첨부파일을 등록하지 못했습니다.");
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  async function deleteAttachment(attachment: WorkOrderAttachmentAsset) {
    const input = runtime.getInput();
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return;
    if (runtime.mutation.tryBegin() !== "started") return;
    runtime.setBusy(true);
    runtime.setBusyId(attachment.id);
    try {
      const result = await workOrderMutationController.deleteAttachment(input.selected.workOrderId, attachment.id, {
        expectedVersion: input.detail.header.entityVersion,
        ...input.nextIdentity("attachment-delete"),
      });
      await runtime.projection.refreshProjection(input.selected.workOrderId, result.nextVersion);
      runtime.setMessage("첨부파일을 삭제했습니다.");
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "첨부파일을 삭제하지 못했습니다.");
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  async function setAttachmentOutputIncludes(changes: readonly { readonly attachmentId: string; readonly includeInDocument: boolean }[]) {
    const input = runtime.getInput();
    if (!input.detail || !input.selected || !canEditWorkOrder(input.detail, input.user)) return false;
    if (changes.length === 0) return true;
    if (runtime.mutation.tryBegin() !== "started") return false;
    const workOrderId = input.selected.workOrderId;
    runtime.setBusy(true);
    runtime.setBusyId(null);
    try {
      const result = await applyVersionedAttachmentOutputSelection({
        initialVersion: input.detail.header.entityVersion,
        changes,
        execute: async (change, expectedVersion) => {
          const identity = runtime.getInput().nextIdentity("attachment-output");
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
          if (authoritativeVersion === null) await runtime.projection.refreshLatestProjection(workOrderId);
          else await runtime.projection.refreshProjection(workOrderId, authoritativeVersion);
        },
      });
      if (!result.ok) throw result.error;
      runtime.setMessage("문서에 포함할 첨부를 저장했습니다.");
      return true;
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "첨부 출력 설정을 모두 저장하지 못했습니다. 최신 선택을 확인해 주세요.");
      return false;
    } finally {
      runtime.mutation.complete();
      runtime.setBusy(false);
      runtime.setBusyId(null);
    }
  }

  function requestDeleteAttachment(attachment: WorkOrderAttachmentAsset) {
    if (runtime.mutation.inFlight) return;
    confirmWaflDestructiveAction({ title: "첨부파일을 삭제할까요?", message: attachment.filename, onConfirm: () => void deleteAttachment(attachment) });
  }

  async function openAttachment(attachment: WorkOrderAttachmentAsset) {
    try {
      const input = runtime.getInput();
      if (!input.selected) throw new Error("WORK_ORDER_NOT_SELECTED");
      const preview = await workOrderMutationController.issueAttachmentPreview(input.selected.workOrderId, attachment.id);
      const url = resolveMobileApiUrl(preview.previewUrl);
      if (!url) throw new Error("ATTACHMENT_PREVIEW_URL_INVALID");
      setAttachmentPreview({ attachment, url });
    } catch (error) {
      runtime.setMessage(error instanceof MobileApiError ? error.message : "첨부파일을 열 수 없습니다.");
    }
  }

  return {
    attachmentPreview,
    acquireAttachment,
    setAttachmentOutputIncludes,
    requestDeleteAttachment,
    openAttachment,
    closeAttachmentPreview,
    resetAttachmentPreview: closeAttachmentPreview,
  } as const;
}
