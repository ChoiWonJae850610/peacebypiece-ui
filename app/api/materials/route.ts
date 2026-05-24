import { NextRequest, NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  createWorkspaceMaterial,
  deleteWorkspaceMaterial,
  listWorkspaceMaterials,
  updateWorkspaceMaterial,
} from "@/lib/materials/service";
import {
  MATERIAL_KIND_VALUES,
  MATERIAL_LIFECYCLE_STATUS_VALUES,
  MATERIAL_UNIT_VALUES,
} from "@/lib/materials/constants";
import type { MaterialKind, MaterialLifecycleStatus, MaterialMutationInput, MaterialUnit } from "@/lib/materials/types";

type MaterialRequestBody = {
  materialId?: string | null;
  kind?: unknown;
  code?: unknown;
  name?: unknown;
  categoryId?: unknown;
  partnerId?: unknown;
  unit?: unknown;
  lifecycleStatus?: unknown;
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

async function readMaterialRequestBody(request: NextRequest): Promise<MaterialRequestBody> {
  const payload = (await request.json()) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as MaterialRequestBody) : {};
}

function buildMaterialMutationInput(companyId: string, body: MaterialRequestBody): MaterialMutationInput | null {
  const code = normalizeOptionalText(body.code);
  const name = normalizeOptionalText(body.name);

  if (!code || !name) return null;
  if (!isEnumValue<MaterialKind>(MATERIAL_KIND_VALUES, body.kind)) return null;
  if (!isEnumValue<MaterialUnit>(MATERIAL_UNIT_VALUES, body.unit)) return null;

  const lifecycleStatus = isEnumValue<MaterialLifecycleStatus>(MATERIAL_LIFECYCLE_STATUS_VALUES, body.lifecycleStatus)
    ? body.lifecycleStatus
    : "active";

  return {
    companyId,
    kind: body.kind,
    code,
    name,
    categoryId: normalizeOptionalText(body.categoryId),
    partnerId: normalizeOptionalText(body.partnerId),
    unit: body.unit,
    lifecycleStatus,
    memo: normalizeOptionalText(body.memo),
  };
}

export async function GET() {
  const guard = await requireWorkspaceApiGuard();
  if (!guard.ok) return guard.response;

  try {
    return NextResponse.json(await listWorkspaceMaterials({ companyId: guard.scope.companyId }));
  } catch {
    return NextResponse.json({ materials: [], error: "MATERIALS_LIST_UNAVAILABLE" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({ permissionCode: "standards.manage" });
  if (!guard.ok) return guard.response;

  try {
    const body = await readMaterialRequestBody(request);
    const input = buildMaterialMutationInput(guard.scope.companyId, body);
    if (!input) {
      return NextResponse.json({ materials: [], error: "MATERIAL_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await createWorkspaceMaterial(input));
  } catch {
    return NextResponse.json({ materials: [], error: "MATERIAL_CREATE_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({ permissionCode: "standards.manage" });
  if (!guard.ok) return guard.response;

  try {
    const body = await readMaterialRequestBody(request);
    const materialId = normalizeOptionalText(body.materialId);
    const input = buildMaterialMutationInput(guard.scope.companyId, body);
    if (!materialId || !input) {
      return NextResponse.json({ materials: [], error: "MATERIAL_UPDATE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await updateWorkspaceMaterial(materialId, input));
  } catch {
    return NextResponse.json({ materials: [], error: "MATERIAL_UPDATE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({ permissionCode: "standards.manage" });
  if (!guard.ok) return guard.response;

  try {
    const body = await readMaterialRequestBody(request);
    const materialId = normalizeOptionalText(body.materialId);
    if (!materialId) {
      return NextResponse.json({ materials: [], error: "MATERIAL_DELETE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await deleteWorkspaceMaterial({ companyId: guard.scope.companyId, materialId }));
  } catch {
    return NextResponse.json({ materials: [], error: "MATERIAL_DELETE_FAILED" }, { status: 500 });
  }
}
