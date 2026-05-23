import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { renderPdfWithExternalGenerator } from "@/lib/generated-documents/pdfGeneratorClient";
import { resolveOrderRequestRepresentativeImageDataUrl } from "@/lib/generated-documents/order-request/orderRequestRepresentativeImage";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { isDatabaseConfigured } from "@/lib/db/client";
import { createAttachmentFileProxyUrl, putR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { createR2WorkerUploadUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import {
  ATTACHMENT_SOURCE_TYPE,
  GENERATED_DOCUMENT_TYPE,
  createOrderRequestPdfDisplayName,
  createOrderRequestPdfStorageKey,
  getGeneratedOrderRequestAttachmentScope,
} from "@/lib/workorder/generatedDocuments";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";
import { findDbWorkOrderById, type WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepository";
import { buildOrderRequestServerPdf, buildOrderRequestServerPdfHtml } from "@/lib/workorder/serverOrderRequestPdf";
import type { Attachment } from "@/types/workorder";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    workOrderId: string;
  }>;
};

type OrderRequestPdfPayload = {
  requestNote?: unknown;
};

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "UNKNOWN_ERROR");
}

function logOrderRequestPdfError(stage: string, error: unknown) {
  console.error(`[ORDER_REQUEST_PDF:${stage}]`, error);
}

function createOrderRequestPdfErrorResponse(stage: string, error: unknown, status = 500) {
  return NextResponse.json(
    {
      ok: false,
      attachment: null,
      error: `ORDER_REQUEST_PDF_${stage}_FAILED`,
      message: toErrorMessage(error),
      stage,
    },
    { status },
  );
}

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "createAttachment" in repository;
}

async function resolveCompanyScope(): Promise<
  | {
      ok: true;
      scope: WorkOrderCompanyScope;
      actorId: string | null;
      actorName: string | null;
    }
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
          ? {
              mode: "assigned",
              userId: session.userId,
              companyMemberId: session.companyMemberId,
            }
          : { mode: "company" },
    },
  };
}

async function putGeneratedPdfObject(input: {
  storageKey: string;
  pdf: Buffer;
}): Promise<void> {
  const contentType = "application/pdf";

  if (isR2WorkerUploadConfigured()) {
    const upload = createR2WorkerUploadUrl({
      key: input.storageKey,
      contentType,
    });
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

  if (!isR2Configured()) {
    throw new Error("R2_UPLOAD_NOT_CONFIGURED");
  }

  await putR2Object({
    key: input.storageKey,
    body: input.pdf,
    contentType,
  });
}

function createGeneratedOrderRequestAttachment(input: {
  id: string;
  fileName: string;
  storageKey: string;
  actorId: string | null;
  actorName: string | null;
}): Attachment {
  return {
    id: input.id,
    name: input.fileName,
    type: "pdf",
    url: createAttachmentFileProxyUrl(input.storageKey),
    storageKey: input.storageKey,
    thumbnailKey: null,
    thumbnailUrl: null,
    previewUrl: createAttachmentFileProxyUrl(input.storageKey),
    scope: getGeneratedOrderRequestAttachmentScope(),
    ownerId: input.actorId,
    ownerName: input.actorName,
    sourceType: ATTACHMENT_SOURCE_TYPE.system,
    generatedDocumentType: GENERATED_DOCUMENT_TYPE.orderRequestPdf,
  };
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

  const payload = (await request.json().catch(() => null)) as OrderRequestPdfPayload | null;
  const requestNote = readText(payload?.requestNote);
  const workOrder = await findDbWorkOrderById(workOrderId, scopeResult.scope);
  if (!workOrder) {
    return NextResponse.json({ ok: false, attachment: null, error: "WORK_ORDER_NOT_FOUND" }, { status: 404 });
  }

  const repository = await createAttachmentMemoRepository();
  if (!isWritableRepository(repository)) {
    return NextResponse.json({ ok: false, attachment: null, error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
  }

  const createdAt = new Date();
  const fileId = randomUUID();
  const fileName = createOrderRequestPdfDisplayName({
    workOrderTitle: workOrder.title,
    managerName: workOrder.manager || scopeResult.actorName,
    createdAt,
  });

  let pdf: Buffer;
  try {
    const snapshot = await repository.listSnapshotByWorkOrderId(workOrderId);
    const documentWorkOrder = {
      ...workOrder,
      attachments: snapshot.attachments,
      memoThreads: snapshot.memoThreads,
    };
    const representativeImageDataUrl = await resolveOrderRequestRepresentativeImageDataUrl(documentWorkOrder);
    const html = buildOrderRequestServerPdfHtml({ workOrder: documentWorkOrder, requestNote, representativeImageDataUrl });
    const externalResult = await renderPdfWithExternalGenerator({
      html,
      fileName,
      format: "A4",
      orientation: "portrait",
    });

    if (externalResult.ok) {
      pdf = externalResult.pdf;
    } else if (externalResult.reason === "not_configured") {
      pdf = buildOrderRequestServerPdf({ workOrder: documentWorkOrder, requestNote });
    } else {
      throw new Error(externalResult.message);
    }
  } catch (error) {
    logOrderRequestPdfError("GENERATE", error);
    return createOrderRequestPdfErrorResponse("GENERATE", error);
  }

  const storageKey = createOrderRequestPdfStorageKey({
    companyId: scopeResult.scope.companyId,
    workOrderId,
    fileId,
  });

  try {
    await putGeneratedPdfObject({ storageKey, pdf });
  } catch (error) {
    logOrderRequestPdfError("UPLOAD", error);
    return createOrderRequestPdfErrorResponse("UPLOAD", error);
  }

  const provisionalAttachment = createGeneratedOrderRequestAttachment({
    id: fileId,
    fileName,
    storageKey,
    actorId: scopeResult.actorId,
    actorName: scopeResult.actorName,
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
      generated_document_type: GENERATED_DOCUMENT_TYPE.orderRequestPdf,
    });
    createdId = created.id;
  } catch (error) {
    logOrderRequestPdfError("REGISTER", error);
    return createOrderRequestPdfErrorResponse("REGISTER", error);
  }

  const attachment = createGeneratedOrderRequestAttachment({
    id: createdId,
    fileName,
    storageKey,
    actorId: scopeResult.actorId,
    actorName: scopeResult.actorName,
  });

  return NextResponse.json({ ok: true, attachment });
}
