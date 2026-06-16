import { NextRequest } from "next/server";

import {
  createWorkspacePermissionRequiredResponse,
  hasWorkspaceApiPermission,
  requireWorkspaceApiGuard,
} from "@/lib/auth/apiRouteGuards";
import type { WaflSessionPayload } from "@/lib/auth/session";
import {
  createWaflApiError,
  createWaflApiSuccess,
  createWaflUnhandledApiError,
  readWaflJsonBody,
} from "@/lib/api/waflApiServer";
import { isCompanyAdminSessionRole } from "@/lib/constants/sessionRoles";
import { getMaterialOrderById } from "@/lib/material-orders/repository";
import { isAllowedMaterialOrderTransition } from "@/lib/material-orders/serverPolicy";
import {
  isMaterialOrderStatus,
  normalizeMaterialOrderLineItemType,
  normalizeMaterialOrderLines,
  normalizeMaterialOrderOptionalText,
  type MaterialOrderRequestBody,
} from "@/lib/material-orders/requestNormalization";
import {
  createWorkspaceMaterialOrder,
  listWorkspaceMaterialOrders,
  updateWorkspaceMaterialOrderDetail,
  updateWorkspaceMaterialOrderHeader,
  updateWorkspaceMaterialOrderStatus,
} from "@/lib/material-orders/service";
import {
  MATERIAL_ORDER_STATUS,
  type MaterialOrderLineInput,
  type MaterialOrderStatus,
} from "@/lib/material-orders/types";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";

function readSearchStatus(request: NextRequest): MaterialOrderStatus | null {
  const status = request.nextUrl.searchParams.get("status");
  return isMaterialOrderStatus(status) ? status : null;
}

function resolveStatusPermission(status: MaterialOrderStatus) {
  if (status === MATERIAL_ORDER_STATUS.reviewRequested || status === MATERIAL_ORDER_STATUS.draft || status === MATERIAL_ORDER_STATUS.cancelled) {
    return MEMBER_PERMISSION_CODE.materialOrderRequest;
  }

  return MEMBER_PERMISSION_CODE.materialOrderPlace;
}

async function requireMaterialOrderStatusPermission(
  session: WaflSessionPayload,
  status: MaterialOrderStatus,
) {
  const permissionCode = resolveStatusPermission(status);
  const permitted = await hasWorkspaceApiPermission(session, permissionCode);

  return permitted
    ? null
    : createWorkspacePermissionRequiredResponse(permissionCode);
}

