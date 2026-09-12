import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { DOCUMENT_ACCESS_UUID_PATTERN } from "@/lib/generated-documents/document-access/constants";
import { getGeneratedDocumentArtifactHealth } from "@/lib/generated-documents/work-order-pdf/artifactHealth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ documentRef: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const correlationId = randomUUID();
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return guard.response;
  const { documentRef } = await context.params;
  if (!DOCUMENT_ACCESS_UUID_PATTERN.test(documentRef)) {
    return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "생성된 PDF를 찾을 수 없습니다.", retryable: false, correlationId } }, { status: 404 });
  }
  const health = await getGeneratedDocumentArtifactHealth({
    scope: guard.scope,
    companyMemberId: guard.session.companyMemberId,
    correlationId,
    documentId: documentRef,
    requireCurrentRevision: true,
  });
  if (!health) return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: "생성된 PDF를 찾을 수 없습니다.", retryable: false, correlationId } }, { status: 404 });
  return createWaflApiSuccess({ documentId: documentRef, health }, { headers: { "Cache-Control": "no-store" } });
}
