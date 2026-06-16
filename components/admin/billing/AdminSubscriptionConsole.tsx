import {
  AdminButton,
  AdminLinkButton,
} from "@/components/admin/common/AdminButton";
import WaflBadge from "@/components/common/ui/WaflBadge";
import { WaflInfoBox } from "@/components/common/ui/WaflForm";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import type { AdminSubscriptionViewModel } from "@/lib/admin/billing/adminSubscription.presentation";

type AdminSubscriptionConsoleProps = {
  viewModel: AdminSubscriptionViewModel;
};

export default function AdminSubscriptionConsole({
  viewModel,
}: AdminSubscriptionConsoleProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <WaflSurface
        shape="surface"
        tone="surface"
        className="p-5 shadow-sm sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[0.22em] pbp-text-muted">
          {viewModel.eyebrow}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight pbp-text-primary">
              {viewModel.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 pbp-text-muted">
              {viewModel.description}
            </p>
          </div>
          <WaflBadge size="sm" tone="brand">
            {viewModel.statusLabel}
          </WaflBadge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {viewModel.metrics.map((metric) => (
            <WaflSurface
              as="article"
              key={metric.label}
              shape="control"
              tone="muted"
              className="p-4"
            >
              <p className="text-xs font-semibold pbp-text-muted">
                {metric.label}
              </p>
              <p className="mt-2 text-lg font-bold pbp-text-primary">
                {metric.value}
              </p>
              <p className="mt-2 text-xs leading-5 pbp-text-muted">
                {metric.description}
              </p>
            </WaflSurface>
          ))}
        </div>

        <WaflSurface shape="control" tone="muted" className="mt-5 p-4">
          <p className="text-sm font-bold pbp-text-primary">
            {viewModel.statusLabel}
          </p>
          <p className="mt-2 text-sm leading-6 pbp-text-muted">
            {viewModel.statusDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminButton type="button" disabled variant="primary" size="md">
              {viewModel.primaryActionLabel}
            </AdminButton>
            <AdminLinkButton
              href="/api/auth/logout"
              variant="secondary"
              size="md"
            >
              {viewModel.secondaryActionLabel}
            </AdminLinkButton>
          </div>
        </WaflSurface>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {viewModel.plans.map((plan) => (
            <WaflSurface
              as="article"
              key={plan.code}
              shape="control"
              tone="surface"
              className="p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold pbp-text-primary">
                  {plan.name}
                </h3>
                <WaflBadge size="xs" tone="brand">
                  {plan.statusLabel}
                </WaflBadge>
              </div>
              <p className="mt-3 text-xl font-bold pbp-text-primary">
                {plan.priceLabel}
              </p>
              <dl className="mt-4 grid gap-2 text-xs pbp-text-muted">
                <div className="flex justify-between gap-3">
                  <dt>{viewModel.storageLabel}</dt>
                  <dd className="font-bold pbp-text-primary">
                    {plan.storageLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{viewModel.memberLabel}</dt>
                  <dd className="font-bold pbp-text-primary">
                    {plan.memberLabel}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-5 pbp-text-muted">
                {plan.description}
              </p>
            </WaflSurface>
          ))}
        </div>
      </WaflSurface>

      <WaflSurface
        as="aside"
        shape="surface"
        tone="surface"
        className="p-5 shadow-sm"
      >
        <h3 className="text-base font-bold pbp-text-primary">
          {viewModel.memberNoticeTitle}
        </h3>
        <p className="mt-2 text-sm leading-6 pbp-text-muted">
          {viewModel.memberNoticeDescription}
        </p>
        <div className="mt-5 space-y-2">
          {viewModel.policyNotes.map((note) => (
            <WaflInfoBox
              key={note}
              shape="control"
              tone="muted"
              className="px-3 py-2 text-xs leading-5"
            >
              {note}
            </WaflInfoBox>
          ))}
        </div>
      </WaflSurface>
    </section>
  );
}
