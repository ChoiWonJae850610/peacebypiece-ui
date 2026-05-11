import { NextResponse } from "next/server";

import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import {
  createSystemUnitStandard,
  listSystemUnitStandards,
  updateSystemUnitStandard,
} from "@/lib/system/standards/unitStandardsRepository";
import type {
  SystemUnitStandardUpdateInput,
  SystemUnitStandardUpsertInput,
} from "@/lib/system/standards/systemUnitStandards";

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
      error: "SYSTEM_UNIT_STANDARD_ROUTE_ERROR",
      message: error instanceof Error ? error.message : "Unknown system unit standard route error",
    },
    { status },
  );
}

function getAuditBase(request: Request) {
  return {
    actorUserId: "system-user-sample-admin",
    actorRole: "system_admin" as const,
    targetType: "settings" as const,
    requestId: getRequestId(request),
    ipAddress: getIpAddress(request),
  };
}

export async function handleGetSystemUnitStandards() {
  try {
    const records = await listSystemUnitStandards();
    return NextResponse.json({ ok: true, records, count: records.length });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handlePostSystemUnitStandard(request: Request) {
  try {
    const body = (await request.json()) as SystemUnitStandardUpsertInput;
    const record = await createSystemUnitStandard(body);

    await createSystemAuditLogSafe({
      ...getAuditBase(request),
      targetId: record.id,
      eventType: "standard.unit_created",
      severity: "medium",
      summary: `시스템 단위 표준 추가: ${record.koreanName} (${record.englishCode})`,
      metadata: {
        standardType: "unit",
        unitStandardId: record.id,
        code: record.code,
        koreanName: record.koreanName,
        englishCode: record.englishCode,
        category: record.category,
        sortOrder: record.sortOrder,
      },
    });

    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, 400);
  }
}

export async function handlePatchSystemUnitStandard(request: Request) {
  try {
    const body = (await request.json()) as SystemUnitStandardUpdateInput;
    const record = await updateSystemUnitStandard(body);

    await createSystemAuditLogSafe({
      ...getAuditBase(request),
      targetId: record.id,
      eventType: "standard.unit_updated",
      severity: "medium",
      summary: `시스템 단위 표준 수정: ${record.koreanName} (${record.englishCode})`,
      metadata: {
        standardType: "unit",
        unitStandardId: record.id,
        code: record.code,
        koreanName: record.koreanName,
        englishCode: record.englishCode,
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
