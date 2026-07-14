import "server-only";

import type { WorkOrderIssuedPdfSnapshot } from "./snapshot";

export const GENERATED_DOCUMENT_COMMAND_CODE = "work_order.document.generate";

export type GeneratedDocumentGenerationIdentity = {
  readonly generatedDocumentId: string;
  readonly companyId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly documentType: "factory_instruction";
  readonly generationNo: number;
  readonly displayDocumentNumber: string;
};

export type PreparePendingGeneratedDocumentInput = Omit<GeneratedDocumentGenerationIdentity, "generatedDocumentId"> & {
  readonly rendererVersion: string;
  readonly dtoSchemaVersion: number;
  readonly snapshot: WorkOrderIssuedPdfSnapshot;
};

export type PreparedGeneratedDocument = PreparePendingGeneratedDocumentInput & {
  readonly generatedDocumentId: string;
  readonly status: "pending";
};

export type FinalizeGeneratedDocumentInput = GeneratedDocumentGenerationIdentity & {
  readonly storageObjectKey: string;
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
  readonly generatedAt: string;
};

export interface GeneratedDocumentGenerationRepository {
  loadImmutableIssuedSource(input: {
    readonly companyId: string;
    readonly workOrderId: string;
    readonly revisionId: string;
  }): Promise<unknown>;
  findGenerationByIdempotencyReceipt(input: {
    readonly companyId: string;
    readonly commandCode: typeof GENERATED_DOCUMENT_COMMAND_CODE;
    readonly scopedIdempotencyKeyHash: string;
  }): Promise<PreparedGeneratedDocument | null>;
  preparePendingGeneration(input: PreparePendingGeneratedDocumentInput): Promise<PreparedGeneratedDocument>;
  finalizeGeneratedGeneration(input: FinalizeGeneratedDocumentInput): Promise<void>;
  failGeneration(input: GeneratedDocumentGenerationIdentity & {
    readonly failureCode: string;
  }): Promise<void>;
}

