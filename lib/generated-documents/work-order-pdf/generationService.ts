import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { withWaflV2TenantReadOnlyTransaction, withWaflV2TenantWriteTransaction, type DbQueryResultRow } from "@/lib/db/client";
import { installTenantClaims } from "@/lib/domain/work-orders/command/commandRepository";
import { getWorkOrderV2DocumentR0MutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope, WorkOrderId, WorkOrderRevisionId } from "@/lib/domain/work-orders/contracts";
import { getIssuedWorkOrderPreviewV2 } from "@/lib/domain/work-orders/read/previewRepository";
import { createR2WorkerFileUrl } from "@/lib/storage/r2/r2WorkerUpload";
import {
  inspectWorkOrderPdfInlineImage,
  WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES,
} from "@/lib/workorder/persistence/imageAssetIntegrity.mjs";
import { createWorkOrderPdfStorageKey } from "@/lib/workorder/pdf/workOrderPdfPolicy";
import { createWorkOrderImageDerivativeKeys } from "@/lib/storage/r2/r2Keys";
import { WORK_ORDER_PDF_MAX_FILE_SIZE_BYTES } from "./constants";
import { GENERATED_DOCUMENT_COMMAND_CODE } from "./generationRepository";
// @ts-expect-error The canonical renderer is an ESM .mts module loaded by the Node.js route runtime.
import { LocalChromiumIssuedWorkOrderPdfRenderer } from "./localChromiumRenderer.mts";
import { writeLocalIssuedPdfRenderInput } from "./localRenderInput";
import { R2WorkerGeneratedDocumentObjectStore } from "./objectStore";
import { R2WorkerGeneratedDocumentTransport } from "./r2WorkerTransport";
import {
  createWorkOrderIssuedPdfSnapshot,
  hashWorkOrderIssuedPdfSnapshot,
  selectSupplementalGalleryAssets,
  serializeWorkOrderIssuedPdfSnapshot,
  type WorkOrderIssuedPdfAssetDescriptor,
} from "./snapshot";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY = /^[A-Za-z0-9._:-]{12,180}$/;
const SUPPORTED_INLINE_IMAGE = new Set(WORK_ORDER_PDF_INLINE_IMAGE_MIME_TYPES);

export class GeneratedDocumentGenerationError extends Error {
  constructor(readonly code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_ERROR" | "CONFLICT" | "DOCUMENT_NOT_READY" | "GENERATION_FAILED", readonly status: number, message: string) {
    super(message);
    this.name = "GeneratedDocumentGenerationError";
  }
}

type GeneratedRow = DbQueryResultRow & {
  readonly id: string;
  readonly status: "pending" | "generated" | "failed";
  readonly generation_no: number | string;
  readonly display_document_number: string;
  readonly failure_code: string | null;
  readonly generated_at: Date | string | null;
  readonly work_order_id: string;
  readonly work_order_revision_id: string;
};

function hash(value: string | Buffer) { return createHash("sha256").update(value).digest("hex"); }
function scope(input: { companyId: string; companyMemberId: string | null; correlationId: string }): TenantMemberScope {
  const companyMemberId = input.companyMemberId?.trim();
  if (!companyMemberId) throw new GeneratedDocumentGenerationError("FORBIDDEN", 403, "활성 회사 멤버가 필요합니다.");
  return {
    mode: "tenant_member",
    companyId: input.companyId as CompanyId,
    companyMemberId: companyMemberId as CompanyMemberId,
    permissionCodes: ["workorder.update"],
    correlationId: input.correlationId as CorrelationId,
  };
}

