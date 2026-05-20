import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { buildServicePausedViewModel } from "@/lib/billing/companyAccessPresentation";
import { APP_VERSION } from "@/lib/constants/app";
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
    <main className="grid min-h-screen place-items-center bg-[var(--pbp-page-bg)] px-5 py-10 text-[var(--pbp-text-primary)]">
      <section className="w-full max-w-2xl rounded-[32px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pbp-text-muted)]">
          {viewModel.eyebrow} · WAFL v{APP_VERSION}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{viewModel.title}</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--pbp-text-muted)]">{viewModel.description}</p>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-1 text-xs font-bold text-[var(--pbp-text-muted)]">
            {viewModel.statusLabel}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.company}</dt>
            <dd className="mt-1 font-bold">{viewModel.companyName}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.account}</dt>
            <dd className="mt-1 truncate font-bold">{viewModel.accountEmail}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.status}</dt>
            <dd className="mt-1 font-bold">{viewModel.statusLabel}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4 text-sm leading-6 text-[var(--pbp-text-muted)]">
          {viewModel.notice}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={viewModel.primaryActionHref}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--pbp-primary)] px-5 text-sm font-bold text-white"
          >
            {viewModel.primaryActionLabel}
          </a>
          {viewModel.primaryActionHref !== viewModel.secondaryActionHref ? (
            <a
              href={viewModel.secondaryActionHref}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-5 text-sm font-bold text-[var(--pbp-text-primary)]"
            >
              {viewModel.secondaryActionLabel}
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
