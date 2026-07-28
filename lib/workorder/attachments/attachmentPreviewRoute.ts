import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  createWaflNotFoundResponse,
  requireWorkspaceApiGuard,
} from "@/lib/auth/apiRouteGuards";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { queryDb } from "@/lib/db/client";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { createWorkOrderAttachmentWorkerFileResponse } from "@/lib/workorder/attachments/attachmentFileRoute";
import {
  ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS,
  createAttachmentPreviewToken,
  verifyAttachmentPreviewToken,
} from "@/lib/workorder/attachments/attachmentPreviewToken";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AttachmentPreviewRow = {
  readonly storage_object_key: string;
  readonly original_filename: string;
};

async function findAttachment(input: {
  readonly companyId: string;
  readonly workOrderId: string;
  readonly attachmentId: string;
  readonly assignedCompanyMemberId?: string | null;
}): Promise<AttachmentPreviewRow | null> {
  const result = await queryDb<AttachmentPreviewRow>(`
    SELECT a.storage_object_key, a.original_filename
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
      JOIN work_order_revision_attachments ra
        ON ra.company_id = w.company_id AND ra.revision_id = r.id
      JOIN work_order_attachments a
        ON a.company_id = w.company_id AND a.id = ra.attachment_id
     WHERE w.company_id = $1
       AND w.id = $2::uuid
       AND a.id = $3::uuid
       AND w.deleted_at IS NULL
       AND a.deleted_at IS NULL
       AND ($4::text IS NULL OR w.assignee_member_id = $4)
     LIMIT 1
  `, [input.companyId, input.workOrderId, input.attachmentId, input.assignedCompanyMemberId ?? null]);
  return result.rows[0] ?? null;
}

export async function handleIssueWorkOrderAttachmentPreview(
  _request: NextRequest,
  workOrderId: string,
  attachmentId: string,
) {
  if (!UUID_PATTERN.test(workOrderId) || !UUID_PATTERN.test(attachmentId)) {
    return createWaflNotFoundResponse();
  }
  const guard = await requireWorkspaceApiGuard({ permissionCode: MEMBER_PERMISSION_CODE.storageRead });
  if (!guard.ok) return guard.response;
  const row = await findAttachment({
    companyId: guard.scope.companyId,
    workOrderId,
    attachmentId,
    assignedCompanyMemberId: guard.scope.visibility?.mode === "assigned"
      ? guard.scope.visibility.companyMemberId
      : null,
  });
  if (!row) return createWaflNotFoundResponse();
  const issued = createAttachmentPreviewToken({
    companyId: guard.scope.companyId,
    workOrderId,
    attachmentId,
  });
  return NextResponse.json({
    ok: true,
    data: {
      previewUrl: `/api/v2/work-orders/attachments/preview?token=${encodeURIComponent(issued.token)}`,
      expiresAt: new Date(issued.expiresAt * 1000).toISOString(),
      expiresInSeconds: ATTACHMENT_PREVIEW_TOKEN_TTL_SECONDS,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function handleOpenWorkOrderAttachmentPreview(request: NextRequest) {
  const verified = verifyAttachmentPreviewToken(request.nextUrl.searchParams.get("token"));
  if (!verified.ok) {
    return NextResponse.json(
      { ok: false, error: { code: verified.reason === "expired" ? "PREVIEW_TOKEN_EXPIRED" : "PREVIEW_TOKEN_INVALID" } },
      { status: verified.reason === "expired" ? 410 : 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const blocked = await createCompanyApiAccessBlockedResponse(verified.payload.companyId);
  if (blocked) return blocked;
  const row = await findAttachment({
    companyId: verified.payload.companyId,
    workOrderId: verified.payload.workOrderId,
    attachmentId: verified.payload.attachmentId,
  });
  if (!row) return createWaflNotFoundResponse();
  return createWorkOrderAttachmentWorkerFileResponse({
    key: row.storage_object_key,
    fileName: row.original_filename,
  });
}
