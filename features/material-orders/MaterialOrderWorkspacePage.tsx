"use client";

import MaterialOrderDraftEditor from "@/features/material-orders/MaterialOrderDraftEditor";
import { useWorkspaceSessionUser } from "@/lib/hooks/useWorkspaceSessionUser";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { isCompanyAdminSessionRole, isWaflSessionRole } from "@/lib/constants/sessionRoles";
import { normalizeSessionPermissionCodes } from "@/lib/workorder/sessionUserProfile";

type MaterialOrderWorkspacePageProps = {
  companyName: string;
  canRequestMaterialOrder: boolean;
  canPlaceMaterialOrder: boolean;
  isAdmin: boolean;
};

export default function MaterialOrderWorkspacePage({
  companyName,
  canRequestMaterialOrder: initialCanRequestMaterialOrder,
  canPlaceMaterialOrder: initialCanPlaceMaterialOrder,
  isAdmin: initialIsAdmin,
}: MaterialOrderWorkspacePageProps) {
  const sessionState = useWorkspaceSessionUser();
  const permissionCodes = normalizeSessionPermissionCodes(sessionState.user?.permissionCodes);
  const isAdmin = sessionState.isLoaded
    ? isWaflSessionRole(sessionState.user?.role) && isCompanyAdminSessionRole(sessionState.user.role)
    : initialIsAdmin;
  const canRequestMaterialOrder = sessionState.isLoaded
    ? isAdmin || permissionCodes.includes(MEMBER_PERMISSION_CODE.materialOrderRequest)
    : initialCanRequestMaterialOrder;
  const canPlaceMaterialOrder = sessionState.isLoaded
    ? isAdmin || permissionCodes.includes(MEMBER_PERMISSION_CODE.materialOrderPlace)
    : initialCanPlaceMaterialOrder;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MaterialOrderDraftEditor
        companyName={companyName}
        canRequestMaterialOrder={canRequestMaterialOrder}
        canPlaceMaterialOrder={canPlaceMaterialOrder}
        isAdmin={isAdmin}
      />
    </div>
  );
}
