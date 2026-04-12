"use client";

import { useMemo } from "react";
import { buildWorkOrderDerivedState } from "@/lib/hooks/workorder/derived/buildWorkOrderDerivedState";
import type { BuildWorkOrderDerivedStateParams } from "@/lib/hooks/workorder/derived/types";

export function useWorkOrderDerived({
  users,
  currentUser,
  currentUserId,
  permissionTargetUserId,
  workOrders,
  selectedWorkOrder,
  searchQuery,
  attachmentPreviewId,
}: BuildWorkOrderDerivedStateParams) {
  return useMemo(
    () => buildWorkOrderDerivedState({
      users,
      currentUser,
      currentUserId,
      permissionTargetUserId,
      workOrders,
      selectedWorkOrder,
      searchQuery,
      attachmentPreviewId,
    }),
    [
      users,
      currentUser,
      currentUserId,
      permissionTargetUserId,
      workOrders,
      selectedWorkOrder,
      searchQuery,
      attachmentPreviewId,
    ],
  );
}
