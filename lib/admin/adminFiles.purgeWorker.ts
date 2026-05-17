import "server-only";

import {
  listPurgeReadyAttachmentTrashItems,
  markAttachmentTrashItemPurgeFailed,
  markAttachmentTrashItemsPurged,
  type AdminPurgeCandidate,
} from "@/lib/admin/adminFiles.serverActions";
import { deleteR2ObjectViaWorker } from "@/lib/storage/r2/r2WorkerUpload";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { getCompanySettings, listAdminCompanies } from "@/lib/admin/settings/companyRepository";

export type AdminFilePurgeWorkerInput = {
  limit?: number;
  dryRun?: boolean;
};

export type AdminFilePurgeWorkerItemResult = {
  trashItemId: string;
  attachmentId: string;
  storageKey: string | null;
  thumbnailKey: string | null;
  status: "ready" | "purged" | "failed";
  errorMessage?: string;
};

export type AdminFilePurgeWorkerResult = {
  dryRun: boolean;
  candidateCount: number;
  purgedCount: number;
  failedCount: number;
  items: AdminFilePurgeWorkerItemResult[];
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function getDeleteKeys(candidate: AdminPurgeCandidate): string[] {
  return Array.from(
    new Set([candidate.storageKey, candidate.thumbnailKey].filter((key): key is string => typeof key === "string" && key.trim().length > 0)),
  );
}

async function purgeCandidate(candidate: AdminPurgeCandidate): Promise<AdminFilePurgeWorkerItemResult> {
  const keys = getDeleteKeys(candidate);

  try {
    for (const key of keys) {
      await deleteR2ObjectViaWorker({ key });
      deleteCachedR2UrlsByKey(key);
    }

    await markAttachmentTrashItemsPurged({ trashItemIds: [candidate.trashItemId], actorId: "purge-worker" });

    return {
      trashItemId: candidate.trashItemId,
      attachmentId: candidate.attachmentId,
      storageKey: candidate.storageKey,
      thumbnailKey: candidate.thumbnailKey,
      status: "purged",
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    await markAttachmentTrashItemPurgeFailed({ trashItemId: candidate.trashItemId, errorMessage });

    return {
      trashItemId: candidate.trashItemId,
      attachmentId: candidate.attachmentId,
      storageKey: candidate.storageKey,
      thumbnailKey: candidate.thumbnailKey,
      status: "failed",
      errorMessage,
    };
  }
}

export async function runAdminFilePurgeWorker(input: AdminFilePurgeWorkerInput = {}): Promise<AdminFilePurgeWorkerResult> {
  const dryRun = input.dryRun ?? true;
  const limit = input.limit ?? 50;
  const companies = await listAdminCompanies();
  const activeCompanies = companies.filter((company) => company.isActive);
  const candidates: AdminPurgeCandidate[] = [];

  for (const company of activeCompanies) {
    if (candidates.length >= limit) break;

    const settings = await getCompanySettings(company.id);
    const companyCandidates = await listPurgeReadyAttachmentTrashItems({
      companyId: company.id,
      limit: limit - candidates.length,
      trashRetentionDays: settings.filePolicy.trashRetentionDays,
    });

    candidates.push(...companyCandidates);
  }

  if (dryRun) {
    return {
      dryRun,
      candidateCount: candidates.length,
      purgedCount: 0,
      failedCount: 0,
      items: candidates.map((candidate) => ({
        trashItemId: candidate.trashItemId,
        attachmentId: candidate.attachmentId,
        storageKey: candidate.storageKey,
        thumbnailKey: candidate.thumbnailKey,
        status: "ready",
      })),
    };
  }

  const items: AdminFilePurgeWorkerItemResult[] = [];
  for (const candidate of candidates) {
    items.push(await purgeCandidate(candidate));
  }

  return {
    dryRun,
    candidateCount: candidates.length,
    purgedCount: items.filter((item) => item.status === "purged").length,
    failedCount: items.filter((item) => item.status === "failed").length,
    items,
  };
}
