import { AdminCard } from "@/components/admin/layout/AdminCard";
import AppBadge, { type AppBadgeTone } from "@/components/common/ui/AppBadge";
import { WaflInfoBox } from "@/components/common/ui/WaflForm";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import {
  buildOrganizationSettingsViewModel,
  type OrganizationSettingSummaryUnit,
} from "@/lib/admin/settings/organizationSettingsPresentation";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";
import { getI18n } from "@/lib/i18n";

type AdminOrganizationSettingsSummaryProps = {
  settings: CompanySettings;
  companyName: string;
};

function formatSummaryValue(
  value: number,
  unit: OrganizationSettingSummaryUnit,
  units: Record<OrganizationSettingSummaryUnit, string>,
): string {
  if (unit === "percent") return `${value}${units[unit]}`;
  return `${value}${units[unit]}`;
}

function getStatusTone(status: "active" | "fixed" | "planned"): AppBadgeTone {
  if (status === "active") return "success";
  if (status === "fixed") return "neutral";
  return "warning";
}

export default function AdminOrganizationSettingsSummary({
  settings,
  companyName,
}: AdminOrganizationSettingsSummaryProps) {
  const text = getI18n().admin.settingsForm;
  const viewModel = buildOrganizationSettingsViewModel(settings);

  return (
    <AdminCard className="shrink-0 p-4">
      <section className="wafl-shape-surface bg-[var(--admin-theme-surface)] p-5 text-[var(--admin-theme-text-on-surface)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <AppBadge size="sm" tone="inverse">
                {text.organization.badge}
              </AppBadge>
              <AppBadge size="sm" tone="inverse">
                {companyName}
              </AppBadge>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">
              {text.organization.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--admin-theme-muted-on-surface)]">
              {text.organization.description}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {viewModel.summaryCards.map((card) => {
            const copy =
              text.organization.summaryCards[
                card.id as keyof typeof text.organization.summaryCards
              ];
            return (
              <div
                key={card.id}
                className="wafl-shape-control bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-3"
              >
                <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">
                  {copy.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-inverse)]">
                  {formatSummaryValue(
                    card.value,
                    card.unit,
                    text.organization.summaryUnits,
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <WaflSurface shape="control" tone="muted" className="p-4">
          <h3 className="text-base font-semibold text-[var(--pbp-text-primary)]">
            {text.organization.scopeTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
            {text.organization.scopeDescription}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {viewModel.scopeCards.map((card) => {
              const copy = text.organization.scopes[card.id];
              return (
                <WaflSurface
                  key={card.id}
                  shape="control"
                  tone="surface"
                  className="p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">
                      {copy.title}
                    </p>
                    <AppBadge size="xs" tone={getStatusTone(card.status)}>
                      {text.organization.statusLabels[card.status]}
                    </AppBadge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                    {copy.description}
                  </p>
                </WaflSurface>
              );
            })}
          </div>
        </WaflSurface>

        <WaflSurface shape="control" tone="info" className="p-4">
          <h3 className="text-base font-semibold text-[var(--pbp-status-info-fg)]">
            {text.organization.personalSettings.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-status-info-fg)] opacity-80">
            {text.organization.personalSettings.description}
          </p>
          <WaflInfoBox
            shape="control"
            tone="info"
            className="mt-4 text-xs leading-5"
          >
            {text.organization.personalSettings.note}
          </WaflInfoBox>
        </WaflSurface>
      </section>
    </AdminCard>
  );
}
