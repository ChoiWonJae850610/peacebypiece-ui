import type { CompanyId, StorageUsageSnapshot } from "./planTypes";
import { queryDb, type DbQueryResultRow } from "@/lib/db/client";

export interface StorageUsageSummary {
  companyId: CompanyId;
  usedBytes: number;
  attachmentCount: number;
  measuredAt: string;
  source: StorageUsageSnapshot["source"];
  note: string;
}

export interface CreateStorageUsageSnapshotInput {
  companyId: CompanyId;
  usedBytes?: number;
  attachmentCount?: number;
  source?: StorageUsageSnapshot["source"];
  memo?: string | null;
}

export interface StorageUsageRepository {
  getStorageUsageSummary(companyId: CompanyId): Promise<StorageUsageSummary>;
  createStorageUsageSnapshot(
    input: CreateStorageUsageSnapshotInput,
  ): Promise<StorageUsageSnapshot>;
}

type StorageUsageSummaryRow = DbQueryResultRow & {
  used_bytes: string | number | null;
  attachment_count: string | number | null;
  measured_at: string | Date | null;
};

type StorageUsageSnapshotRow = DbQueryResultRow & {
  id: string;
  company_id: string;
  used_bytes: string | number;
  attachment_count: string | number;
  source: StorageUsageSnapshot["source"];
  measured_at: string | Date;
};

function toNonNegativeInteger(value: unknown): number {
  const parsed = Math.trunc(Number(value ?? 0));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toIso(value: string | Date | null | undefined): string {
  if (!value) return new Date().toISOString();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeCompanyId(companyId: CompanyId): CompanyId {
  return companyId.trim();
}

function mapSnapshotRow(row: StorageUsageSnapshotRow): StorageUsageSnapshot {
  return {
    id: row.id,
    companyId: row.company_id,
    usedBytes: toNonNegativeInteger(row.used_bytes),
    attachmentCount: toNonNegativeInteger(row.attachment_count),
    measuredAt: toIso(row.measured_at),
    source: row.source,
  };
}

export function createStorageUsageRepository(): StorageUsageRepository {
  return {
    async getStorageUsageSummary(companyId: CompanyId) {
      const normalizedCompanyId = normalizeCompanyId(companyId);
      const result = await queryDb<StorageUsageSummaryRow>(
        `WITH active_attachments AS (
           SELECT
             COALESCE(SUM(size_bytes), 0)::bigint AS used_bytes,
             COUNT(*)::int AS attachment_count,
             MAX(updated_at) AS measured_at
           FROM attachments
           WHERE company_id = $1::text
             AND deleted_at IS NULL
             AND COALESCE(is_active, true) = true
         ), active_trash AS (
           SELECT
             COALESCE(SUM(COALESCE(size_bytes, 0)), 0)::bigint AS used_bytes,
             COUNT(*)::int AS attachment_count,
             MAX(updated_at) AS measured_at
           FROM attachment_trash_items
           WHERE company_id = $1::text
             AND restored_at IS NULL
             AND purged_at IS NULL
         )
         SELECT
           (COALESCE(a.used_bytes, 0) + COALESCE(t.used_bytes, 0))::bigint AS used_bytes,
           (COALESCE(a.attachment_count, 0) + COALESCE(t.attachment_count, 0))::int AS attachment_count,
           GREATEST(a.measured_at, t.measured_at, now()) AS measured_at
         FROM active_attachments a
         CROSS JOIN active_trash t`,
        [normalizedCompanyId],
      );
      const row = result.rows[0];

      return {
        companyId: normalizedCompanyId,
        usedBytes: toNonNegativeInteger(row?.used_bytes),
        attachmentCount: toNonNegativeInteger(row?.attachment_count),
        measuredAt: toIso(row?.measured_at),
        source: "db_attachment_metadata",
        note: "DB attachment metadata aggregation. Includes active attachments and unresolved trash metadata; R2 inventory reconciliation is tracked separately.",
      };
    },

    async createStorageUsageSnapshot(input: CreateStorageUsageSnapshotInput) {
      const normalizedCompanyId = normalizeCompanyId(input.companyId);
      const usedBytes = toNonNegativeInteger(input.usedBytes);
      const attachmentCount = toNonNegativeInteger(input.attachmentCount);
      const source = input.source ?? "db_attachment_metadata";
      const memo =
        typeof input.memo === "string" && input.memo.trim().length > 0
          ? input.memo.trim()
          : null;
      const result = await queryDb<StorageUsageSnapshotRow>(
        `INSERT INTO storage_usage_snapshots (
           company_id,
           used_bytes,
           attachment_count,
           source,
           memo
         )
         VALUES ($1::text, $2::bigint, $3::int, $4::storage_usage_snapshot_source, $5::text)
         RETURNING id, company_id, used_bytes, attachment_count, source, measured_at`,
        [normalizedCompanyId, usedBytes, attachmentCount, source, memo],
      );
      const snapshot = result.rows[0];
      if (!snapshot) {
        throw new Error("STORAGE_USAGE_SNAPSHOT_CREATE_FAILED");
      }

      return mapSnapshotRow(snapshot);
    },
  };
}

export const storageUsageRepository = createStorageUsageRepository();
