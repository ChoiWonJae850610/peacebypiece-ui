import "server-only";

import { createHash } from "node:crypto";

import type {
  WorkOrderDocumentType,
  WorkOrderIssuedPreviewReadModel,
} from "@/lib/domain/work-orders/contracts";
import {
  WORK_ORDER_PDF_ALLOWED_REVISION_STATUSES,
  WORK_ORDER_PDF_ALLOWED_WORK_ORDER_STATUSES,
  WORK_ORDER_PDF_DTO_SCHEMA_VERSION,
  WORK_ORDER_PDF_RENDERER_VERSION,
} from "@/lib/generated-documents/work-order-pdf/constants";

export type WorkOrderIssuedPdfAssetDescriptor = {
  readonly assetType: "image" | "attachment";
  readonly revisionAssetId: string;
  readonly companyId: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly storageObjectKeySnapshot: string | null;
  readonly displayOrder: number;
  readonly isRepresentative: boolean;
  readonly includeInDocument: boolean;
  readonly sourceSizeBytes: number;
  readonly sourceContentSha256: string | null;
};

export type WorkOrderIssuedPdfSnapshot = {
  readonly documentIdentity: {
    readonly documentType: WorkOrderDocumentType;
    readonly displayDocumentNumber: string;
    readonly revisionNumber: number;
    readonly issuedAt: string;
  };
  readonly companyIdentity: {
    readonly companyId: string;
  };
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly preview: WorkOrderIssuedPreviewReadModel;
  readonly assetManifest: readonly WorkOrderIssuedPdfAssetDescriptor[];
  readonly rendererVersion: string;
  readonly dtoSchemaVersion: typeof WORK_ORDER_PDF_DTO_SCHEMA_VERSION;
  readonly snapshotCreatedAt: string;
  readonly businessTimezone: string;
};

export type WorkOrderPdfSnapshotErrorCode =
  | "PDF_REVISION_NOT_FINALIZED"
  | "PDF_DOCUMENT_NUMBER_MISSING"
  | "PDF_PREVIEW_NOT_READY"
  | "PDF_ASSET_SCOPE_INVALID"
  | "PDF_TENANT_SCOPE_INVALID";

export class WorkOrderPdfSnapshotError extends Error {
  readonly code: WorkOrderPdfSnapshotErrorCode;

  constructor(code: WorkOrderPdfSnapshotErrorCode) {
    super(code);
    this.name = "WorkOrderPdfSnapshotError";
    this.code = code;
  }
}

function assertIsoDateTime(value: string): string {
  const normalized = new Date(value).toISOString();
  if (normalized !== value) throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
  return normalized;
}

function assertSafeAssetManifest(
  companyId: string,
  assets: readonly WorkOrderIssuedPdfAssetDescriptor[],
): readonly WorkOrderIssuedPdfAssetDescriptor[] {
  for (const asset of assets) {
    if (asset.companyId !== companyId) {
      throw new WorkOrderPdfSnapshotError("PDF_ASSET_SCOPE_INVALID");
    }
    if (!asset.filename.trim() || !asset.mimeType.trim() || asset.sourceSizeBytes < 0) {
      throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
    }
    if (asset.storageObjectKeySnapshot?.includes("..")) {
      throw new WorkOrderPdfSnapshotError("PDF_ASSET_SCOPE_INVALID");
    }
    if (asset.sourceContentSha256 && !/^[0-9a-f]{64}$/.test(asset.sourceContentSha256)) {
      throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
    }
  }

  return [...assets].sort((left, right) =>
    left.displayOrder - right.displayOrder
    || left.assetType.localeCompare(right.assetType)
    || left.revisionAssetId.localeCompare(right.revisionAssetId));
}

export function createWorkOrderIssuedPdfSnapshot(input: {
  readonly companyId: string;
  readonly requestedWorkOrderId: string;
  readonly requestedRevisionId: string;
  readonly documentType: WorkOrderDocumentType;
  readonly preview: WorkOrderIssuedPreviewReadModel;
  readonly assetManifest: readonly WorkOrderIssuedPdfAssetDescriptor[];
  readonly snapshotCreatedAt: string;
}): WorkOrderIssuedPdfSnapshot {
  const { preview } = input;
  if (!input.companyId.trim()) {
    throw new WorkOrderPdfSnapshotError("PDF_TENANT_SCOPE_INVALID");
  }
  if (preview.header.workOrderId !== input.requestedWorkOrderId
    || preview.header.revisionId !== input.requestedRevisionId) {
    throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
  }
  if (!WORK_ORDER_PDF_ALLOWED_WORK_ORDER_STATUSES.has(preview.issue.workOrderStatus)
    || !WORK_ORDER_PDF_ALLOWED_REVISION_STATUSES.has(preview.issue.revisionStatus)) {
    throw new WorkOrderPdfSnapshotError("PDF_REVISION_NOT_FINALIZED");
  }
  if (!preview.document.displayDocumentNumber.trim()) {
    throw new WorkOrderPdfSnapshotError("PDF_DOCUMENT_NUMBER_MISSING");
  }
  if (preview.layoutMetadata.schemaVersion !== 1
    || preview.layoutMetadata.businessTimezone !== "Asia/Seoul") {
    throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
  }

  return {
    documentIdentity: {
      documentType: input.documentType,
      displayDocumentNumber: preview.document.displayDocumentNumber,
      revisionNumber: preview.document.revisionNumber,
      issuedAt: assertIsoDateTime(preview.document.issuedAt),
    },
    companyIdentity: { companyId: input.companyId },
    workOrderId: preview.header.workOrderId,
    revisionId: preview.header.revisionId,
    preview,
    assetManifest: assertSafeAssetManifest(input.companyId, input.assetManifest),
    rendererVersion: WORK_ORDER_PDF_RENDERER_VERSION,
    dtoSchemaVersion: WORK_ORDER_PDF_DTO_SCHEMA_VERSION,
    snapshotCreatedAt: assertIsoDateTime(input.snapshotCreatedAt),
    businessTimezone: preview.layoutMetadata.businessTimezone,
  };
}

function normalizeCanonicalValue(value: unknown, inArray = false): unknown {
  if (value === undefined) return inArray ? null : undefined;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new WorkOrderPdfSnapshotError("PDF_PREVIEW_NOT_READY");
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeCanonicalValue(item, true));
  }
  if (value && typeof value === "object") {
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const next = normalizeCanonicalValue((value as Record<string, unknown>)[key]);
      if (next !== undefined) normalized[key] = next;
    }
    return normalized;
  }
  return value;
}

export function serializeWorkOrderIssuedPdfSnapshot(snapshot: WorkOrderIssuedPdfSnapshot): string {
  return JSON.stringify(normalizeCanonicalValue(snapshot));
}

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashWorkOrderIssuedPdfSnapshot(snapshot: WorkOrderIssuedPdfSnapshot): string {
  return sha256Hex(Buffer.from(serializeWorkOrderIssuedPdfSnapshot(snapshot), "utf8"));
}

export function selectRepresentativeAsset(
  assets: readonly WorkOrderIssuedPdfAssetDescriptor[],
): WorkOrderIssuedPdfAssetDescriptor | null {
  const images = assets.filter((asset) => asset.assetType === "image");
  return images.find((asset) => asset.isRepresentative)
    ?? images.find((asset) => asset.includeInDocument)
    ?? null;
}
