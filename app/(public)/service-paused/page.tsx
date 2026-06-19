import { redirect } from "next/navigation";
import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
} from "@/components/public/ATypePublicFrame";
import { WaflLinkButton, WaflSurface } from "@/components/common/ui";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getCompanyAccessState } from "@/lib/billing/companyAccessRepository";
import { buildServicePausedViewModel } from "@/lib/billing/companyAccessPresentation";
import { getI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ServicePausedPage() {
  const session = await getCurrentWaflSession();
  const accessState = session?.companyId ? await getCompanyAccessState(session.companyId) : null;
  const i18n = getI18n();
  if (session?.companyId && accessState && accessState.workspaceBlockedReason === null) {
    redirect("/workspace");
  }

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
        <WaflSurface shape="control" tone="muted" component="public-access-state" className="grid gap-3 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.company}</p>
            <p className="mt-1 font-bold text-[var(--pbp-text-primary)]">{viewModel.companyName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.account}</p>
            <p className="mt-1 truncate font-bold text-[var(--pbp-text-primary)]">{viewModel.accountEmail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">{viewModel.labels.status}</p>
            <p className="mt-1 font-bold text-[var(--pbp-text-primary)]">{viewModel.statusLabel}</p>
          </div>
        </WaflSurface>

        <ATypePublicNotice tone="warning">{viewModel.notice}</ATypePublicNotice>

        <div className="flex flex-wrap gap-2">
          <WaflLinkButton href={viewModel.primaryActionHref} variant="primary" size="md">
            {viewModel.primaryActionLabel}
          </WaflLinkButton>
          {viewModel.primaryActionHref !== viewModel.secondaryActionHref ? (
            <WaflLinkButton href={viewModel.secondaryActionHref} variant="secondary" size="md">
              {viewModel.secondaryActionLabel}
            </WaflLinkButton>
          ) : null}
        </div>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
