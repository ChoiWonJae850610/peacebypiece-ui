import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
} from "@/components/public/ATypePublicFrame";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { buildServicePausedViewModel } from "@/lib/billing/companyAccessPresentation";
import { getI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ServicePausedPage() {
  const session = await getCurrentWaflSession();
  const accessState = session?.companyId ? await getCompanyAccessState(session.companyId) : null;
  const i18n = getI18n();
  const viewModel = buildServicePausedViewModel({
    session,
    accessState,
    copy: i18n.admin.servicePausedPage,
  });

  return (
    <ATypePublicFrame
      eyebrow={viewModel.eyebrow}
      title={
        <>
          {viewModel.title}
        </>
      }
      description={viewModel.description}
      heroItems={["서비스 상태", "고객사 계정", "요금제", "관리자 문의"]}
      footer={<p>{viewModel.notice}</p>}
    >
      <ATypePublicCard eyebrow="접근 상태" title={viewModel.statusLabel}>
        <dl className="grid gap-3 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4 text-sm">
          <div>
            <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.company}</dt>
            <dd className="mt-1 font-bold text-[var(--pbp-text-primary)]">{viewModel.companyName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.account}</dt>
            <dd className="mt-1 truncate font-bold text-[var(--pbp-text-primary)]">{viewModel.accountEmail}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.status}</dt>
            <dd className="mt-1 font-bold text-[var(--pbp-text-primary)]">{viewModel.statusLabel}</dd>
          </div>
        </dl>

        <ATypePublicNotice tone="warning">{viewModel.notice}</ATypePublicNotice>

        <div className="flex flex-wrap gap-2">
          <a
            href={viewModel.primaryActionHref}
            className="inline-flex h-11 items-center justify-center rounded-[var(--pbp-radius-lg)] bg-[var(--pbp-action-primary-surface)] px-5 text-sm font-bold text-[var(--pbp-action-primary-text)]"
          >
            {viewModel.primaryActionLabel}
          </a>
          {viewModel.primaryActionHref !== viewModel.secondaryActionHref ? (
            <a
              href={viewModel.secondaryActionHref}
              className="inline-flex h-11 items-center justify-center rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-5 text-sm font-bold text-[var(--pbp-text-primary)]"
            >
              {viewModel.secondaryActionLabel}
            </a>
          ) : null}
        </div>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