export const GENERATED_DOCUMENT_GENERATION_SQL_PLAN = {
  loadImmutableIssuedSource: `
    SELECT w.id AS work_order_id, w.company_id, w.status AS work_order_status,
           r.id AS revision_id, r.revision_status, r.revision_no, r.finalized_at,
           w.document_number_base
    FROM work_orders w
    JOIN work_order_revisions r
      ON r.company_id = w.company_id AND r.work_order_id = w.id
    WHERE w.company_id = $1 AND w.id = $2::uuid AND r.id = $3::uuid
      AND w.deleted_at IS NULL
      AND w.status IN ('issued', 'revised', 'completed')
      AND r.revision_status IN ('finalized', 'superseded')
    FOR SHARE OF w, r
  `,
  loadRevisionAssetManifest: `
    SELECT 'image' AS asset_type, ri.image_id AS revision_asset_id,
           ri.company_id, ri.filename_snapshot, ri.mime_type_snapshot,
           ri.storage_object_key_snapshot, ri.display_order,
           ri.is_representative, true AS include_in_document,
           i.size_bytes AS source_size_bytes, i.content_sha256 AS source_content_sha256
    FROM work_order_revision_images ri
    JOIN work_order_images i
      ON i.company_id = ri.company_id AND i.id = ri.image_id
    WHERE ri.company_id = $1 AND ri.revision_id = $2::uuid
    UNION ALL
    SELECT 'attachment', ra.attachment_id, ra.company_id,
           ra.filename_snapshot, ra.mime_type_snapshot,
           ra.storage_object_key_snapshot, ra.display_order,
           false, ra.output_include,
           a.size_bytes, a.content_sha256
    FROM work_order_revision_attachments ra
    JOIN work_order_attachments a
      ON a.company_id = ra.company_id AND a.id = ra.attachment_id
    WHERE ra.company_id = $1 AND ra.revision_id = $2::uuid
    ORDER BY display_order, asset_type, revision_asset_id
  `,
  lockGenerationScope: `
    SELECT pg_advisory_xact_lock(
      hashtextextended($1 || ':' || $2::text || ':' || $3, 0)
    )
  `,
  allocateGenerationNoAfterLock: `
    SELECT COALESCE(MAX(generation_no), 0) + 1 AS generation_no
    FROM generated_documents
    WHERE company_id = $1 AND work_order_revision_id = $2::uuid AND document_type = $3
  `,
  reserveReceipt: `
    INSERT INTO work_order_command_receipts (
      company_id, command_code, idempotency_key, request_sha256, correlation_id
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
    RETURNING request_sha256, work_order_id, result_revision_id,
              result_generated_document_id, result_entity_version
  `,
  readReceipt: `
    SELECT request_sha256, work_order_id, result_revision_id,
           result_generated_document_id, result_entity_version
    FROM work_order_command_receipts
    WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
    FOR UPDATE
  `,
  insertPending: `
    INSERT INTO generated_documents (
      company_id, work_order_id, work_order_revision_id, document_type,
      generation_no, display_document_number, status, renderer_version,
      dto_schema_version, snapshot
    ) VALUES (
      $1, $2::uuid, $3::uuid, $4,
      $5, $6, 'pending', $7, $8, $9::jsonb
    )
    RETURNING id, company_id, work_order_id, work_order_revision_id,
              document_type, generation_no, display_document_number, status
  `,
  finalizeGenerated: `
    UPDATE generated_documents
    SET status = 'generated', storage_object_key = $4,
        file_size_bytes = $5, content_sha256 = $6,
        generated_at = $7::timestamptz, updated_at = $7::timestamptz
    WHERE company_id = $1 AND id = $2::uuid AND work_order_revision_id = $3::uuid
      AND status = 'pending'
  `,
  failPending: `
    UPDATE generated_documents
    SET status = 'failed', failure_code = $4, updated_at = now()
    WHERE company_id = $1 AND id = $2::uuid AND work_order_revision_id = $3::uuid
      AND status = 'pending'
  `,
  appendEvent: `
    INSERT INTO domain_events (
      company_id, entity_type, entity_id, command_code, actor_member_id,
      correlation_id, change_summary, metadata, schema_version
    ) VALUES ($1, 'generated_document', $2, $3, $4, $5, $6, $7::jsonb, 1)
  `,
  completeReceipt: `
    UPDATE work_order_command_receipts
    SET work_order_id = $4::uuid, result_revision_id = $5::uuid,
        result_generated_document_id = $6::uuid, result_entity_version = $7
    WHERE company_id = $1 AND command_code = $2 AND idempotency_key = $3
  `,
} as const;

export const GENERATED_DOCUMENT_TRANSACTION_BOUNDARY = {
  prepare: [
    "tenant/session guard",
    "fixed tenant write transaction and claims",
    "idempotency receipt reservation",
    "immutable issued revision lock/read",
    "advisory generation-scope lock",
    "bounded generation number allocation",
    "pending generated_documents insert without id and RETURNING native UUID",
    "receipt to generated document UUID link",
    "commit",
  ],
  renderUpload: [
    "render immutable snapshot",
    "calculate PDF size and SHA-256",
    "build deterministic unique object key",
    "put and head object",
  ],
  finalize: [
    "fixed tenant write transaction and claims",
    "pending generated document lock",
    "pending to generated metadata update",
    "append safe domain event",
    "complete idempotency receipt",
    "commit",
  ],
  failure: [
    "before upload: pending to failed with safe failure code",
    "upload outcome unknown: reconciliation required",
    "upload succeeded but finalize failed: retain orphan candidate; never auto-delete",
  ],
} as const;

export class Alpha37WriteDisabledGeneratedDocumentRepository
implements GeneratedDocumentGenerationRepository {
  private disabled(): never {
    throw new Error("PDF_DB_WRITE_NOT_ENABLED_ALPHA37");
  }

  loadImmutableIssuedSource(): Promise<unknown> { return Promise.reject(new Error("PDF_DB_READ_NOT_BOUND_ALPHA37")); }
  findGenerationByIdempotencyReceipt(): Promise<PreparedGeneratedDocument | null> {
    return Promise.reject(new Error("PDF_DB_READ_NOT_BOUND_ALPHA37"));
  }
  preparePendingGeneration(): Promise<PreparedGeneratedDocument> { return this.disabled(); }
  finalizeGeneratedGeneration(): Promise<void> { return this.disabled(); }
  failGeneration(): Promise<void> { return this.disabled(); }
}
