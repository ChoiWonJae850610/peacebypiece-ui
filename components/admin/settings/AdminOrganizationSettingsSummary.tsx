import Link from "next/link";

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
  if (status === "fixed") return "bg-stone-100 text-stone-600";
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
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{text.organization.badge}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">{companyName}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">{text.organization.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--admin-theme-muted-on-surface)]">{text.organization.description}</p>
          </div>
          <Link
            href={viewModel.personalSettingsHref}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-white/90"
          >
            {text.organization.personalSettings.actionLabel}
          </Link>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {viewModel.summaryCards.map((card) => {
            const copy = text.organization.summaryCards[card.id as keyof typeof text.organization.summaryCards];
            return (
              <div key={card.id} className="rounded-2xl bg-white/10 px-3 py-3">
                <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">{copy.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{formatSummaryValue(card.value, card.unit, text.organization.summaryUnits)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
          <h3 className="text-base font-semibold text-stone-950">{text.organization.scopeTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-500">{text.organization.scopeDescription}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {viewModel.scopeCards.map((card) => {
              const copy = text.organization.scopes[card.id];
              return (
                <div key={card.id} className="rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-950">{copy.title}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(card.status)}`}>
                      {text.organization.statusLabels[card.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-500">{copy.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <h3 className="text-base font-semibold text-blue-950">{text.organization.personalSettings.title}</h3>
          <p className="mt-2 text-sm leading-6 text-blue-800/75">{text.organization.personalSettings.description}</p>
          <div className="mt-4 rounded-2xl bg-white/80 px-3 py-3 text-xs leading-5 text-blue-900/75">
            {text.organization.personalSettings.note}
          </div>
        </div>
      </section>
    </AdminCard>
  );
}
