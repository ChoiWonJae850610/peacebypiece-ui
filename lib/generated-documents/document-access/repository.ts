import "server-only";

import type { TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import {
  withWaflV2TenantReadOnlyTransaction,
  withWaflV2TenantWriteTransaction,
  type DbQueryResultRow,
  type DbTransactionClient,
} from "@/lib/db/client";
import {
  DOCUMENT_EMBEDDED_QR_PURPOSE,
  DOCUMENT_MANUAL_SHARE_PURPOSE,
  DOCUMENT_SHARE_COMMAND_CODE,
  DOCUMENT_SHARE_EVENT_CODE,
  DOCUMENT_SHARE_REVOKED_EVENT_CODE,
} from "./constants";
import type {
  DocumentAccessTokenStatus,
  DocumentAccessTokenSummary,
  DocumentAccessTokenPurpose,
  PublicDocumentAccessMetadata,
} from "./types";

type RepositoryFailureReason = "not_found" | "idempotency_conflict" | "idempotency_incomplete" | "conflict";

export class DocumentAccessRepositoryError extends Error {
  readonly reason: RepositoryFailureReason;
  constructor(reason: RepositoryFailureReason) {
    super(reason);
    this.name = "DocumentAccessRepositoryError";
    this.reason = reason;
  }
}

type DocumentRow = DbQueryResultRow & {
  readonly id: string;
  readonly work_order_id: string;
  readonly work_order_revision_id: string;
  readonly display_document_number: string;
};

type TokenRow = DbQueryResultRow & {
  readonly id: string;
  readonly generated_document_id: string;
  readonly token_purpose: DocumentAccessTokenPurpose;
  readonly created_at: Date | string;
  readonly expires_at: Date | string;
  readonly revoked_at: Date | string | null;
  readonly rotated_from_token_id: string | null;
  readonly last_accessed_at: Date | string | null;
  readonly access_count: number | string;
  readonly display_document_number?: string;
};

type PublicRow = DbQueryResultRow & {
  readonly token_id: string;
  readonly company_id: string;
  readonly generated_document_id: string;
  readonly display_document_number: string;
  readonly document_type: string;
  readonly expires_at: Date | string;
  readonly access_count: number | string;
  readonly first_access?: boolean;
  readonly storage_object_key: string;
  readonly file_size_bytes: number | string;
  readonly content_sha256: string;
};

const iso = (value: Date | string | null) => value === null ? null : new Date(value).toISOString();
const status = (row: TokenRow): DocumentAccessTokenStatus => {
  if (row.revoked_at !== null) return "revoked";
  return Date.parse(iso(row.expires_at)!) <= Date.now() ? "expired" : "active";
};

function mapToken(row: TokenRow): DocumentAccessTokenSummary {
  return {
    tokenId: String(row.id),
    tokenPurpose: row.token_purpose,
    createdAt: iso(row.created_at)!,
    expiresAt: iso(row.expires_at)!,
    revokedAt: iso(row.revoked_at),
    rotatedFromTokenId: row.rotated_from_token_id ? String(row.rotated_from_token_id) : null,
    lastAccessedAt: iso(row.last_accessed_at),
    accessCount: Number(row.access_count),
    status: status(row),
  };
}

function mapPublic(row: PublicRow): PublicDocumentAccessMetadata {
  return {
    tokenId: String(row.token_id),
    companyId: String(row.company_id),
    generatedDocumentId: String(row.generated_document_id),
    displayDocumentNumber: String(row.display_document_number),
    documentType: String(row.document_type),
    expiresAt: iso(row.expires_at)!,
    accessCount: Number(row.access_count),
    storageObjectKey: String(row.storage_object_key),
    fileSizeBytes: Number(row.file_size_bytes),
    contentSha256: String(row.content_sha256),
  };
}

async function loadGeneratedDocument(
  client: DbTransactionClient,
  companyId: string,
  generatedDocumentId: string,
): Promise<DocumentRow> {
  const result = await client.query<DocumentRow>(`
    SELECT id, work_order_id, work_order_revision_id, display_document_number
    FROM generated_documents
    WHERE company_id = $1 AND id = $2::uuid
      AND status = 'generated' AND revoked_at IS NULL AND deleted_at IS NULL
    FOR SHARE
  `, [companyId, generatedDocumentId]);
  const row = result.rows[0];
  if (!row) throw new DocumentAccessRepositoryError("not_found");
  return row;
}

async function appendEvent(client: DbTransactionClient, input: {
  readonly scope: TenantMemberScope;
  readonly tokenId: string;
  readonly generatedDocumentId: string;
  readonly displayDocumentNumber: string;
  readonly commandCode: typeof DOCUMENT_SHARE_EVENT_CODE | typeof DOCUMENT_SHARE_REVOKED_EVENT_CODE;
  readonly summary: string;
}) {
  await client.query(`
    INSERT INTO domain_events (
      company_id, entity_type, entity_id, command_code, actor_member_id,
      correlation_id, change_summary, metadata, schema_version
    ) VALUES ($1, 'document_access_token', $2, $3, $4, $5, $6, $7::jsonb, 1)
  `, [
    input.scope.companyId,
    input.tokenId,
    input.commandCode,
    input.scope.companyMemberId,
    input.scope.correlationId,
    input.summary,
    JSON.stringify({
      generatedDocumentId: input.generatedDocumentId,
      accessTokenId: input.tokenId,
      displayDocumentNumber: input.displayDocumentNumber,
      channel: "controlled_link",
    }),
  ]);
}

export async function createDocumentAccessToken(input: {
  readonly scope: TenantMemberScope;
  readonly generatedDocumentId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
  readonly scopedIdempotencyKey: string;
  readonly requestHash: string;
}): Promise<{ readonly token: DocumentAccessTokenSummary; readonly displayDocumentNumber: string; readonly idempotentReplay: boolean }> {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const reserved = await client.query(`
      INSERT INTO work_order_command_receipts (
        company_id, command_code, idempotency_key, request_sha256, correlation_id
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
      RETURNING request_sha256
    `, [input.scope.companyId, DOCUMENT_SHARE_COMMAND_CODE, input.scopedIdempotencyKey, input.requestHash, input.scope.correlationId]);

    if (reserved.rowCount === 0) {
      const receipt = await client.query<DbQueryResultRow & { readonly request_sha256: string }>(`
        SELECT request_sha256
        FROM work_order_command_receipts
        WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
        FOR UPDATE
      `, [input.scope.companyId, DOCUMENT_SHARE_COMMAND_CODE, input.scopedIdempotencyKey]);
      if (!receipt.rows[0]) throw new DocumentAccessRepositoryError("idempotency_incomplete");
      if (receipt.rows[0].request_sha256 !== input.requestHash) throw new DocumentAccessRepositoryError("idempotency_conflict");
      const replay = await client.query<TokenRow & { readonly display_document_number: string }>(`
        SELECT token.*, document.display_document_number
        FROM document_access_tokens token
        JOIN generated_documents document
          ON document.company_id = token.company_id AND document.id = token.generated_document_id
        WHERE token.company_id = $1 AND token.generated_document_id = $2::uuid AND token.token_hash = $3
          AND token.token_purpose = 'manual_share'
      `, [input.scope.companyId, input.generatedDocumentId, input.tokenHash]);
      if (!replay.rows[0]) throw new DocumentAccessRepositoryError("idempotency_incomplete");
      return { token: mapToken(replay.rows[0]), displayDocumentNumber: replay.rows[0].display_document_number, idempotentReplay: true };
    }

    const document = await loadGeneratedDocument(client, input.scope.companyId, input.generatedDocumentId);
    const inserted = await client.query<TokenRow>(`
      INSERT INTO document_access_tokens (
        company_id, generated_document_id, token_hash, expires_at, token_purpose
      ) VALUES ($1, $2::uuid, $3::char(64), $4::timestamptz, $5)
      RETURNING id, generated_document_id, token_purpose, created_at, expires_at, revoked_at,
                rotated_from_token_id, last_accessed_at, access_count
    `, [input.scope.companyId, input.generatedDocumentId, input.tokenHash, input.expiresAt, DOCUMENT_MANUAL_SHARE_PURPOSE]);
    const token = inserted.rows[0];
    if (!token) throw new DocumentAccessRepositoryError("conflict");
    await appendEvent(client, {
      scope: input.scope,
      tokenId: token.id,
      generatedDocumentId: input.generatedDocumentId,
      displayDocumentNumber: document.display_document_number,
      commandCode: DOCUMENT_SHARE_EVENT_CODE,
      summary: "Controlled document link created.",
    });
    await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id = $4::uuid, result_revision_id = $5::uuid,
          result_generated_document_id = $6::uuid, result_entity_version = 1
      WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
    `, [
      input.scope.companyId,
      DOCUMENT_SHARE_COMMAND_CODE,
      input.scopedIdempotencyKey,
      document.work_order_id,
      document.work_order_revision_id,
      input.generatedDocumentId,
    ]);
    return { token: mapToken(token), displayDocumentNumber: document.display_document_number, idempotentReplay: false };
  });
}

export async function listDocumentAccessTokens(input: {
  readonly scope: TenantMemberScope;
  readonly generatedDocumentId: string;
}): Promise<readonly DocumentAccessTokenSummary[]> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const document = await client.query(`
      SELECT id FROM generated_documents
      WHERE company_id = $1 AND id = $2::uuid
        AND status = 'generated' AND deleted_at IS NULL
    `, [input.scope.companyId, input.generatedDocumentId]);
    if (document.rowCount !== 1) throw new DocumentAccessRepositoryError("not_found");
    const result = await client.query<TokenRow>(`
      SELECT id, generated_document_id, token_purpose, created_at, expires_at, revoked_at,
             rotated_from_token_id, last_accessed_at, access_count
      FROM document_access_tokens
      WHERE company_id = $1 AND generated_document_id = $2::uuid
        AND token_purpose = 'manual_share'
      ORDER BY created_at DESC, id DESC
      LIMIT 100
    `, [input.scope.companyId, input.generatedDocumentId]);
    return result.rows.map(mapToken);
  });
}

export async function revokeDocumentAccessToken(input: {
  readonly scope: TenantMemberScope;
  readonly generatedDocumentId: string;
  readonly tokenId: string;
}): Promise<{ readonly token: DocumentAccessTokenSummary; readonly idempotentReplay: boolean }> {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const result = await client.query<TokenRow & { readonly display_document_number: string }>(`
      SELECT token.*, document.display_document_number
      FROM document_access_tokens token
      JOIN generated_documents document
        ON document.company_id = token.company_id AND document.id = token.generated_document_id
      WHERE token.company_id = $1 AND token.generated_document_id = $2::uuid AND token.id = $3::uuid
        AND token.token_purpose = 'manual_share'
        AND document.status = 'generated' AND document.deleted_at IS NULL
      FOR UPDATE OF token
    `, [input.scope.companyId, input.generatedDocumentId, input.tokenId]);
    const current = result.rows[0];
    if (!current) throw new DocumentAccessRepositoryError("not_found");
    if (current.revoked_at !== null) return { token: mapToken(current), idempotentReplay: true };
    if (Date.parse(iso(current.expires_at)!) <= Date.now()) throw new DocumentAccessRepositoryError("not_found");
    const updated = await client.query<TokenRow>(`
      UPDATE document_access_tokens
      SET revoked_at = now()
      WHERE company_id = $1 AND generated_document_id = $2::uuid AND id = $3::uuid AND revoked_at IS NULL
      RETURNING id, generated_document_id, token_purpose, created_at, expires_at, revoked_at,
                rotated_from_token_id, last_accessed_at, access_count
    `, [input.scope.companyId, input.generatedDocumentId, input.tokenId]);
    if (updated.rowCount !== 1 || !updated.rows[0]) throw new DocumentAccessRepositoryError("conflict");
    await appendEvent(client, {
      scope: input.scope,
      tokenId: current.id,
      generatedDocumentId: input.generatedDocumentId,
      displayDocumentNumber: current.display_document_number,
      commandCode: DOCUMENT_SHARE_REVOKED_EVENT_CODE,
      summary: "Controlled document link revoked.",
    });
    return { token: mapToken(updated.rows[0]), idempotentReplay: false };
  });
}

export async function rotateDocumentAccessToken(input: {
  readonly scope: TenantMemberScope;
  readonly generatedDocumentId: string;
  readonly tokenId: string;
  readonly newTokenHash: string;
  readonly expiresAt: string;
}): Promise<{ readonly token: DocumentAccessTokenSummary; readonly displayDocumentNumber: string; readonly idempotentReplay: boolean }> {
  return withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, input.scope);
    const result = await client.query<TokenRow & { readonly display_document_number: string }>(`
      SELECT token.*, document.display_document_number
      FROM document_access_tokens token
      JOIN generated_documents document
        ON document.company_id = token.company_id AND document.id = token.generated_document_id
      WHERE token.company_id = $1 AND token.generated_document_id = $2::uuid AND token.id = $3::uuid
        AND token.token_purpose = 'manual_share'
        AND document.status = 'generated' AND document.deleted_at IS NULL
      FOR UPDATE OF token
    `, [input.scope.companyId, input.generatedDocumentId, input.tokenId]);
    const current = result.rows[0];
    if (!current) throw new DocumentAccessRepositoryError("not_found");
    if (current.revoked_at !== null) {
      const replay = await client.query<TokenRow>(`
        SELECT id, generated_document_id, token_purpose, created_at, expires_at, revoked_at,
               rotated_from_token_id, last_accessed_at, access_count
        FROM document_access_tokens
        WHERE company_id = $1 AND generated_document_id = $2::uuid
          AND rotated_from_token_id = $3::uuid AND token_hash = $4::char(64)
          AND token_purpose = 'manual_share'
      `, [input.scope.companyId, input.generatedDocumentId, input.tokenId, input.newTokenHash]);
      if (!replay.rows[0]) throw new DocumentAccessRepositoryError("not_found");
      return { token: mapToken(replay.rows[0]), displayDocumentNumber: current.display_document_number, idempotentReplay: true };
    }
    if (Date.parse(iso(current.expires_at)!) <= Date.now()) throw new DocumentAccessRepositoryError("not_found");
    await client.query(`
      UPDATE document_access_tokens SET revoked_at = now()
      WHERE company_id = $1 AND generated_document_id = $2::uuid AND id = $3::uuid AND revoked_at IS NULL
    `, [input.scope.companyId, input.generatedDocumentId, input.tokenId]);
    const inserted = await client.query<TokenRow>(`
      INSERT INTO document_access_tokens (
        company_id, generated_document_id, token_hash, expires_at, rotated_from_token_id, token_purpose
      ) VALUES ($1, $2::uuid, $3::char(64), $4::timestamptz, $5::uuid, $6)
      RETURNING id, generated_document_id, token_purpose, created_at, expires_at, revoked_at,
                rotated_from_token_id, last_accessed_at, access_count
    `, [input.scope.companyId, input.generatedDocumentId, input.newTokenHash, input.expiresAt, input.tokenId, DOCUMENT_MANUAL_SHARE_PURPOSE]);
    const next = inserted.rows[0];
    if (!next) throw new DocumentAccessRepositoryError("conflict");
    await appendEvent(client, {
      scope: input.scope, tokenId: current.id, generatedDocumentId: input.generatedDocumentId,
      displayDocumentNumber: current.display_document_number,
      commandCode: DOCUMENT_SHARE_REVOKED_EVENT_CODE, summary: "Controlled document link rotated and revoked.",
    });
    await appendEvent(client, {
      scope: input.scope, tokenId: next.id, generatedDocumentId: input.generatedDocumentId,
      displayDocumentNumber: current.display_document_number,
      commandCode: DOCUMENT_SHARE_EVENT_CODE, summary: "Replacement controlled document link created.",
    });
    return { token: mapToken(next), displayDocumentNumber: current.display_document_number, idempotentReplay: false };
  });
}

export async function insertEmbeddedQrAccessToken(input: {
  readonly client: DbTransactionClient;
  readonly companyId: string;
  readonly generatedDocumentId: string;
  readonly tokenHash: string;
  readonly expiresAt: string;
}): Promise<DocumentAccessTokenSummary> {
  const document = await input.client.query(`
    SELECT id
    FROM generated_documents
    WHERE company_id = $1 AND id = $2::uuid AND status = 'pending'
    FOR SHARE
  `, [input.companyId, input.generatedDocumentId]);
  if (document.rowCount !== 1) throw new DocumentAccessRepositoryError("not_found");

  const inserted = await input.client.query<TokenRow>(`
    INSERT INTO document_access_tokens (
      company_id, generated_document_id, token_hash, expires_at, token_purpose
    ) VALUES ($1, $2::uuid, $3::char(64), $4::timestamptz, $5)
    RETURNING id, generated_document_id, token_purpose, created_at, expires_at, revoked_at,
              rotated_from_token_id, last_accessed_at, access_count
  `, [input.companyId, input.generatedDocumentId, input.tokenHash, input.expiresAt, DOCUMENT_EMBEDDED_QR_PURPOSE]);
  if (inserted.rowCount !== 1 || !inserted.rows[0]) throw new DocumentAccessRepositoryError("conflict");
  return mapToken(inserted.rows[0]);
}

export async function redeemDocumentAccessTokenHash(input: {
  readonly tokenHash: string;
  readonly correlationId: string;
}): Promise<(PublicDocumentAccessMetadata & { readonly firstAccess: boolean }) | null> {
  return withWaflV2TenantWriteTransaction(async (client) => {
    const result = await client.query<PublicRow>(`
      SELECT * FROM public.wafl_v2_redeem_document_access_token($1::char(64), $2::text)
    `, [input.tokenHash, input.correlationId]);
    const row = result.rows[0];
    return row ? { ...mapPublic(row), firstAccess: Boolean(row.first_access) } : null;
  });
}

export async function readDocumentAccessSession(input: {
  readonly tokenId: string;
  readonly generatedDocumentId: string;
}): Promise<PublicDocumentAccessMetadata | null> {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    const result = await client.query<PublicRow>(`
      SELECT * FROM public.wafl_v2_read_document_access_session($1::uuid, $2::uuid)
    `, [input.tokenId, input.generatedDocumentId]);
    return result.rows[0] ? mapPublic(result.rows[0]) : null;
  });
}
