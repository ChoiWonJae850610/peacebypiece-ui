import { useCallback, useEffect, useRef, useState } from "react";

import type { WorkOrderAttachmentAsset, WorkOrderDetailCore, WorkOrderImageAsset } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { workOrderQueryController } from "../workOrderQueryController";
import type { WorkOrderAssetProjectionController } from "./workOrderAssetAuthoringTypes";

type Input = {
  readonly onDetailProjection: (detail: WorkOrderDetailCore) => void;
};

/**
 * Shared projection/version owner for both image and attachment authoring.
 * Every successful command converges detail and the combined asset page at
 * the same entityVersion before publishing either projection.
 */
export function useWorkOrderAssetProjectionController(input: Input): WorkOrderAssetProjectionController {
  const [images, setImages] = useState<readonly WorkOrderImageAsset[]>([]);
  const [attachments, setAttachments] = useState<readonly WorkOrderAttachmentAsset[]>([]);
  const imagesRef = useRef(images);
  const attachmentsRef = useRef(attachments);
  const latestInput = useRef(input);
  useEffect(() => { latestInput.current = input; }, [input]);

  const hydrate = useCallback((nextImages: readonly WorkOrderImageAsset[], nextAttachments: readonly WorkOrderAttachmentAsset[]) => {
    imagesRef.current = nextImages;
    attachmentsRef.current = nextAttachments;
    setImages(nextImages);
    setAttachments(nextAttachments);
  }, []);

  const reset = useCallback(() => { hydrate([], []); }, [hydrate]);

  const refreshProjection = useCallback(async (workOrderId: string, expectedVersion: number) => {
    const [refreshedDetail, refreshedAssets] = await Promise.all([
      workOrderQueryController.detail(workOrderId),
      workOrderQueryController.images(workOrderId),
    ]);
    if (refreshedDetail.header.entityVersion !== expectedVersion || refreshedAssets.entityVersion !== expectedVersion) {
      throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 변경 후 최신 버전을 확인하지 못했습니다." });
    }
    latestInput.current.onDetailProjection(refreshedDetail);
    hydrate(refreshedAssets.items, refreshedAssets.attachments);
  }, [hydrate]);

  const refreshLatestProjection = useCallback(async (workOrderId: string) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const [refreshedDetail, refreshedAssets] = await Promise.all([
        workOrderQueryController.detail(workOrderId),
        workOrderQueryController.images(workOrderId),
      ]);
      if (refreshedDetail.header.entityVersion !== refreshedAssets.entityVersion) continue;
      latestInput.current.onDetailProjection(refreshedDetail);
      hydrate(refreshedAssets.items, refreshedAssets.attachments);
      return;
    }
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 선택 후 최신 버전을 확인하지 못했습니다." });
  }, [hydrate]);

  return {
    images,
    attachments,
    getImages: () => imagesRef.current,
    getAttachments: () => attachmentsRef.current,
    hydrate,
    reset,
    refreshProjection,
    refreshLatestProjection,
  };
}
