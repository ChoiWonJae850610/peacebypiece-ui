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
      }),
    );
  } catch {
    return NextResponse.json({ materialOrders: [], error: "MATERIAL_ORDER_LIST_UNAVAILABLE" }, { status: 500 });
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
        supplierPartnerId: normalizeOptionalText(body.supplierPartnerId),
        requestedByUserId: guard.session.userId,
        status,
        note: normalizeOptionalText(body.note),
        lines: normalizeMaterialOrderLines(body.lines),
      }),
    );
  } catch {
    return NextResponse.json({ materialOrder: null, materialOrders: [], error: "MATERIAL_ORDER_CREATE_FAILED" }, { status: 500 });
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
        materialOrderId,
        status,
        actorUserId: guard.session.userId,
      }),
    );
  } catch {
    return NextResponse.json({ materialOrder: null, materialOrders: [], error: "MATERIAL_ORDER_STATUS_UPDATE_FAILED" }, { status: 500 });
  }
}
