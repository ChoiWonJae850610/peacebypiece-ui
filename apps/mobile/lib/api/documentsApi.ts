import type { DocumentAccessTokenSummary, WorkOrderDocumentPage } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { requestJson } from "../apiTransport";

const DOCUMENT_GENERATION_REQUEST_TIMEOUT_MS = 120_000;

export async function getWorkOrderDocuments(workOrderId: string): Promise<WorkOrderDocumentPage> {
  const body = await requestJson<{ ok: boolean; data?: WorkOrderDocumentPage }>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/documents?limit=50`, { method: "GET" });
  if (!body.ok || !body.data || !Array.isArray(body.data.items)) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "문서 목록 응답이 올바르지 않습니다." });
  return body.data;
}

export async function issueWorkOrderR0(input: {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly workOrderVersion: number;
  readonly revisionVersion: number;
  readonly clientRequestId: string;
}) {
  const body = await requestJson<{ ok: boolean; data?: { result: { issuedRevisionId: string; displayDocumentNumber: string; nextRevisionVersion: number }; nextVersion: number } }>(
    `/api/v2/work-orders/${encodeURIComponent(input.workOrderId)}/revisions/issue`,
    {
      method: "POST",
      idempotencyKey: input.clientRequestId,
      body: {
        clientRequestId: input.clientRequestId,
        expectedWorkOrderVersion: input.workOrderVersion,
        expectedRevisionVersion: input.revisionVersion,
        expectedRevisionId: input.revisionId,
        issueNote: null,
      },
    },
  );
  if (!body.ok || !body.data?.result) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "작업지시서 발행 응답이 올바르지 않습니다." });
  return body.data;
}

export async function generateWorkOrderR0(workOrderId: string, revisionId: string, clientRequestId: string) {
  const body = await requestJson<{ ok: boolean; data?: { generatedDocumentId: string; status: string; displayDocumentNumber: string } }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/documents/generate`,
    {
      method: "POST",
      idempotencyKey: clientRequestId,
      body: { revisionId },
      timeoutMs: DOCUMENT_GENERATION_REQUEST_TIMEOUT_MS,
    },
  );
  if (!body.ok || !body.data?.generatedDocumentId) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "PDF 생성 응답이 올바르지 않습니다." });
  return body.data;
}

export async function getDocumentViewerTarget(documentId: string) {
  const body = await requestJson<{ ok: boolean; data?: { viewerUrl: string } }>(
    `/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/viewer-target`,
    { method: "GET" },
  );
  if (!body.ok || !body.data?.viewerUrl) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "문서 보기 응답이 올바르지 않습니다." });
  return body.data;
}

export async function setAttachmentOutputInclude(input: { workOrderId: string; attachmentId: string; expectedVersion: number; includeInDocument: boolean; clientRequestId: string }) {
  return requestJson<{ ok: boolean; data: { nextVersion: number } }>(
    `/api/v2/work-orders/${encodeURIComponent(input.workOrderId)}/attachments/${encodeURIComponent(input.attachmentId)}/output-include`,
    { method: "PATCH", idempotencyKey: input.clientRequestId, body: { clientRequestId: input.clientRequestId, expectedVersion: input.expectedVersion, includeInDocument: input.includeInDocument } },
  );
}

export async function listDocumentAccessTokens(documentId: string): Promise<readonly DocumentAccessTokenSummary[]> {
  const body = await requestJson<{ ok: boolean; data?: { items: readonly DocumentAccessTokenSummary[] } }>(`/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/access-tokens`, { method: "GET" });
  if (!body.ok || !Array.isArray(body.data?.items)) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "공유 목록 응답이 올바르지 않습니다." });
  return body.data.items;
}

export async function createDocumentShare(documentId: string, expiresInDays: 1 | 7 | 30, clientRequestId: string) {
  const body = await requestJson<{ ok: boolean; data?: { viewerUrl: string; expiresAt: string } }>(`/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/access-tokens`, { method: "POST", idempotencyKey: clientRequestId, body: { expiresInDays } });
  if (!body.ok || !body.data?.viewerUrl) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "공유 링크 응답이 올바르지 않습니다." });
  return body.data;
}

export async function revokeDocumentAccessToken(documentId: string, tokenId: string) {
  return requestJson<{ ok: boolean }>(`/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/access-tokens/${encodeURIComponent(tokenId)}/revoke`, { method: "POST", body: {} });
}
