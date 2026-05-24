import { NextRequest, NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  MATERIAL_ORDER_STATUS_VALUES,
  MATERIAL_UNIT_VALUES,
  WORKORDER_MATERIAL_LINE_ROLE_VALUES,
} from "@/lib/materials/constants";
import {
  createWorkspaceWorkorderMaterialLine,
  deleteWorkspaceWorkorderMaterialLine,
  listWorkspaceWorkorderMaterialLines,
} from "@/lib/materials/workorderMaterialLinesService";
import type {
  MaterialOrderStatus,
  MaterialUnit,
  WorkorderMaterialLineMutationInput,
  WorkorderMaterialLineRole,
} from "@/lib/materials/types";

type WorkorderMaterialLineRequestBody = {
  workorderId?: unknown;
  lineId?: unknown;
  materialId?: unknown;
  role?: unknown;
  requiredQuantity?: unknown;
  unit?: unknown;
  orderStatus?: unknown;
  memo?: unknown;
};

function isEnumValue<TValue extends string>(values: readonly TValue[], value: unknown): value is TValue {
  return typeof value === "string" && values.includes(value as TValue);
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function readRequestBody(request: NextRequest): Promise<WorkorderMaterialLineRequestBody> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as WorkorderMaterialLineRequestBody) : {};
}

function readWorkorderIdFromRequest(request: NextRequest): string | null {
  return normalizeOptionalText(request.nextUrl.searchParams.get("workorderId"));
}

function buildMutationInput(companyId: string, body: WorkorderMaterialLineRequestBody): WorkorderMaterialLineMutationInput | null {
  const workorderId = normalizeOptionalText(body.workorderId);
  const materialId = normalizeOptionalText(body.materialId);
  if (!workorderId || !materialId) return null;
  if (!isEnumValue<WorkorderMaterialLineRole>(WORKORDER_MATERIAL_LINE_ROLE_VALUES, body.role)) return null;
  if (!isEnumValue<MaterialUnit>(MATERIAL_UNIT_VALUES, body.unit)) return null;

  const orderStatus = isEnumValue<MaterialOrderStatus>(MATERIAL_ORDER_STATUS_VALUES, body.orderStatus)
    ? body.orderStatus
    : "not_requested";

  return {
    companyId,
    workorderId,
    materialId,
    role: body.role,
    requiredQuantity: normalizeOptionalNumber(body.requiredQuantity),
    unit: body.unit,
    orderStatus,
    memo: normalizeOptionalText(body.memo),
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  const workorderId = readWorkorderIdFromRequest(request);
  if (!workorderId) {
    return NextResponse.json({ materials: [], lines: [], error: "WORKORDER_ID_REQUIRED" }, { status: 400 });
  }

  try {
    return NextResponse.json(await listWorkspaceWorkorderMaterialLines({ companyId: guard.scope.companyId, workorderId }));
  } catch {
    return NextResponse.json({ materials: [], lines: [], error: "WORKORDER_MATERIAL_LINES_LIST_UNAVAILABLE" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;

  try {
    const body = await readRequestBody(request);
    const input = buildMutationInput(guard.scope.companyId, body);
    if (!input) {
      return NextResponse.json({ materials: [], lines: [], error: "WORKORDER_MATERIAL_LINE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await createWorkspaceWorkorderMaterialLine(input));
  } catch {
    return NextResponse.json({ materials: [], lines: [], error: "WORKORDER_MATERIAL_LINE_CREATE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) return guard.response;

  try {
    const body = await readRequestBody(request);
    const workorderId = normalizeOptionalText(body.workorderId);
    const lineId = normalizeOptionalText(body.lineId);
    if (!workorderId || !lineId) {
      return NextResponse.json({ materials: [], lines: [], error: "WORKORDER_MATERIAL_LINE_DELETE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await deleteWorkspaceWorkorderMaterialLine({ companyId: guard.scope.companyId, workorderId, lineId }));
  } catch {
    return NextResponse.json({ materials: [], lines: [], error: "WORKORDER_MATERIAL_LINE_DELETE_FAILED" }, { status: 500 });
  }
}
