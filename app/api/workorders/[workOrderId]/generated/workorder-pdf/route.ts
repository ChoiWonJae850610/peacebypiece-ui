import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { checkCompanyUploadStorageQuota } from "@/lib/billing/companyStorageQuotaRepository";
import { STORAGE_QUOTA_UPLOAD_ERROR_CODES } from "@/lib/billing/storageQuotaPolicy";
import { isDatabaseConfigured } from "@/lib/db/client";
import { renderPdfWithExternalGenerator } from "@/lib/generated-documents/pdfGeneratorClient";
import { deleteR2Object, getR2Object, putR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { createR2WorkerFileUrl, createR2WorkerUploadUrl, deleteR2ObjectViaWorker, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import {
  ATTACHMENT_SOURCE_TYPE,
  GENERATED_DOCUMENT_TYPE,
  createGeneratedWorkorderPdfStorageKey,
  createWorkorderPdfDisplayName,
  getGeneratedOrderRequestAttachmentScope,
} from "@/lib/workorder/generatedDocuments";
import { createAttachmentRepository } from "@/lib/workorder/persistence/attachmentAdapter";
import type { AttachmentRepository, AttachmentWritableRepository } from "@/lib/workorder/persistence/attachmentRepository";
import { findDbWorkOrderById, type WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderReadRepository";
import { getWorkOrderSizeSpec } from "@/lib/workorder/sizeSpec/repository";
import type { WorkOrderPdfKind } from "@/lib/workorder/sizeSpec/types";
import { buildWorkorderFallbackPdf, buildWorkorderPdfHtml, getWorkorderPdfMissingItems } from "@/lib/workorder/serverWorkorderPdf";
import type { Attachment } from "@/types/workorder";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ workOrderId: string }>;
};

type WorkorderPdfPayload = {
  kind?: unknown;
};

function readRequestedPdfKind(value: unknown): WorkOrderPdfKind | "auto" {
  if (value === "auto") return "auto";
  return value === "final" ? "final" : "incomplete";
}

function generatedDocumentTypeForKind(kind: WorkOrderPdfKind) {
  return kind === "final"
    ? GENERATED_DOCUMENT_TYPE.workorderFinalPdf
    : GENERATED_DOCUMENT_TYPE.workorderIncompletePdf;
}

function logWorkorderPdfError(stage: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "UNKNOWN_ERROR");
  console.error(`[WORKORDER_PDF:${stage}]`, { code: message.slice(0, 80) });
}

function createWorkorderPdfErrorResponse(stage: string, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      attachment: null,
      error: `WORKORDER_PDF_${stage}_FAILED`,
      stage,
    },
    { status },
  );
}

async function cleanupGeneratedPdfObject(storageKey: string): Promise<void> {
  try {
    if (isR2WorkerUploadConfigured()) {
      await deleteR2ObjectViaWorker({ key: storageKey });
      return;
    }
    if (isR2Configured()) {
      await deleteR2Object({ key: storageKey });
    }
  } catch (error) {
    logWorkorderPdfError("REGISTER_CLEANUP_PENDING", error);
  }
}

function isWritableRepository(repository: AttachmentRepository): repository is AttachmentWritableRepository {
  return "createAttachment" in repository;
}

async function resolveCompanyScope(): Promise<
  | { ok: true; scope: WorkOrderCompanyScope; actorId: string | null; actorName: string | null }
  | { ok: false; response: NextResponse }
> {
  const session = await getCurrentWaflSession();
  if (!session || !session.companyId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "COMPANY_SESSION_REQUIRED" }, { status: 401 }),
    };
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(session.companyId);
  if (blockedResponse) return { ok: false, response: blockedResponse };

  return {
    ok: true,
    actorId: session.userId,
    actorName: session.name,
    scope: {
      companyId: session.companyId,
      companyName: session.companyName,
      visibility:
        session.role === "member"
          ? { mode: "assigned", userId: session.userId, companyMemberId: session.companyMemberId }
          : { mode: "company" },
    },
  };
}

async function putGeneratedPdfObject(input: { storageKey: string; pdf: Buffer }): Promise<void> {
  const contentType = "application/pdf";

  if (isR2WorkerUploadConfigured()) {
    const upload = createR2WorkerUploadUrl({ key: input.storageKey, contentType });
    const response = await fetch(upload.url, {
      method: upload.method,
      headers: upload.headers,
      body: new Uint8Array(input.pdf),
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || `R2_WORKER_UPLOAD_FAILED_${response.status}`);
    }
    return;
  }

  if (!isR2Configured()) throw new Error("R2_UPLOAD_NOT_CONFIGURED");
  await putR2Object({ key: input.storageKey, body: input.pdf, contentType });
}

