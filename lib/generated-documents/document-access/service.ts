import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { R2WorkerGeneratedDocumentTransport } from "@/lib/generated-documents/work-order-pdf/r2WorkerTransport";
import {
  DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS,
  DOCUMENT_ACCESS_MAX_EXPIRY_DAYS,
  DOCUMENT_ACCESS_RAW_TOKEN_PATTERN,
  DOCUMENT_ACCESS_UUID_PATTERN,
  DOCUMENT_SHARE_COMMAND_CODE,
  DOCUMENT_SHARE_ROTATE_COMMAND_CODE,
} from "./constants";
import { createQrSvg } from "./qr";
import {
  createDocumentAccessToken,
  DocumentAccessRepositoryError,
  listDocumentAccessTokens,
  readDocumentAccessSession,
  redeemDocumentAccessTokenHash,
  revokeDocumentAccessToken,
  rotateDocumentAccessToken,
} from "./repository";
import { getDocumentAccessRuntimeGuard } from "./runtimeGuard";
import {
  createDocumentViewerUrl,
  deriveDocumentAccessToken,
  hashDocumentAccessRequest,
  hashDocumentAccessToken,
  scopeDocumentAccessIdempotencyKey,
} from "./token";
import type { CreatedDocumentAccessToken, PublicDocumentAccessMetadata } from "./types";

export type DocumentAccessErrorCode = "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_ERROR" | "CONFLICT" | "INTERNAL_ERROR";

export class DocumentAccessServiceError extends Error {
  readonly code: DocumentAccessErrorCode;
  readonly status: number;
  constructor(code: DocumentAccessErrorCode, status: number, message: string) {
    super(message);
    this.name = "DocumentAccessServiceError";
    this.code = code;
    this.status = status;
  }
}

function assertRuntime(mutation: boolean) {
  const guard = getDocumentAccessRuntimeGuard({ requireMutationApproval: mutation });
  if (!guard.ok) throw new DocumentAccessServiceError("FORBIDDEN", 403, "승인된 dev/test 문서 공유 runtime에서만 사용할 수 있습니다.");
}

function assertUuid(value: string) {
  if (!DOCUMENT_ACCESS_UUID_PATTERN.test(value)) throw new DocumentAccessServiceError("NOT_FOUND", 404, "문서를 찾을 수 없습니다.");
}

function assertIdempotencyKey(value: string): string {
  const normalized = value.trim();
  if (normalized.length < 8 || normalized.length > 128 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new DocumentAccessServiceError("VALIDATION_ERROR", 400, "유효한 Idempotency-Key가 필요합니다.");
  }
  return normalized;
}

function toScope(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
  readonly permissionCode: "workorder.read" | "workorder.update";
}): TenantMemberScope {
  const memberId = input.companyMemberId?.trim();
  if (!memberId) throw new DocumentAccessServiceError("FORBIDDEN", 403, "활성 회사 멤버가 필요합니다.");
  return {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId: memberId as CompanyMemberId,
    permissionCodes: [input.permissionCode],
    correlationId: input.correlationId as CorrelationId,
  };
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof DocumentAccessRepositoryError) {
    if (error.reason === "not_found") throw new DocumentAccessServiceError("NOT_FOUND", 404, "문서를 찾을 수 없습니다.");
    if (error.reason === "idempotency_conflict" || error.reason === "conflict") {
      throw new DocumentAccessServiceError("CONFLICT", 409, "동일한 요청 키가 다른 공유 요청에 사용되었습니다.");
    }
    throw new DocumentAccessServiceError("CONFLICT", 409, "공유 요청 결과가 완전하지 않습니다.");
  }
  throw error;
}

function expiry(days: number | undefined): { readonly days: number; readonly expiresAt: string } {
  const normalized = days ?? DOCUMENT_ACCESS_DEFAULT_EXPIRY_DAYS;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > DOCUMENT_ACCESS_MAX_EXPIRY_DAYS) {
    throw new DocumentAccessServiceError("VALIDATION_ERROR", 400, `만료일은 1일부터 ${DOCUMENT_ACCESS_MAX_EXPIRY_DAYS}일까지 지정할 수 있습니다.`);
  }
  return { days: normalized, expiresAt: new Date(Date.now() + normalized * 86_400_000).toISOString() };
}

