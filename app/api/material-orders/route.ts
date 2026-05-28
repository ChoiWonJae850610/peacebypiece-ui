import { NextRequest, NextResponse } from "next/server";

import {
  createWorkspacePermissionRequiredResponse,
  hasWorkspaceApiPermission,
  requireWorkspaceApiGuard,
} from "@/lib/auth/apiRouteGuards";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import {
  createWorkspaceMaterialOrder,
  listWorkspaceMaterialOrders,
  updateWorkspaceMaterialOrderDetail,
  updateWorkspaceMaterialOrderStatus,
} from "@/lib/material-orders/service";
import {
  MATERIAL_ORDER_STATUSES,
  type MaterialOrderLineInput,
  type MaterialOrderStatus,
} from "@/lib/material-orders/types";

type MaterialOrderRequestBody = {
  materialOrderId?: unknown;
  supplierPartnerId?: unknown;
  status?: unknown;
  note?: unknown;
  lines?: unknown;
};

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
}

function isMaterialOrderStatus(value: unknown): value is MaterialOrderStatus {
  return typeof value === "string" && MATERIAL_ORDER_STATUSES.includes(value as MaterialOrderStatus);
}

function readSearchStatus(request: NextRequest): MaterialOrderStatus | null {
  const status = request.nextUrl.searchParams.get("status");
  return isMaterialOrderStatus(status) ? status : null;
}

async function readMaterialOrderRequestBody(request: NextRequest): Promise<MaterialOrderRequestBody> {
  const payload = (await request.json()) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as MaterialOrderRequestBody) : {};
}

function normalizeLineItemType(value: unknown): MaterialOrderLineInput["itemType"] | null {
  return value === "fabric" || value === "submaterial" ? value : null;
}

function normalizeMaterialOrderLines(value: unknown): MaterialOrderLineInput[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];

    const record = item as Record<string, unknown>;
    const itemName = normalizeOptionalText(record.itemName);
    const itemType = normalizeLineItemType(record.itemType);
    const unit = normalizeOptionalText(record.unit);
    if (!itemName || !itemType || !unit) return [];

    const allocations = Array.isArray(record.allocations)
      ? record.allocations.flatMap((allocation) => {
          if (typeof allocation !== "object" || allocation === null) return [];

          const allocationRecord = allocation as Record<string, unknown>;
          const workOrderId = normalizeOptionalText(allocationRecord.workOrderId);
          if (!workOrderId) return [];

          return [{
            workOrderId,
            sourceMaterialKey: normalizeOptionalText(allocationRecord.sourceMaterialKey),
            allocatedQuantity: normalizeNumber(allocationRecord.allocatedQuantity),
            allocationNote: normalizeOptionalText(allocationRecord.allocationNote),
          }];
        })
      : [];

    return [{
      partnerItemId: normalizeOptionalText(record.partnerItemId),
      itemName,
      itemType,
      color: normalizeOptionalText(record.color),
      spec: normalizeOptionalText(record.spec),
      unit,
      orderQuantity: normalizeNumber(record.orderQuantity),
      unitPrice: normalizeNumber(record.unitPrice),
      amount: normalizeNumber(record.amount),
      note: normalizeOptionalText(record.note),
      allocations,
    }];
  });
}

function resolveStatusPermission(status: MaterialOrderStatus) {
  if (status === "review_requested" || status === "draft") {
    return MEMBER_PERMISSION_CODE.materialOrderRequest;
  }

  return MEMBER_PERMISSION_CODE.materialOrderPlace;
}



function createMaterialOrderUnhandledErrorResponse(
  error: unknown,
  fallbackMessage: string,
  code: string,
): NextResponse {
  const message = error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;

  return NextResponse.json(
    {
      ok: false,
      message,
      code,
      error: code,
    },
    { status: 500 },
  );
}

function createMaterialOrderApiErrorResponse(
  message: string,
  code: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      message,
      code,
    },
    { status },
  );
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
    return NextResponse.json(
      await listWorkspaceMaterialOrders({
        companyId: guard.scope.companyId,
        status: readSearchStatus(request),
        visibility: guard.scope.visibility,
      }),
    );
  } catch (error) {
    return createMaterialOrderUnhandledErrorResponse(
      error,
      "발주서 목록을 불러오지 못했습니다.",
      "MATERIAL_ORDER_LIST_UNAVAILABLE",
    );
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  try {
    const body = await readMaterialOrderRequestBody(request);
    const status = isMaterialOrderStatus(body.status) ? body.status : "draft";

    const permissionDenied = await requireMaterialOrderStatusPermission(guard.session, status);
    if (permissionDenied) return permissionDenied;

    return NextResponse.json(
      await createWorkspaceMaterialOrder({
        companyId: guard.scope.companyId,
        visibility: guard.scope.visibility,
        supplierPartnerId: normalizeOptionalText(body.supplierPartnerId),
        requestedByUserId: guard.session.userId,
        status,
        note: normalizeOptionalText(body.note),
        lines: normalizeMaterialOrderLines(body.lines),
      }),
    );
  } catch (error) {
    return createMaterialOrderUnhandledErrorResponse(
      error,
      "새 발주서를 만들지 못했습니다.",
      "MATERIAL_ORDER_CREATE_FAILED",
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  try {
    const body = await readMaterialOrderRequestBody(request);
    const materialOrderId = normalizeOptionalText(body.materialOrderId);

    if (!materialOrderId) {
      return createMaterialOrderApiErrorResponse(
        "Material order id is required.",
        "MATERIAL_ORDER_DETAIL_PAYLOAD_REQUIRED",
        400,
      );
    }

    const permitted = await hasWorkspaceApiPermission(guard.session, MEMBER_PERMISSION_CODE.materialOrderRequest);
    if (!permitted) return createWorkspacePermissionRequiredResponse(MEMBER_PERMISSION_CODE.materialOrderRequest);

    return NextResponse.json(
      await updateWorkspaceMaterialOrderDetail({
        companyId: guard.scope.companyId,
        visibility: guard.scope.visibility,
        materialOrderId,
        supplierPartnerId: normalizeOptionalText(body.supplierPartnerId),
        note: normalizeOptionalText(body.note),
        lines: normalizeMaterialOrderLines(body.lines),
      }),
    );
  } catch (error) {
    return createMaterialOrderUnhandledErrorResponse(
      error,
      "발주서 상세를 저장하지 못했습니다.",
      "MATERIAL_ORDER_DETAIL_UPDATE_FAILED",
    );
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  try {
    const body = await readMaterialOrderRequestBody(request);
    const materialOrderId = normalizeOptionalText(body.materialOrderId);
    const status = isMaterialOrderStatus(body.status) ? body.status : null;

    if (!materialOrderId || !status) {
      return createMaterialOrderApiErrorResponse(
        "Material order id and status are required.",
        "MATERIAL_ORDER_STATUS_PAYLOAD_REQUIRED",
        400,
      );
    }

    const permissionDenied = await requireMaterialOrderStatusPermission(guard.session, status);
    if (permissionDenied) return permissionDenied;

    return NextResponse.json(
      await updateWorkspaceMaterialOrderStatus({
        companyId: guard.scope.companyId,
        visibility: guard.scope.visibility,
        materialOrderId,
        status,
        actorUserId: guard.session.userId,
      }),
    );
  } catch (error) {
    return createMaterialOrderUnhandledErrorResponse(
      error,
      "발주서 상태를 변경하지 못했습니다.",
      "MATERIAL_ORDER_STATUS_UPDATE_FAILED",
    );
  }
}
