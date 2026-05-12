import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { SystemStoragePurgeCandidatesClient } from "@/components/system/storage/SystemStoragePurgeCandidatesClient";
import { getDefaultAdminStorageQuotaPolicy } from "@/lib/billing/storageQuotaPolicy";
import { APP_VERSION } from "@/lib/constants/app";
import { getSystemStoragePurgeCandidateSnapshot } from "@/lib/system/storagePurgeCandidates";
import { SYSTEM_STORAGE_PURGE_COPY } from "@/lib/system/storagePurgePresentation";

export default async function SystemStorageUsagePage() {
  const snapshot = await getSystemStoragePurgeCandidateSnapshot();
  const { summary, candidates } = snapshot;
  const storageQuotaPolicy = getDefaultAdminStorageQuotaPolicy(true);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                {SYSTEM_STORAGE_PURGE_COPY.pageEyebrow}
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  {SYSTEM_STORAGE_PURGE_COPY.pageTitle}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  {SYSTEM_STORAGE_PURGE_COPY.pageDescription}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system" size="sm">
                {SYSTEM_STORAGE_PURGE_COPY.consoleLink}
              </AdminLinkButton>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{SYSTEM_STORAGE_PURGE_COPY.summary.candidateTitle}</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.candidateCount}개</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">{SYSTEM_STORAGE_PURGE_COPY.summary.fileUnit} {summary.fileCandidateCount}개 · {SYSTEM_STORAGE_PURGE_COPY.summary.workOrderUnit} {summary.workorderCandidateCount}개</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{SYSTEM_STORAGE_PURGE_COPY.summary.retryTitle}</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.failedCount}개</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">{SYSTEM_STORAGE_PURGE_COPY.summary.retryDescriptionPrefix} {summary.retryRequiredCount}개</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{SYSTEM_STORAGE_PURGE_COPY.summary.originalSizeTitle}</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.totalOriginalSizeLabel}</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">{SYSTEM_STORAGE_PURGE_COPY.summary.sizeDescriptionPrefix} {summary.companyCount}곳</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{SYSTEM_STORAGE_PURGE_COPY.summary.thumbnailTitle}</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.thumbnailObjectCount}개</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">{SYSTEM_STORAGE_PURGE_COPY.summary.thumbnailDescription}</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">{SYSTEM_STORAGE_PURGE_COPY.summary.quotaTitle}</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{storageQuotaPolicy.limitLabel}</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              {storageQuotaPolicy.sourceLabel} · {SYSTEM_STORAGE_PURGE_COPY.summary.quotaDescription}
            </p>
          </article>
        </section>

        <SystemStoragePurgeCandidatesClient candidates={candidates} />
      </div>
    </main>
  );
}