export async function GET(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  try {
    const result = await listWorkspaceMaterialOrders({
      companyId: guard.scope.companyId,
      status: readSearchStatus(request),
      visibility: guard.scope.visibility,
    });
    return createWaflApiSuccess(result);
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "발주서 목록을 불러오지 못했습니다.",
      "MATERIAL_ORDER_LIST_UNAVAILABLE",
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  const bodyResult = await readWaflJsonBody<MaterialOrderRequestBody>(request);
  if (!bodyResult.ok) return bodyResult.response;

  try {
    const body = bodyResult.data;
    const status = isMaterialOrderStatus(body.status) ? body.status : MATERIAL_ORDER_STATUS.draft;

    const permissionDenied = await requireMaterialOrderStatusPermission(guard.session, status);
    if (permissionDenied) return permissionDenied;

    const result = await createWorkspaceMaterialOrder({
      companyId: guard.scope.companyId,
      visibility: guard.scope.visibility,
      supplierPartnerId: normalizeMaterialOrderOptionalText(body.supplierPartnerId),
      requestedByUserId: guard.session.userId,
      status,
      note: normalizeMaterialOrderOptionalText(body.note),
      dueDate: normalizeMaterialOrderOptionalText(body.dueDate),
      lines: normalizeMaterialOrderLines(body.lines),
    });
    return createWaflApiSuccess(result);
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "새 발주서를 만들지 못했습니다.",
      "MATERIAL_ORDER_CREATE_FAILED",
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  const bodyResult = await readWaflJsonBody<MaterialOrderRequestBody>(request);
  if (!bodyResult.ok) return bodyResult.response;

  try {
    const body = bodyResult.data;
    const materialOrderId = normalizeMaterialOrderOptionalText(body.materialOrderId);

    if (!materialOrderId) {
      return createWaflApiError(
        "발주서 식별값을 확인해주세요.",
        "MATERIAL_ORDER_DETAIL_PAYLOAD_REQUIRED",
        400,
      );
    }

    const permitted = await hasWorkspaceApiPermission(
      guard.session,
      MEMBER_PERMISSION_CODE.materialOrderRequest,
    );
    if (!permitted) {
      return createWorkspacePermissionRequiredResponse(MEMBER_PERMISSION_CODE.materialOrderRequest);
    }

    if (body.updateMode === "header") {
      const headerInput: {
        companyId: string;
        visibility: typeof guard.scope.visibility;
        materialOrderId: string;
        isAdmin: boolean;
        materialType?: MaterialOrderLineInput["itemType"] | null;
        supplierPartnerId?: string | null;
        dueDate?: string | null;
      } = {
        companyId: guard.scope.companyId,
        visibility: guard.scope.visibility,
        materialOrderId,
        isAdmin: isCompanyAdminSessionRole(guard.session.role),
      };

      if (Object.prototype.hasOwnProperty.call(body, "materialType")) {
        headerInput.materialType = normalizeMaterialOrderLineItemType(body.materialType);
      }
      if (Object.prototype.hasOwnProperty.call(body, "supplierPartnerId")) {
        headerInput.supplierPartnerId = normalizeMaterialOrderOptionalText(body.supplierPartnerId);
      }
      if (Object.prototype.hasOwnProperty.call(body, "dueDate")) {
        headerInput.dueDate = normalizeMaterialOrderOptionalText(body.dueDate);
      }

      const result = await updateWorkspaceMaterialOrderHeader(headerInput);
      return createWaflApiSuccess(result);
    }

    const result = await updateWorkspaceMaterialOrderDetail({
      companyId: guard.scope.companyId,
      visibility: guard.scope.visibility,
      materialOrderId,
      isAdmin: isCompanyAdminSessionRole(guard.session.role),
      supplierPartnerId: normalizeMaterialOrderOptionalText(body.supplierPartnerId),
      note: normalizeMaterialOrderOptionalText(body.note),
      dueDate: normalizeMaterialOrderOptionalText(body.dueDate),
      lines: normalizeMaterialOrderLines(body.lines),
    });
    return createWaflApiSuccess(result);
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "발주서 상세를 저장하지 못했습니다.",
      "MATERIAL_ORDER_DETAIL_UPDATE_FAILED",
    );
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  const bodyResult = await readWaflJsonBody<MaterialOrderRequestBody>(request);
  if (!bodyResult.ok) return bodyResult.response;

  try {
    const body = bodyResult.data;
    const materialOrderId = normalizeMaterialOrderOptionalText(body.materialOrderId);
    const status = isMaterialOrderStatus(body.status) ? body.status : null;

    if (!materialOrderId || !status) {
      return createWaflApiError(
        "발주서와 변경할 상태를 확인해주세요.",
        "MATERIAL_ORDER_STATUS_PAYLOAD_REQUIRED",
        400,
      );
    }

    const currentOrder = await getMaterialOrderById({
      companyId: guard.scope.companyId,
      materialOrderId,
    });
    if (!currentOrder) {
      return createWaflApiError(
        "발주서를 찾을 수 없습니다.",
        "MATERIAL_ORDER_NOT_FOUND",
        404,
      );
    }

    if (!isAllowedMaterialOrderTransition({
      previous: currentOrder.status,
      next: status,
    })) {
      return createWaflApiError(
        "현재 단계에서는 요청한 상태로 변경할 수 없습니다.",
        "MATERIAL_ORDER_STATUS_TRANSITION_NOT_ALLOWED",
        409,
      );
    }

    const permissionDenied = await requireMaterialOrderStatusPermission(guard.session, status);
    if (permissionDenied) return permissionDenied;

    const result = await updateWorkspaceMaterialOrderStatus({
      companyId: guard.scope.companyId,
      visibility: guard.scope.visibility,
      materialOrderId,
      status,
      actorUserId: guard.session.userId,
    });
    return createWaflApiSuccess(result);
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "발주서 상태를 변경하지 못했습니다.",
      "MATERIAL_ORDER_STATUS_UPDATE_FAILED",
    );
  }
}