export async function createDocumentShare(input: {
  readonly generatedDocumentId: string;
  readonly idempotencyKey: string;
  readonly expiresInDays?: number;
  readonly origin: string;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
}): Promise<CreatedDocumentAccessToken> {
  assertRuntime(true);
  assertUuid(input.generatedDocumentId);
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  const policy = expiry(input.expiresInDays);
  const scope = toScope({ ...input, permissionCode: "workorder.update" });
  const rawToken = deriveDocumentAccessToken({
    companyId: scope.companyId,
    generatedDocumentId: input.generatedDocumentId,
    commandCode: DOCUMENT_SHARE_COMMAND_CODE,
    idempotencyKey,
  });
  try {
    const result = await createDocumentAccessToken({
      scope,
      generatedDocumentId: input.generatedDocumentId,
      tokenHash: hashDocumentAccessToken(rawToken),
      expiresAt: policy.expiresAt,
      scopedIdempotencyKey: scopeDocumentAccessIdempotencyKey({
        companyId: scope.companyId,
        generatedDocumentId: input.generatedDocumentId,
        commandCode: DOCUMENT_SHARE_COMMAND_CODE,
        idempotencyKey,
      }),
      requestHash: hashDocumentAccessRequest({ generatedDocumentId: input.generatedDocumentId, expiresInDays: policy.days }),
    });
    const viewerUrl = createDocumentViewerUrl(input.origin, rawToken);
    return {
      ...result.token,
      generatedDocumentId: input.generatedDocumentId,
      displayDocumentNumber: result.displayDocumentNumber,
      rawToken,
      viewerUrl,
      qrSvg: createQrSvg(viewerUrl),
      idempotentReplay: result.idempotentReplay,
    };
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function getDocumentShares(input: {
  readonly generatedDocumentId: string;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
}) {
  assertRuntime(false);
  assertUuid(input.generatedDocumentId);
  try {
    return await listDocumentAccessTokens({
      scope: toScope({ ...input, permissionCode: "workorder.read" }),
      generatedDocumentId: input.generatedDocumentId,
    });
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function revokeDocumentShare(input: {
  readonly generatedDocumentId: string;
  readonly tokenId: string;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
}) {
  assertRuntime(true);
  assertUuid(input.generatedDocumentId);
  assertUuid(input.tokenId);
  try {
    return await revokeDocumentAccessToken({
      scope: toScope({ ...input, permissionCode: "workorder.update" }),
      generatedDocumentId: input.generatedDocumentId,
      tokenId: input.tokenId,
    });
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function rotateDocumentShare(input: {
  readonly generatedDocumentId: string;
  readonly tokenId: string;
  readonly idempotencyKey: string;
  readonly expiresInDays?: number;
  readonly origin: string;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
}): Promise<CreatedDocumentAccessToken> {
  assertRuntime(true);
  assertUuid(input.generatedDocumentId);
  assertUuid(input.tokenId);
  const idempotencyKey = assertIdempotencyKey(input.idempotencyKey);
  const policy = expiry(input.expiresInDays);
  const scope = toScope({ ...input, permissionCode: "workorder.update" });
  const rawToken = deriveDocumentAccessToken({
    companyId: scope.companyId,
    generatedDocumentId: input.generatedDocumentId,
    commandCode: DOCUMENT_SHARE_ROTATE_COMMAND_CODE,
    idempotencyKey: `${input.tokenId}:${idempotencyKey}`,
  });
  try {
    const result = await rotateDocumentAccessToken({
      scope,
      generatedDocumentId: input.generatedDocumentId,
      tokenId: input.tokenId,
      newTokenHash: hashDocumentAccessToken(rawToken),
      expiresAt: policy.expiresAt,
    });
    const viewerUrl = createDocumentViewerUrl(input.origin, rawToken);
    return {
      ...result.token,
      generatedDocumentId: input.generatedDocumentId,
      displayDocumentNumber: result.displayDocumentNumber,
      rawToken,
      viewerUrl,
      qrSvg: createQrSvg(viewerUrl),
      idempotentReplay: result.idempotentReplay,
    };
  } catch (error) {
    mapRepositoryError(error);
  }
}

export async function redeemPublicDocumentToken(rawToken: string, correlationId: string) {
  assertRuntime(true);
  if (!DOCUMENT_ACCESS_RAW_TOKEN_PATTERN.test(rawToken)) return null;
  return redeemDocumentAccessTokenHash({ tokenHash: hashDocumentAccessToken(rawToken), correlationId });
}

export async function getPublicDocumentSession(input: {
  readonly tokenId: string;
  readonly generatedDocumentId: string;
}): Promise<PublicDocumentAccessMetadata | null> {
  assertRuntime(false);
  if (!DOCUMENT_ACCESS_UUID_PATTERN.test(input.tokenId)
      || !DOCUMENT_ACCESS_UUID_PATTERN.test(input.generatedDocumentId)) return null;
  return readDocumentAccessSession(input);
}

export async function readPublicDocumentPdf(metadata: PublicDocumentAccessMetadata): Promise<Buffer | null> {
  assertRuntime(false);
  const body = await new R2WorkerGeneratedDocumentTransport().get(metadata.storageObjectKey);
  if (!body || body.byteLength !== metadata.fileSizeBytes) return null;
  const { createHash } = await import("node:crypto");
  if (createHash("sha256").update(body).digest("hex") !== metadata.contentSha256) return null;
  if (body.subarray(0, 5).toString("ascii") !== "%PDF-") return null;
  return body;
}
