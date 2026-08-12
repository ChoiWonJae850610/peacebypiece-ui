import { NextResponse } from "next/server";

import { getWorkOrderV2MeasurementMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { createSystemSizeSpecTemplate, listSystemSizeSpecTemplates, updateSystemSizeSpecTemplate, type SystemSizeSpecStructure } from "@/lib/system/standards/sizeSpecTemplateRepository";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";

type Body = { id?: unknown; name?: unknown; categoryCode?: unknown; genderCode?: unknown; sizeSetCode?: unknown; isActive?: unknown; structure?: unknown };
function runtimeBlocked() { return !getWorkOrderV2MeasurementMutationRuntimeGuard().ok; }
function metadata(body: Body) { return { name: typeof body.name === "string" ? body.name : undefined, categoryCode: body.categoryCode === null || typeof body.categoryCode === "string" ? body.categoryCode : undefined, genderCode: body.genderCode === null || typeof body.genderCode === "string" ? body.genderCode : undefined, sizeSetCode: body.sizeSetCode === null || typeof body.sizeSetCode === "string" ? body.sizeSetCode : undefined, isActive: typeof body.isActive === "boolean" ? body.isActive : undefined, structure: body.structure && typeof body.structure === "object" ? body.structure as SystemSizeSpecStructure : undefined } as const; }

export async function GET() {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  return NextResponse.json({ ok: true, items: await listSystemSizeSpecTemplates() });
}

export async function POST(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (runtimeBlocked()) return NextResponse.json({ ok: false, error: "MEASUREMENT_TEMPLATE_MUTATION_RUNTIME_BLOCKED" }, { status: 403 });
  try {
    const body = await request.json() as Body;
    const data = metadata(body);
    if (!data.name || !data.structure) return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
    const record = await createSystemSizeSpecTemplate({ name: data.name, categoryCode: data.categoryCode ?? null, genderCode: data.genderCode ?? null, sizeSetCode: data.sizeSetCode ?? null, isActive: data.isActive ?? true, structure: data.structure });
    await createSystemAuditLogSafe({ actorUserId: scope.systemScope.userId, actorRole: "system_admin", targetType: "system", targetId: record.id, eventType: "size_spec_template.created", summary: "System size-spec template created.", metadata: { templateVersion: record.templateVersion } });
    return NextResponse.json({ ok: true, record }, { status: 201 });
  } catch { return NextResponse.json({ ok: false, error: "SYSTEM_SIZE_SPEC_TEMPLATE_CREATE_FAILED" }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;
  if (runtimeBlocked()) return NextResponse.json({ ok: false, error: "MEASUREMENT_TEMPLATE_MUTATION_RUNTIME_BLOCKED" }, { status: 403 });
  try {
    const body = await request.json() as Body;
    if (typeof body.id !== "string") return NextResponse.json({ ok: false, error: "VALIDATION_ERROR" }, { status: 400 });
    const record = await updateSystemSizeSpecTemplate({ id: body.id, ...metadata(body) });
    await createSystemAuditLogSafe({ actorUserId: scope.systemScope.userId, actorRole: "system_admin", targetType: "system", targetId: record.id, eventType: "size_spec_template.updated", summary: "System size-spec template updated.", metadata: { templateVersion: record.templateVersion } });
    return NextResponse.json({ ok: true, record });
  } catch { return NextResponse.json({ ok: false, error: "SYSTEM_SIZE_SPEC_TEMPLATE_UPDATE_FAILED" }, { status: 400 }); }
}