export async function loadWorkOrderPdfAssetManifest(tenantScope: TenantMemberScope, revisionId: string) {
  return withWaflV2TenantReadOnlyTransaction(async (client) => {
    await installTenantClaims(client, tenantScope);
    const result = await client.query<DbQueryResultRow>(`
      SELECT 'image' AS asset_type, ri.image_id AS revision_asset_id,
             ri.company_id, ri.filename_snapshot, ri.mime_type_snapshot,
             ri.storage_object_key_snapshot, ri.display_order, ri.is_representative,
             ri.output_include AS include_in_document, i.size_bytes AS source_size_bytes,
             i.content_sha256 AS source_content_sha256
      FROM work_order_revision_images ri
      JOIN work_order_images i ON i.company_id = ri.company_id AND i.id = ri.image_id
      WHERE ri.company_id = $1 AND ri.revision_id = $2::uuid
      UNION ALL
      SELECT 'attachment', ra.attachment_id, ra.company_id, ra.filename_snapshot,
             ra.mime_type_snapshot, ra.storage_object_key_snapshot, ra.display_order,
             false, ra.output_include, a.size_bytes, a.content_sha256
      FROM work_order_revision_attachments ra
      JOIN work_order_attachments a ON a.company_id = ra.company_id AND a.id = ra.attachment_id
      WHERE ra.company_id = $1 AND ra.revision_id = $2::uuid
      ORDER BY display_order, asset_type, revision_asset_id
    `, [tenantScope.companyId, revisionId]);
    return result.rows.map((row): WorkOrderIssuedPdfAssetDescriptor => ({
      assetType: String(row.asset_type) as "image" | "attachment",
      revisionAssetId: String(row.revision_asset_id),
      companyId: String(row.company_id),
      filename: String(row.filename_snapshot),
      mimeType: String(row.mime_type_snapshot).toLowerCase(),
      storageObjectKeySnapshot: row.storage_object_key_snapshot === null ? null : String(row.storage_object_key_snapshot),
      displayOrder: Number(row.display_order),
      isRepresentative: Boolean(row.is_representative),
      includeInDocument: Boolean(row.include_in_document),
      sourceSizeBytes: Number(row.source_size_bytes),
      sourceContentSha256: row.source_content_sha256 === null ? null : String(row.source_content_sha256).trim(),
    }));
  });
}

export async function readWorkOrderPdfAsset(asset: WorkOrderIssuedPdfAssetDescriptor): Promise<string> {
  if (!asset.storageObjectKeySnapshot) throw new Error("PDF_ASSET_STORAGE_KEY_MISSING");
  if (asset.assetType === "image") {
    let derivativeKey: string | null = null;
    try { derivativeKey = createWorkOrderImageDerivativeKeys(asset.storageObjectKeySnapshot).large; } catch { /* legacy image keys use the original object */ }
    if (derivativeKey) {
      const derivativeRequest = createR2WorkerFileUrl({ key: derivativeKey });
      const derivativeResponse = await fetch(derivativeRequest.url, { method: derivativeRequest.method });
      if (derivativeResponse.ok) {
        const contentType = derivativeResponse.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
        const body = Buffer.from(await derivativeResponse.arrayBuffer());
        inspectWorkOrderPdfInlineImage({
          declaredContentType: "image/webp",
          declaredSizeBytes: body.byteLength,
          declaredContentSha256: null,
          actualContentType: contentType,
          body,
        });
        return `data:image/webp;base64,${body.toString("base64")}`;
      }
      if (derivativeResponse.status !== 404) throw new Error(`PDF_ASSET_GET_FAILED_${derivativeResponse.status}`);
    }
  }
  const request = createR2WorkerFileUrl({ key: asset.storageObjectKeySnapshot });
  const response = await fetch(request.url, { method: request.method });
  if (!response.ok) throw new Error(`PDF_ASSET_GET_FAILED_${response.status}`);
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  const body = Buffer.from(await response.arrayBuffer());
  inspectWorkOrderPdfInlineImage({
    declaredContentType: asset.mimeType,
    declaredSizeBytes: asset.sourceSizeBytes,
    declaredContentSha256: asset.sourceContentSha256,
    actualContentType: contentType,
    body,
  });
  return `data:${asset.mimeType};base64,${body.toString("base64")}`;
}

function pdfFailureCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("PDF_ASSET_GET_FAILED_")) return "PDF_ASSET_GET_FAILED";
  if (message === "PDF_ASSET_CONTENT_TYPE_INVALID" || message === "PDF_ASSET_SIZE_INVALID") return "PDF_ASSET_OBJECT_INVALID";
  if (message === "PDF_ASSET_INTEGRITY_INVALID") return "PDF_ASSET_INTEGRITY_INVALID";
  if (message.startsWith("PDF_PAGE_ORIENTATION_INVALID")) return "PDF_PAGE_ORIENTATION_INVALID";
  if (message.startsWith("PDF_RENDER_")) return "PDF_RENDER_FAILED";
  if (message.startsWith("PDF_R2_")) return "PDF_R2_FAILED";
  if (message.startsWith("PDF_FINALIZE_")) return "PDF_FINALIZE_FAILED";
  return "PDF_GENERATION_FAILED";
}

function publicResult(row: GeneratedRow, replay: boolean) {
  return {
    generatedDocumentId: row.id,
    workOrderId: row.work_order_id,
    revisionId: row.work_order_revision_id,
    generationNumber: Number(row.generation_no),
    displayDocumentNumber: row.display_document_number,
    status: row.status,
    failureCode: row.failure_code,
    generatedAt: row.generated_at === null ? null : new Date(row.generated_at).toISOString(),
    idempotentReplay: replay,
  };
}

