import { NextResponse } from "next/server";

import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import {
  createSystemProductTemplate,
  createSystemProductTemplateCategory,
  listSystemProductTemplates,
  updateSystemProductTemplate,
  updateSystemProductTemplateCategory,
} from "@/lib/system/standards/productTemplateRepository";
import type {
  SystemProductTemplateCategoryCreateInput,
  SystemProductTemplateCategoryUpdateInput,
  SystemProductTemplateUpdateInput,
  SystemProductTemplateUpsertInput,
} from "@/lib/system/standards/systemProductTemplateStandards";

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
      error: "SYSTEM_PRODUCT_TEMPLATE_ROUTE_ERROR",
      message: error instanceof Error ? error.message : "Unknown system product template route error",
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

type ProductTemplatePostPayload =
  | ({ action?: "create_template" } & SystemProductTemplateUpsertInput)
  | ({ action: "create_category" } & SystemProductTemplateCategoryCreateInput);

type ProductTemplatePatchPayload =
  | ({ action?: "update_template" } & SystemProductTemplateUpdateInput)
  | ({ action: "update_category" } & SystemProductTemplateCategoryUpdateInput);

export async function handleGetSystemProductTemplates() {
  try {
    const records = await listSystemProductTemplates();
    return NextResponse.json({ ok: true, records, count: records.length });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handlePostSystemProductTemplate(request: Request, scope: SystemStandardRouteScope) {
  try {
    const body = (await request.json()) as ProductTemplatePostPayload;

    if (body.action === "create_category") {
      const record = await createSystemProductTemplateCategory(body);
      await createSystemAuditLogSafe({
        ...getAuditBase(request, scope),
        targetId: body.templateId,
        eventType: "standard.product_template_category_created",
        severity: "medium",
        summary: `생산품 유형 템플릿 분류 추가: ${body.name}`,
        metadata: {
          standardType: "product_template",
          templateId: body.templateId,
          parentId: body.parentId ?? null,
          level: body.level,
          name: body.name,
          sortOrder: body.sortOrder ?? 0,
        },
      });
      return NextResponse.json({ ok: true, record }, { status: 201 });
    }

    const record = await createSystemProductTemplate(body);
    await createSystemAuditLogSafe({
      ...getAuditBase(request, scope),
      targetId: record.id,
      eventType: "standard.product_template_created",
      severity: "medium",
      summary: `생산품 유형 템플릿 추가: ${record.name}`,
      metadata: {
        standardType: "product_template",
        templateId: record.id,
        code: record.code,
        name: record.name,
        isDefault: record.isDefault,
        status: record.status,
        sortOrder: record.sortOrder,
      },
    });

    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, 400);
  }
}

export async function handlePatchSystemProductTemplate(request: Request, scope: SystemStandardRouteScope) {
  try {
    const body = (await request.json()) as ProductTemplatePatchPayload;

    if (body.action === "update_category") {
      const record = await updateSystemProductTemplateCategory(body);
      await createSystemAuditLogSafe({
        ...getAuditBase(request, scope),
        targetId: body.id,
        eventType: "standard.product_template_category_updated",
        severity: "medium",
        summary: `생산품 유형 템플릿 분류 수정: ${body.name ?? body.id}`,
        metadata: {
          standardType: "product_template",
          categoryId: body.id,
          name: body.name,
          isActive: body.isActive,
          sortOrder: body.sortOrder,
        },
      });
      return NextResponse.json({ ok: true, record });
    }

    const record = await updateSystemProductTemplate(body);
    await createSystemAuditLogSafe({
      ...getAuditBase(request, scope),
      targetId: record.id,
      eventType: "standard.product_template_updated",
      severity: "medium",
      summary: `생산품 유형 템플릿 수정: ${record.name}`,
      metadata: {
        standardType: "product_template",
        templateId: record.id,
        code: record.code,
        name: record.name,
        isDefault: record.isDefault,
        status: record.status,
        sortOrder: record.sortOrder,
      },
    });

    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return toErrorResponse(error, 400);
  }
}
