import { NextResponse } from "next/server";

import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import {
  createSystemProcessStandard,
  listSystemProcessStandards,
  updateSystemProcessStandard,
} from "@/lib/system/standards/processStandardsRepository";
import type {
  SystemProcessStandardUpdateInput,
  SystemProcessStandardUpsertInput,
} from "@/lib/system/standards/systemProcessStandards";

function getRequestId(request: Request): string | null {
  return request.headers.get("x-request-id") || null;
}

function getIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
}

function toErrorResponse(error: unknown, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      error: "SYSTEM_PROCESS_STANDARD_ROUTE_ERROR",
      message: error instanceof Error ? error.message : "Unknown system process standard route error",
    },
    { status },
  );
}

type SystemStandardRouteScope = {
  actorUserId: string;
};

function getAuditBase(request: Request, scope: SystemStandardRouteScope) {
  return {
    actorUserId: scope.actorUserId,
    actorRole: "system_admin" as const,
    targetType: "settings" as const,
    requestId: getRequestId(request),
    ipAddress: getIpAddress(request),
  };
}

export async function handleGetSystemProcessStandards() {
  try {
    const records = await listSystemProcessStandards();
    return NextResponse.json({ ok: true, records, count: records.length });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handlePostSystemProcessStandard(request: Request, scope: SystemStandardRouteScope) {
  try {
    const body = (await request.json()) as SystemProcessStandardUpsertInput;
    const record = await createSystemProcessStandard(body);

    await createSystemAuditLogSafe({
      ...getAuditBase(request, scope),
      targetId: record.id,
      eventType: "standard.process_created",
      severity: "medium",
      summary: `시스템 외주공정 유형 추가: ${record.name}`,
      metadata: {
        standardType: "process",
        processStandardId: record.id,
        code: record.code,
        name: record.name,
        category: record.category,
        sortOrder: record.sortOrder,
      },
    });

    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, 400);
  }
}

export async function handlePatchSystemProcessStandard(request: Request, scope: SystemStandardRouteScope) {
  try {
    const body = (await request.json()) as SystemProcessStandardUpdateInput;
    const record = await updateSystemProcessStandard(body);

    await createSystemAuditLogSafe({
      ...getAuditBase(request, scope),
      targetId: record.id,
      eventType: "standard.process_updated",
      severity: "medium",
      summary: `시스템 외주공정 유형 수정: ${record.name}`,
      metadata: {
        standardType: "process",
        processStandardId: record.id,
        code: record.code,
        name: record.name,
        category: record.category,
        status: record.status,
        sortOrder: record.sortOrder,
      },
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return toErrorResponse(error, 400);
  }
}