async function verifyGeneratedPdfObject(input: { storageKey: string; expectedSizeBytes: number }): Promise<void> {
  if (input.expectedSizeBytes <= 0) {
    throw new Error("PDF_BINARY_EMPTY");
  }

  if (isR2WorkerUploadConfigured()) {
    const request = createR2WorkerFileUrl({ key: input.storageKey });
    const response = await fetch(request.url, { method: request.method });
    if (!response.ok) {
      await response.text().catch(() => "");
      throw new Error(`PDF_R2_HEAD_FAILED_${response.status}`);
    }
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentType && contentType !== "application/pdf") {
      throw new Error("PDF_R2_CONTENT_TYPE_INVALID");
    }
    if (contentLength <= 0) {
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength <= 0) throw new Error("PDF_R2_OBJECT_EMPTY");
    }
    return;
  }

  if (!isR2Configured()) throw new Error("R2_VERIFY_NOT_CONFIGURED");
  const object = await getR2Object({ key: input.storageKey });
  if (object.contentType !== "application/pdf") throw new Error("PDF_R2_CONTENT_TYPE_INVALID");
  if (object.contentLength <= 0 || object.body.byteLength <= 0) throw new Error("PDF_R2_OBJECT_EMPTY");
}

function createGeneratedWorkorderAttachment(input: {
  id: string;
  workOrderId: string;
  fileName: string;
  storageKey: string;
  exposeStorageKey?: boolean;
  actorId: string | null;
  actorName: string | null;
  generatedDocumentType: string;
}): Attachment {
  return {
    id: input.id,
    name: input.fileName,
    type: "pdf",
    url: `/api/workorders/${encodeURIComponent(input.workOrderId)}/generated/workorder-pdf/${encodeURIComponent(input.id)}/view`,
    storageKey: input.exposeStorageKey === true ? input.storageKey : "",
    thumbnailKey: null,
    thumbnailUrl: null,
    previewUrl: `/api/workorders/${encodeURIComponent(input.workOrderId)}/generated/workorder-pdf/${encodeURIComponent(input.id)}/view`,
    scope: getGeneratedOrderRequestAttachmentScope(),
    ownerId: input.actorId,
    ownerName: input.actorName,
    sourceType: ATTACHMENT_SOURCE_TYPE.system,
    generatedDocumentType: input.generatedDocumentType,
  };
}

