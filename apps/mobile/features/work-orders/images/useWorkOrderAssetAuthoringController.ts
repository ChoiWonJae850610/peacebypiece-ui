import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createExplicitMutationController } from "@/application/mutationController";
import { useWorkOrderImageAuthoringActions } from "./workOrderImageAuthoringActions";
import { useWorkOrderAssetProjectionController } from "./useWorkOrderAssetProjectionController";
import { useWorkOrderAttachmentAuthoring } from "./useWorkOrderAttachmentAuthoring";
import type { WorkOrderAssetAuthoringInput, WorkOrderAssetAuthoringRuntime } from "./workOrderAssetAuthoringTypes";

/**
 * Public compatibility controller for the current Maker media flow.
 *
 * Internally, one mutation gate preserves the existing sequential
 * expectedVersion contract while image authoring, attachment authoring, and
 * combined projection/version reconciliation have separate bounded owners.
 */
export function useWorkOrderAssetAuthoringController(input: WorkOrderAssetAuthoringInput) {
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mutation] = useState(() => createExplicitMutationController());
  const latestInput = useRef(input);
  useEffect(() => { latestInput.current = input; }, [input]);

  const projection = useWorkOrderAssetProjectionController({ onDetailProjection: input.onDetailProjection });
  const getInput = useCallback(() => latestInput.current, []);
  const setMessage = useCallback((message: string) => { latestInput.current.onMessage(message); }, []);
  const runtime: WorkOrderAssetAuthoringRuntime = useMemo(() => ({
    mutation,
    getInput,
    projection,
    setBusy,
    setBusyId,
    setMessage,
  }), [getInput, mutation, projection, setMessage]);
  const imageAuthoring = useWorkOrderImageAuthoringActions(runtime);
  const attachmentAuthoring = useWorkOrderAttachmentAuthoring(runtime);
  const resetProjection = projection.reset;
  const resetAttachmentPreview = attachmentAuthoring.resetAttachmentPreview;

  const reset = useCallback(() => {
    resetProjection();
    setBusy(false);
    setBusyId(null);
    resetAttachmentPreview();
  }, [resetAttachmentPreview, resetProjection]);

  return {
    images: projection.images,
    attachments: projection.attachments,
    busy,
    busyId,
    attachmentPreview: attachmentAuthoring.attachmentPreview,
    isMutationInFlight: () => mutation.inFlight,
    hydrate: projection.hydrate,
    reset,
    ...imageAuthoring,
    acquireAttachment: attachmentAuthoring.acquireAttachment,
    setAttachmentOutputIncludes: attachmentAuthoring.setAttachmentOutputIncludes,
    requestDeleteAttachment: attachmentAuthoring.requestDeleteAttachment,
    openAttachment: attachmentAuthoring.openAttachment,
    closeAttachmentPreview: attachmentAuthoring.closeAttachmentPreview,
  } as const;
}
