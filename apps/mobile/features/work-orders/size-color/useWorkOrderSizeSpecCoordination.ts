import { useCallback, type MutableRefObject } from "react";

import { MobileApiError, type MobileCurrentUser, type WorkOrderDetailCore } from "@/domain/mobileContract";
import { canEditWorkOrder } from "@/domain/workOrderPolicy";
import { workOrderQueryController } from "@/features/work-orders/workOrderQueryController";
import { readConsistentSizeColorBundle } from "./sizeColorQueryPolicy";
import { useSizeColorReadController } from "./useSizeColorReadController";
import { useSizeColorStructureEditController } from "./useSizeColorStructureEditController";

type Input = {
  readonly detail: WorkOrderDetailCore | null;
  readonly user: MobileCurrentUser | null;
  readonly selectedWorkOrderId: MutableRefObject<string | null>;
  readonly onDetailProjection: (detail: WorkOrderDetailCore) => void;
  readonly onTotalQuantityProjection: (totalQuantity: number, nextVersion: number) => void;
  readonly onVersionProjection: (nextVersion: number) => void;
  readonly onAuthenticationError: (error: MobileApiError) => void;
};

export function useWorkOrderSizeSpecCoordination(input: Input) {
  const read = useSizeColorReadController({
    workOrderId: input.detail?.header.id ?? null,
    entityVersion: input.detail?.header.entityVersion ?? null,
    selectedWorkOrderId: input.selectedWorkOrderId,
    onAuthenticationError: input.onAuthenticationError,
  });

  const refresh = useCallback(async (expectedVersion?: number) => {
    const workOrderId = input.selectedWorkOrderId.current;
    if (!workOrderId) return;
    const refreshed = await workOrderQueryController.detail(workOrderId);
    if (expectedVersion !== undefined && refreshed.header.entityVersion !== expectedVersion) {
      throw new MobileApiError({ code: "CONFLICT", message: "저장된 사이즈·색상 버전을 확인하지 못했습니다." });
    }
    const bundle = await readConsistentSizeColorBundle({
      workOrderId,
      expectedEntityVersion: refreshed.header.entityVersion,
      readMatrix: () => workOrderQueryController.sizeColor(workOrderId),
      readSpecifications: () => workOrderQueryController.sizeSpec(workOrderId),
    });
    if (input.selectedWorkOrderId.current !== workOrderId) return;
    input.onDetailProjection(refreshed);
    read.reconcileMutation(() => bundle, refreshed.header.entityVersion);
    return { bundle, entityVersion: refreshed.header.entityVersion };
  }, [input, read]);

  const refreshSizeSpec = useCallback(async (expectedVersion: number) => {
    const workOrderId = input.selectedWorkOrderId.current;
    if (!workOrderId) return;
    const specifications = await workOrderQueryController.sizeSpec(workOrderId);
    if (specifications.entityVersion !== expectedVersion) {
      throw new MobileApiError({ code: "CONFLICT", message: "저장된 완성 스펙 버전을 확인하지 못했습니다." });
    }
    if (input.selectedWorkOrderId.current !== workOrderId) return;
    read.reconcileMutation((bundle) => ({ ...bundle, specifications }), expectedVersion);
  }, [input.selectedWorkOrderId, read]);

  const edit = useSizeColorStructureEditController({
    workOrderId: input.detail?.header.id ?? null,
    entityVersion: input.detail?.header.entityVersion ?? null,
    canEdit: canEditWorkOrder(input.detail, input.user),
    bundle: read.boundary.state.bundle,
    onReconcile: read.reconcileMutation,
    onTotalQuantityReconcile: input.onTotalQuantityProjection,
    onVersionReconcile: input.onVersionProjection,
    onPromoteProjectionVersion: read.promoteCurrentProjectionVersion,
    onRefreshSizeSpec: refreshSizeSpec,
    onConflict: async () => { await refresh(); },
    onRefreshLatest: refresh,
    onAuthenticationError: input.onAuthenticationError,
  });

  return {
    boundary: read.boundary,
    editBoundary: edit.boundary,
    resetSession: read.resetSession,
  };
}