async function retirePreviousFinalPdf(input: {
  repository: AttachmentWritableRepository;
  workOrderId: string;
  keepAttachmentId: string;
  deletedBy: string | null;
}) {
  const snapshot = await input.repository.listSnapshotByWorkOrderId(input.workOrderId);
  const previousFinals = snapshot.attachments.filter(
    (attachment) =>
      attachment.id !== input.keepAttachmentId &&
      attachment.sourceType === ATTACHMENT_SOURCE_TYPE.system &&
      attachment.generatedDocumentType === GENERATED_DOCUMENT_TYPE.workorderFinalPdf,
  );

  for (const attachment of previousFinals) {
    await input.repository.softDeleteAttachment({
      attachmentId: attachment.id,
      deletedBy: input.deletedBy,
      trashRetentionDays: 30,
    });
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, attachment: null, error: "DB_NOT_CONFIGURED" }, { status: 503 });
  }

  const { workOrderId } = await context.params;
  if (!workOrderId.trim()) {
    return NextResponse.json({ ok: false, attachment: null, error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
  }

  const scopeResult = await resolveCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  const payload = (await request.json().catch(() => null)) as WorkorderPdfPayload | null;
  const requestedKind = readRequestedPdfKind(payload?.kind);
  const workOrder = await findDbWorkOrderById(workOrderId, scopeResult.scope);
  if (!workOrder) {
    return NextResponse.json({ ok: false, attachment: null, error: "WORK_ORDER_NOT_FOUND" }, { status: 404 });
  }

  const repository = await createAttachmentRepository();
  if (!isWritableRepository(repository)) {
    return NextResponse.json({ ok: false, attachment: null, error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
  }

  const sizeSpec = await getWorkOrderSizeSpec({ workOrder, scope: scopeResult.scope });
  const missingItems = getWorkorderPdfMissingItems({ workOrder, sizeSpec });
  const kind: WorkOrderPdfKind =
    requestedKind === "auto"
      ? (missingItems.length > 0 ? "incomplete" : "final")
      : requestedKind;
  const generatedDocumentType = generatedDocumentTypeForKind(kind);
  if (kind === "final" && missingItems.length > 0) {
    return NextResponse.json(
      { ok: false, attachment: null, error: "WORKORDER_FINAL_PDF_NOT_READY", missingItems },
      { status: 409 },
    );
  }

  const createdAt = new Date();
  const fileId = randomUUID();
  const fileName = createWorkorderPdfDisplayName({
    workOrderTitle: workOrder.title,
    documentType: generatedDocumentType,
    createdAt,
  });

  let pdf: Buffer;
  try {
    const snapshot = await repository.listSnapshotByWorkOrderId(workOrderId);
    const documentWorkOrder = { ...workOrder, attachments: snapshot.attachments };
    const html = buildWorkorderPdfHtml({
      workOrder: documentWorkOrder,
      companyName: scopeResult.scope.companyName,
      sizeSpec,
      kind,
      missingItems,
    });
    const externalResult = await renderPdfWithExternalGenerator({
      html,
      fileName,
      format: "A4",
      orientation: "portrait",
    });

    if (externalResult.ok) {
      pdf = externalResult.pdf;
    } else if (externalResult.reason === "not_configured") {
      pdf = buildWorkorderFallbackPdf({ workOrder: documentWorkOrder, kind, missingItems });
    } else {
      throw new Error(externalResult.message);
    }
  } catch (error) {
    logWorkorderPdfError("GENERATE", error);
    return createWorkorderPdfErrorResponse("GENERATE");
  }

  const storageKey = createGeneratedWorkorderPdfStorageKey({
    companyId: scopeResult.scope.companyId,
    workOrderId,
    fileId,
  });

  const quotaResult = await checkCompanyUploadStorageQuota({
    companyId: scopeResult.scope.companyId,
    incomingSizeBytes: pdf.byteLength,
  });
  if (!quotaResult.ok) {
    return NextResponse.json(
      { ok: false, attachment: null, error: quotaResult.error, message: quotaResult.message },
      { status: 503 },
    );
  }
  if (quotaResult.decision.status === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        attachment: null,
        error: STORAGE_QUOTA_UPLOAD_ERROR_CODES.exceeded,
        message: quotaResult.decision.message,
        quota: quotaResult.decision,
      },
      { status: 409 },
    );
  }

  try {
    await putGeneratedPdfObject({ storageKey, pdf });
    await verifyGeneratedPdfObject({ storageKey, expectedSizeBytes: pdf.byteLength });
  } catch (error) {
    logWorkorderPdfError("UPLOAD", error);
    await cleanupGeneratedPdfObject(storageKey);
    return createWorkorderPdfErrorResponse("UPLOAD");
  }

  const provisionalAttachment = createGeneratedWorkorderAttachment({
    id: fileId,
    workOrderId,
    fileName,
    storageKey,
    exposeStorageKey: true,
    actorId: scopeResult.actorId,
    actorName: scopeResult.actorName,
    generatedDocumentType,
  });

  let createdId: string = fileId;
  try {
    const created = await repository.createAttachment({
      order_id: workOrderId,
      attachment: provisionalAttachment,
      storage_provider: "r2",
      storage_key: storageKey,
      content_type: "application/pdf",
      file_size: pdf.byteLength,
      source_type: ATTACHMENT_SOURCE_TYPE.system,
      generated_document_type: generatedDocumentType,
    });
    createdId = created.id;

    if (kind === "final") {
      await retirePreviousFinalPdf({
        repository,
        workOrderId,
        keepAttachmentId: createdId,
        deletedBy: scopeResult.actorId,
      });
    }
  } catch (error) {
    logWorkorderPdfError("REGISTER", error);
    await cleanupGeneratedPdfObject(storageKey);
    return createWorkorderPdfErrorResponse("REGISTER");
  }

  const attachment = createGeneratedWorkorderAttachment({
    id: createdId,
    workOrderId,
    fileName,
    storageKey,
    actorId: scopeResult.actorId,
    actorName: scopeResult.actorName,
    generatedDocumentType,
  });

  return NextResponse.json({ ok: true, attachment, documentKind: kind, missingItems });
}