export async function generateIssuedWorkOrderDocument(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: string;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly idempotencyKey: string;
  readonly refreshActive?: boolean;
}) {
  const runtime = getWorkOrderV2DocumentR0MutationRuntimeGuard();
  if (!runtime.ok) throw new GeneratedDocumentGenerationError("FORBIDDEN", 403, "승인된 문서 생성 runtime에서만 실행할 수 있습니다.");
  if (!UUID.test(input.workOrderId) || !UUID.test(input.revisionId)) throw new GeneratedDocumentGenerationError("NOT_FOUND", 404, "발행된 작업지시서를 찾을 수 없습니다.");
  if (!KEY.test(input.idempotencyKey)) throw new GeneratedDocumentGenerationError("VALIDATION_ERROR", 400, "유효한 Idempotency-Key가 필요합니다.");
  const tenantScope = scope({ companyId: input.scope.companyId, companyMemberId: input.companyMemberId, correlationId: input.correlationId });
  const previewResult = await getIssuedWorkOrderPreviewV2({
    scope: tenantScope,
    workOrderId: input.workOrderId as WorkOrderId,
    revisionId: input.revisionId as WorkOrderRevisionId,
    assignedCompanyMemberId: input.scope.visibility?.mode === "assigned" ? input.scope.visibility.companyMemberId : null,
  });
  if (!previewResult.data) throw new GeneratedDocumentGenerationError("DOCUMENT_NOT_READY", 409, "발행 완료된 Revision만 생성할 수 있습니다.");
  const assets = await loadWorkOrderPdfAssetManifest(tenantScope, input.revisionId);
  const now = new Date().toISOString();
  const snapshot = createWorkOrderIssuedPdfSnapshot({
    companyId: input.scope.companyId,
    requestedWorkOrderId: input.workOrderId,
    requestedRevisionId: input.revisionId,
    documentType: "factory_instruction",
    preview: previewResult.data,
    assetManifest: assets,
    snapshotCreatedAt: now,
  });
  const scopedKey = hash([GENERATED_DOCUMENT_COMMAND_CODE, tenantScope.companyId, tenantScope.companyMemberId, input.workOrderId, input.revisionId, input.idempotencyKey].join("\0"));
  const requestHash = hash(JSON.stringify({ workOrderId: input.workOrderId, revisionId: input.revisionId, refreshActive: input.refreshActive === true }));

  const prepared = await withWaflV2TenantWriteTransaction(async (client) => {
    await installTenantClaims(client, tenantScope);
    const insertedReceipt = await client.query(`
      INSERT INTO work_order_command_receipts (company_id, command_code, idempotency_key, request_sha256, correlation_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (company_id, command_code, idempotency_key) DO NOTHING
    `, [tenantScope.companyId, GENERATED_DOCUMENT_COMMAND_CODE, scopedKey, requestHash, tenantScope.correlationId]);
    if (insertedReceipt.rowCount === 0) {
      const replay = await client.query<GeneratedRow & { readonly request_sha256: string }>(`
        SELECT receipt.request_sha256, document.*
        FROM work_order_command_receipts receipt
        JOIN generated_documents document ON document.company_id = receipt.company_id AND document.id = receipt.result_generated_document_id
        WHERE receipt.company_id = $1 AND receipt.command_code = $2 AND receipt.idempotency_key = $3
      `, [tenantScope.companyId, GENERATED_DOCUMENT_COMMAND_CODE, scopedKey]);
      const row = replay.rows[0];
      if (!row || row.request_sha256 !== requestHash) throw new GeneratedDocumentGenerationError("CONFLICT", 409, "같은 요청 키가 다른 문서 생성에 사용되었습니다.");
      return { row, replay: true };
    }
    const target = await client.query<DbQueryResultRow>(`
      SELECT w.id, w.entity_version, r.id AS revision_id
      FROM work_orders w JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND w.id = $2::uuid AND r.id = $3::uuid
        AND w.status IN ('issued','revised','completed') AND r.revision_status IN ('finalized','superseded')
      FOR SHARE OF w, r
    `, [tenantScope.companyId, input.workOrderId, input.revisionId]);
    if (!target.rows[0]) throw new GeneratedDocumentGenerationError("DOCUMENT_NOT_READY", 409, "발행 완료된 Revision만 생성할 수 있습니다.");
    await client.query(`SELECT pg_advisory_xact_lock(hashtextextended($1 || ':' || $2 || ':factory_instruction', 0))`, [tenantScope.companyId, input.revisionId]);
    const activeGeneration = await client.query<GeneratedRow>(`
      SELECT * FROM generated_documents
      WHERE company_id=$1 AND work_order_revision_id=$2::uuid AND document_type='factory_instruction'
        AND (
          status='generated'
          OR (status='pending' AND updated_at > now() - interval '5 minutes')
        )
        AND revoked_at IS NULL AND deleted_at IS NULL
      ORDER BY CASE status WHEN 'generated' THEN 0 ELSE 1 END, generation_no DESC
      LIMIT 1
    `, [tenantScope.companyId, input.revisionId]);
    const current = activeGeneration.rows[0];
    if (current) {
      if (input.refreshActive === true && current.status === "generated") {
        const refreshed = await client.query<GeneratedRow>(`
          UPDATE generated_documents
          SET status='pending', failure_code=NULL, renderer_version=$4, dto_schema_version=$5,
              snapshot=$6::jsonb, updated_at=now()
          WHERE company_id=$1 AND id=$2::uuid AND work_order_revision_id=$3::uuid
            AND status='generated' AND revoked_at IS NULL AND deleted_at IS NULL
          RETURNING *
        `, [tenantScope.companyId, current.id, input.revisionId, snapshot.rendererVersion, snapshot.dtoSchemaVersion, JSON.stringify(snapshot)]);
        const row = refreshed.rows[0];
        if (!row) throw new GeneratedDocumentGenerationError("CONFLICT", 409, "최신 문서 갱신을 시작하지 못했습니다.");
        await client.query(`
          UPDATE work_order_command_receipts
          SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_generated_document_id=$6::uuid,result_entity_version=$7
          WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
        `, [tenantScope.companyId, GENERATED_DOCUMENT_COMMAND_CODE, scopedKey, input.workOrderId, input.revisionId, row.id, Number(target.rows[0].entity_version)]);
        return { row, replay: false };
      }
      await client.query(`
        UPDATE work_order_command_receipts
        SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_generated_document_id=$6::uuid,result_entity_version=$7
        WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
      `, [tenantScope.companyId, GENERATED_DOCUMENT_COMMAND_CODE, scopedKey, input.workOrderId, input.revisionId, current.id, Number(target.rows[0].entity_version)]);
      return { row: current, replay: true };
    }
    const generation = await client.query<{ generation_no: number | string } & DbQueryResultRow>(`
      SELECT COALESCE(max(generation_no), 0) + 1 AS generation_no FROM generated_documents
      WHERE company_id = $1 AND work_order_revision_id = $2::uuid AND document_type = 'factory_instruction'
    `, [tenantScope.companyId, input.revisionId]);
    const generationNo = Number(generation.rows[0]?.generation_no ?? 1);
    const inserted = await client.query<GeneratedRow>(`
      INSERT INTO generated_documents (
        company_id, work_order_id, work_order_revision_id, document_type, generation_no,
        display_document_number, status, renderer_version, dto_schema_version, snapshot
      ) VALUES ($1,$2::uuid,$3::uuid,'factory_instruction',$4,$5,'pending',$6,$7,$8::jsonb)
      RETURNING *
    `, [tenantScope.companyId, input.workOrderId, input.revisionId, generationNo, snapshot.documentIdentity.displayDocumentNumber, snapshot.rendererVersion, snapshot.dtoSchemaVersion, JSON.stringify(snapshot)]);
    const row = inserted.rows[0];
    if (!row) throw new GeneratedDocumentGenerationError("GENERATION_FAILED", 500, "문서 생성을 준비하지 못했습니다.");
    await client.query(`
      UPDATE work_order_command_receipts
      SET work_order_id=$4::uuid,result_revision_id=$5::uuid,result_generated_document_id=$6::uuid,result_entity_version=$7
      WHERE company_id=$1 AND command_code=$2 AND idempotency_key=$3
    `, [tenantScope.companyId, GENERATED_DOCUMENT_COMMAND_CODE, scopedKey, input.workOrderId, input.revisionId, row.id, Number(target.rows[0].entity_version)]);
    return { row, replay: false };
  });

  if (prepared.replay) return publicResult(prepared.row, true);
  const representative = assets.find((asset) => asset.assetType === "image" && asset.isRepresentative);
  if (!representative) throw new GeneratedDocumentGenerationError("DOCUMENT_NOT_READY", 409, "대표 이미지가 필요합니다.");
  try {
    const representativeImageDataUrl = await readWorkOrderPdfAsset(representative);
    const includedSupplementalImages = await Promise.all(selectSupplementalGalleryAssets(assets, SUPPORTED_INLINE_IMAGE)
      .map(async (asset) => ({ filename: asset.filename, dataUrl: await readWorkOrderPdfAsset(asset) })));
    const canonicalSnapshotJson = serializeWorkOrderIssuedPdfSnapshot(snapshot);
    const snapshotSha256 = hashWorkOrderIssuedPdfSnapshot(snapshot);
    const objectKey = createWorkOrderPdfStorageKey({ companyId: tenantScope.companyId, workOrderId: input.workOrderId, pdfId: prepared.row.id });
    const runToken = randomBytes(16).toString("hex");
    await writeLocalIssuedPdfRenderInput(runToken, { snapshot, canonicalSnapshotJson, snapshotSha256, objectKeyPlan: objectKey, representativeImageDataUrl, includedAttachmentImages: includedSupplementalImages });
    const renderOrigin = process.env.WAFL_PDF_RENDER_ORIGIN?.trim() || "http://127.0.0.1:3100";
    const rendered = await new LocalChromiumIssuedWorkOrderPdfRenderer().render({
      snapshot,
      canonicalSnapshotJson,
      snapshotSha256,
      renderUrl: `${renderOrigin}/dev/workorder-pdf-render/${runToken}`,
      outputFileName: `${snapshot.documentIdentity.displayDocumentNumber}.pdf`,
      options: { printBackground: true, preferCssPageSize: true, maxFileSizeBytes: WORK_ORDER_PDF_MAX_FILE_SIZE_BYTES },
    });
    const store = new R2WorkerGeneratedDocumentObjectStore(new R2WorkerGeneratedDocumentTransport());
    const metadata = { key: objectKey, contentType: "application/pdf" as const, fileSizeBytes: rendered.fileSizeBytes, contentSha256: rendered.contentSha256 };
    await store.putPdf({ ...metadata, body: rendered.pdf });
    const head = await store.headPdf(objectKey);
    const body = await store.getPdf(objectKey);
    if (!head || !body || head.fileSizeBytes !== metadata.fileSizeBytes || head.contentSha256 !== metadata.contentSha256 || hash(body) !== metadata.contentSha256) {
      throw new Error("PDF_R2_VALIDATION_FAILED");
    }
    const finalized = await withWaflV2TenantWriteTransaction(async (client) => {
      await installTenantClaims(client, tenantScope);
      const result = await client.query<GeneratedRow>(`
        UPDATE generated_documents SET status='generated',storage_object_key=$4,file_size_bytes=$5,
          content_sha256=$6,generated_at=$7::timestamptz,updated_at=$7::timestamptz
        WHERE company_id=$1 AND id=$2::uuid AND work_order_revision_id=$3::uuid AND status='pending'
        RETURNING *
      `, [tenantScope.companyId, prepared.row.id, input.revisionId, objectKey, rendered.fileSizeBytes, rendered.contentSha256, new Date().toISOString()]);
      if (!result.rows[0]) throw new Error("PDF_FINALIZE_CONFLICT");
      await client.query(`
        INSERT INTO domain_events (company_id,entity_type,entity_id,command_code,actor_member_id,correlation_id,change_summary,metadata,schema_version)
        VALUES ($1,'generated_document',$2,$3,$4,$5,'작업지시서 PDF 생성 완료',$6::jsonb,1)
      `, [tenantScope.companyId, prepared.row.id, GENERATED_DOCUMENT_COMMAND_CODE, tenantScope.companyMemberId, tenantScope.correlationId, JSON.stringify({ workOrderId: input.workOrderId, revisionId: input.revisionId, generationNumber: Number(prepared.row.generation_no) })]);
      return result.rows[0];
    });
    return publicResult(finalized, false);
  } catch (error) {
    const failureCode = pdfFailureCode(error);
    console.error("[WORK_ORDER_PDF_GENERATION_FAILED]", {
      failureCode,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    await withWaflV2TenantWriteTransaction(async (client) => {
      await installTenantClaims(client, tenantScope);
      await client.query(`UPDATE generated_documents SET status='failed',failure_code=$3,updated_at=now() WHERE company_id=$1 AND id=$2::uuid AND status='pending'`, [tenantScope.companyId, prepared.row.id, failureCode]);
    });
    throw new GeneratedDocumentGenerationError("GENERATION_FAILED", 500, "문서 생성에 실패했습니다. 잠시 후 PDF 다시 생성을 시도해 주세요.");
  }
}
