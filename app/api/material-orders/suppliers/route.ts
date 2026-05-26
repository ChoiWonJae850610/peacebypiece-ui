import { NextRequest, NextResponse } from "next/server";

import {
  createWorkspacePermissionRequiredResponse,
  hasWorkspaceApiPermission,
  requireWorkspaceApiGuard,
} from "@/lib/auth/apiRouteGuards";
import { listWorkspaceMaterialOrderSuppliers } from "@/lib/material-orders/service";
import type { MaterialOrderLineItemType } from "@/lib/material-orders/types";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";

function readSupplierType(request: NextRequest): MaterialOrderLineItemType | null {
  const type = request.nextUrl.searchParams.get("type");
  if (type === "fabric" || type === "submaterial") return type;
  return null;
}

export async function GET(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  const permitted = await hasWorkspaceApiPermission(guard.session, MEMBER_PERMISSION_CODE.materialOrderRequest);
  if (!permitted) return createWorkspacePermissionRequiredResponse(MEMBER_PERMISSION_CODE.materialOrderRequest);

  try {
    return NextResponse.json(
      await listWorkspaceMaterialOrderSuppliers({
        companyId: guard.scope.companyId,
        type: readSupplierType(request),
      }),
    );
  } catch {
    return NextResponse.json({ suppliers: [], error: "MATERIAL_ORDER_SUPPLIERS_UNAVAILABLE" }, { status: 500 });
  }
}
