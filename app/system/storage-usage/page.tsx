import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { SystemStoragePurgeCandidatesClient } from "@/components/system/storage/SystemStoragePurgeCandidatesClient";
import {
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_PAGE_CLASS,
  SYSTEM_PAGE_WIDE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { getDefaultAdminStorageQuotaPolicy } from "@/lib/billing/storageQuotaPolicy";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import { getSystemStoragePurgeCandidateSnapshot } from "@/lib/system/storagePurgeCandidates";

export default async function SystemStorageUsagePage() {
  const snapshot = await getSystemStoragePurgeCandidateSnapshot();
  const { summary, candidates } = snapshot;
  const storageQuotaPolicy = getDefaultAdminStorageQuotaPolicy(true);
  const storageCopy = getI18n().system.storageUsage;

  return (
    <main className={SYSTEM_PAGE_CLASS}>
      <div className={SYSTEM_PAGE_WIDE_CLASS}>
        <header className={SYSTEM_HEADER_PANEL_CLASS}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className={SYSTEM_EYEBROW_CLASS}>
                {storageCopy.pageEyebrow}
              </p>
              <div className="space-y-2">
                <h1 className={SYSTEM_TITLE_CLASS}>
                  {storageCopy.pageTitle}
                </h1>
                <p className={SYSTEM_SUBTITLE_CLASS}>
                  {storageCopy.pageDescription}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs font-medium sm:flex-row sm:flex-wrap">
              <AdminStatusBadge>v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system" size="sm">
                {storageCopy.consoleLink}
              </AdminLinkButton>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-5">
          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{storageCopy.summary.candidateTitle}</p>
            <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{summary.candidateCount}개</p>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{storageCopy.summary.fileUnit} {summary.fileCandidateCount}개 · {storageCopy.summary.workOrderUnit} {summary.workorderCandidateCount}개</p>
          </article>
          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{storageCopy.summary.retryTitle}</p>
            <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{summary.failedCount}개</p>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{storageCopy.summary.retryDescriptionPrefix} {summary.retryRequiredCount}개</p>
          </article>
          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{storageCopy.summary.originalSizeTitle}</p>
            <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{summary.totalOriginalSizeLabel}</p>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{storageCopy.summary.sizeDescriptionPrefix} {summary.companyCount}곳</p>
          </article>
          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{storageCopy.summary.thumbnailTitle}</p>
            <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{summary.thumbnailObjectCount}개</p>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{storageCopy.summary.thumbnailDescription}</p>
          </article>
          <article className={SYSTEM_CARD_CLASS}>
            <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{storageCopy.summary.quotaTitle}</p>
            <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{storageQuotaPolicy.limitLabel}</p>
            <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>
              {storageQuotaPolicy.sourceLabel} · {storageCopy.summary.quotaDescription}
            </p>
          </article>
        </section>

        <SystemStoragePurgeCandidatesClient candidates={candidates} />
      </div>
    </main>
  );
}
