import { NextRequest, NextResponse } from "next/server";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type PrimaryAttachmentRequest = {
  workOrderId?: unknown;
  attachmentId?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "setPrimaryDesignAttachment" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const scopeResult = await requireAdminFileCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = (await request.json().catch(() => null)) as PrimaryAttachmentRequest | null;
    const workOrderId = readText(payload?.workOrderId);
    const attachmentId = readText(payload?.attachmentId);

    if (!workOrderId) {
      return NextResponse.json({ attachmentId: null, error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
    }

    if (!attachmentId) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_ID_REQUIRED" }, { status: 400 });
    }

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    const updated = await repository.setPrimaryDesignAttachment({ workOrderId, attachmentId });
    if (!updated) {
      return NextResponse.json({ attachmentId: null, error: "DESIGN_ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ attachmentId: updated.id, isPrimary: updated.is_primary === true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Primary design attachment update failed.";
    console.error("[PRIMARY_DESIGN_ATTACHMENT_UPDATE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "PRIMARY_DESIGN_ATTACHMENT_UPDATE_FAILED", message }, { status: 500 });
  }
}
