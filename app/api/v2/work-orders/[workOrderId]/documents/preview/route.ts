import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { renderDraftWorkOrderPdfPreview, WorkOrderPdfPreviewError } from "@/lib/generated-documents/work-order-pdf/previewService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return guard.response;
  try {
    const { workOrderId } = await context.params;
    const revisionId = new URL(request.url).searchParams.get("revisionId")?.trim() ?? "";
    const pdf = await renderDraftWorkOrderPdfPreview({ scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId, workOrderId, revisionId });
    return new NextResponse(new Uint8Array(pdf), { status: 200, headers: { "Cache-Control": "no-store", "Content-Disposition": "inline; filename=WAFL-preview.pdf", "Content-Type": "application/pdf", "X-WAFL-Correlation-Id": correlationId } });
  } catch (error) {
    if (error instanceof WorkOrderPdfPreviewError) return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, correlationId } }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ ok: false, error: { code: "INTERNAL_ERROR", message: "PDF 미리보기를 만들지 못했습니다.", correlationId } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
