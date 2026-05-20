
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { buildOrganizationSettingsViewModel, type OrganizationSettingSummaryUnit } from "@/lib/admin/settings/organizationSettingsPresentation";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";
import { getI18n } from "@/lib/i18n";

type AdminOrganizationSettingsSummaryProps = {
  settings: CompanySettings;
  companyName: string;
};


function formatSummaryValue(value: number, unit: OrganizationSettingSummaryUnit, units: Record<OrganizationSettingSummaryUnit, string>): string {
  if (unit === "percent") return `${value}${units[unit]}`;
  return `${value}${units[unit]}`;
}

function getStatusClassName(status: "active" | "fixed" | "planned"): string {
  if (status === "active") return "bg-emerald-50 text-emerald-700";
  if (status === "fixed") return "bg-[var(--pbp-status-neutral-bg)] text-[var(--pbp-status-neutral-fg)]";
  return "bg-amber-50 text-amber-700";
}

export default function AdminOrganizationSettingsSummary({ settings, companyName }: AdminOrganizationSettingsSummaryProps) {
  const text = getI18n().admin.settingsForm;
  const viewModel = buildOrganizationSettingsViewModel(settings);

  return (
    <AdminCard className="shrink-0 p-4">
      <section className="rounded-[30px] bg-[var(--admin-theme-surface)] p-5 text-[var(--admin-theme-text-on-surface)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--pbp-text-inverse)]">{text.organization.badge}</span>
              <span className="rounded-full bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-1 text-xs font-semibold text-[color:color-mix(in_srgb,var(--pbp-text-inverse)_80%,transparent)]">{companyName}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">{text.organization.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--admin-theme-muted-on-surface)]">{text.organization.description}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {viewModel.summaryCards.map((card) => {
            const copy = text.organization.summaryCards[card.id as keyof typeof text.organization.summaryCards];
            return (
              <div key={card.id} className="rounded-2xl bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-3">
                <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">{copy.label}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-inverse)]">{formatSummaryValue(card.value, card.unit, text.organization.summaryUnits)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
          <h3 className="text-base font-semibold text-[var(--pbp-text-primary)]">{text.organization.scopeTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">{text.organization.scopeDescription}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {viewModel.scopeCards.map((card) => {
              const copy = text.organization.scopes[card.id];
              return (
                <div key={card.id} className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(card.status)}`}>
                      {text.organization.statusLabels[card.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{copy.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <h3 className="text-base font-semibold text-blue-950">{text.organization.personalSettings.title}</h3>
          <p className="mt-2 text-sm leading-6 text-blue-800/75">{text.organization.personalSettings.description}</p>
          <div className="mt-4 rounded-2xl bg-[var(--pbp-status-info-bg)] px-3 py-3 text-xs leading-5 text-[var(--pbp-status-info-fg)]">
            {text.organization.personalSettings.note}
          </div>
        </div>
      </section>
    </AdminCard>
  );
}
