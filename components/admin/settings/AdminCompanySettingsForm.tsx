"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_THEME_OPTIONS,
  type AdminSettingSaveState,
} from "@/lib/admin/settings/presentation";
import {
  getAdminSettingsDateLabels,
  getSelectedAdminLanguage,
  getSelectedAdminTheme,
  withAdminSettingsUiDraft,
} from "@/lib/admin/settings/selectors";
import { runSaveCompanySettingsFlow } from "@/lib/admin/settings/actionFlow";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";
import { persistAdminTheme } from "@/lib/admin/theme";
import { useI18n } from "@/lib/i18n";

type AdminCompanySettingsFormProps = {
  initialSettings: CompanySettings;
  companyName?: string;
};

function SaveStateBadge({ saveState, labels }: { saveState: AdminSettingSaveState; labels: ReturnType<typeof useI18n>["i18n"]["admin"]["settingsForm"]["badges"] }) {
  if (saveState === "saving") return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">{labels.saving}</span>;
  if (saveState === "saved") return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{labels.saved}</span>;
  if (saveState === "error") return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">{labels.error}</span>;
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{labels.idle}</span>;
}

function HeaderRefreshButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[var(--admin-theme-text-on-surface)] transition hover:bg-white/15"
    >
      <span aria-hidden="true">↻</span>
    </button>
  );
}

export default function AdminCompanySettingsForm({ initialSettings, companyName }: AdminCompanySettingsFormProps) {
  const { i18n, setLocale } = useI18n();
  const text = i18n.admin.settingsForm;
  const displayCompanyName = companyName ?? text.sampleCompanyName;
  const [draft, setDraft] = useState<CompanySettings>(initialSettings);
  const [saveState, setSaveState] = useState<AdminSettingSaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function saveNextSettings(nextSettings: CompanySettings) {
    if (saveState === "saving") return;
    if (nextSettings.ui.language !== draft.ui.language) {
      setLocale(nextSettings.ui.language);
    }
    if (nextSettings.ui.themeColor !== draft.ui.themeColor) {
      persistAdminTheme(nextSettings.ui.themeColor);
    }
    setDraft(nextSettings);
    setSaveState("saving");
    setErrorMessage(null);

    const result = await runSaveCompanySettingsFlow(nextSettings);
    if (!result.ok || !result.settings) {
      setSaveState("error");
      setErrorMessage(result.message || text.saveFailed);
      return;
    }

    setDraft(result.settings);
    setSaveState("saved");
  }

  const currentTheme = getSelectedAdminTheme(draft);
  const currentLanguage = getSelectedAdminLanguage(draft);
  const companyDate = getAdminSettingsDateLabels(draft.updatedAt, text);

  return (
    <AdminCard className="shrink-0 p-4">
      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[28px] bg-[var(--admin-theme-surface)] p-4 text-[var(--admin-theme-text-on-surface)] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{displayCompanyName}</h2>
              <p className="mt-2 text-xs font-semibold text-[var(--admin-theme-muted-on-surface)]">{text.planLabel}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--admin-theme-muted-on-surface)]">{companyDate.updatedAt}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <HeaderRefreshButton label={text.refreshLabel} />
              <SaveStateBadge saveState={saveState} labels={text.badges} />
            </div>
          </div>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">{text.summaryCards.status}</p>
              <p className="mt-2 text-sm font-semibold text-white">{text.summaryCards.statusValue}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">{text.summaryCards.joinedAt}</p>
              <p className="mt-2 text-sm font-semibold text-white">{companyDate.joinedAt}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">{text.summaryCards.age}</p>
              <p className="mt-2 text-sm font-semibold text-white">{companyDate.age}</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-[11px] font-semibold text-[var(--admin-theme-muted-on-surface)]">{text.summaryCards.members}</p>
              <p className="mt-2 text-sm font-semibold text-white">{text.summaryCards.memberValue}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-950">{text.themeTitle}</p>
                <p className="mt-1 text-xs font-semibold text-stone-500">{text.themeCurrentPrefix}{currentTheme.label}</p>
              </div>
              <span className={`h-8 w-8 rounded-2xl shadow-sm ring-1 ring-white ${currentTheme.swatchClassName}`} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {ADMIN_THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => saveNextSettings(withAdminSettingsUiDraft(draft, { themeColor: option.value }))}
                  disabled={saveState === "saving"}
                  className={`h-9 rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-60 ${draft.ui.themeColor === option.value ? "border-stone-950 bg-white" : "border-stone-200 bg-white/70 hover:bg-white"}`}
                >
                  <span className={`mx-auto block h-5 w-5 rounded-full ${option.swatchClassName}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-stone-200 bg-stone-50 p-3.5">
            <div>
              <p className="text-sm font-semibold text-stone-950">{text.languageTitle}</p>
              <p className="mt-1 text-xs font-semibold text-stone-500">{text.languageCurrentPrefix}{currentLanguage.label}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {ADMIN_LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => saveNextSettings(withAdminSettingsUiDraft(draft, { language: option.value }))}
                  disabled={saveState === "saving"}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${draft.ui.language === option.value ? "border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
      {errorMessage ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}
    </AdminCard>
  );
}
