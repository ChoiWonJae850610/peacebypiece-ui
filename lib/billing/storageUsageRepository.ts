import type { CompanyId, StorageUsageSnapshot } from "./planTypes";

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

const storageUsageSnapshots: StorageUsageSnapshot[] = [];

function createSnapshotId(companyId: CompanyId): string {
  return `snapshot-${companyId}-${Date.now()}`;
}

function getLatestSnapshot(companyId: CompanyId): StorageUsageSnapshot | null {
  return (
    storageUsageSnapshots
      .filter((snapshot) => snapshot.companyId === companyId)
      .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0] ?? null
  );
}

export function createStorageUsageRepository(): StorageUsageRepository {
  return {
    async getStorageUsageSummary(companyId: CompanyId) {
      const latest = getLatestSnapshot(companyId);

      if (!latest) {
        return {
          companyId,
          usedBytes: 0,
          attachmentCount: 0,
          measuredAt: new Date().toISOString(),
          source: "db_attachment_metadata",
          note: "skeleton default summary. Connect DB attachment metadata aggregation before production use.",
        };
      }

      return {
        companyId: latest.companyId,
        usedBytes: latest.usedBytes,
        attachmentCount: latest.attachmentCount,
        measuredAt: latest.measuredAt,
        source: latest.source,
        note: "latest storage usage snapshot",
      };
    },

    async createStorageUsageSnapshot(input: CreateStorageUsageSnapshotInput) {
      const now = new Date().toISOString();
      const snapshot: StorageUsageSnapshot = {
        id: createSnapshotId(input.companyId),
        companyId: input.companyId,
        usedBytes: Math.max(0, input.usedBytes ?? 0),
        attachmentCount: Math.max(0, input.attachmentCount ?? 0),
        measuredAt: now,
        source: input.source ?? "db_attachment_metadata",
      };

      storageUsageSnapshots.unshift(snapshot);

      return snapshot;
    },
  };
}

export const storageUsageRepository = createStorageUsageRepository();
