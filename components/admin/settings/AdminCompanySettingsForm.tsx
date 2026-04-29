"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_THEME_OPTIONS,
  getAdminSettingsUpdatedAtLabel,
  type AdminSettingSaveState,
} from "@/lib/admin/adminSettings.presentation";
import { runSaveCompanySettingsFlow } from "@/lib/admin/adminSettings.actionFlow";
import type { CompanySettings } from "@/lib/admin/companySettings.types";
import { persistAdminTheme } from "@/lib/admin/theme";
import { useI18n } from "@/lib/i18n";

type AdminCompanySettingsFormProps = {
  initialSettings: CompanySettings;
  companyName?: string;
};

function formatCompanyDateLabel(updatedAt: string | null | undefined, text: ReturnType<typeof useI18n>["i18n"]["admin"]["settingsForm"]) {
  if (!updatedAt) return { joinedAt: text.joinedPending, age: "D+0", updatedAt: text.updatedPending };
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return { joinedAt: text.joinedPending, age: "D+0", updatedAt: text.updatedPending };
  const start = new Date(parsed);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ageDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const joinedAt = `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${String(parsed.getDate()).padStart(2, "0")}`;

  return {
    joinedAt,
    age: `D+${ageDays}`,
    updatedAt: getAdminSettingsUpdatedAtLabel(updatedAt)?.replace("최근 저장 ", text.updatedPrefix) ?? text.updatedPending,
  };
}

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

export default function AdminCompanySettingsForm({ initialSettings, companyName = "샘플 고객사" }: AdminCompanySettingsFormProps) {
  const { i18n, setLocale } = useI18n();
  const text = i18n.admin.settingsForm;
  const [draft, setDraft] = useState<CompanySettings>(initialSettings);
  const [saveState, setSaveState] = useState<AdminSettingSaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function saveNextSettings(nextSettings: CompanySettings) {
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

  const currentTheme = ADMIN_THEME_OPTIONS.find((option) => option.value === draft.ui.themeColor) ?? ADMIN_THEME_OPTIONS[0];
  const currentLanguage = ADMIN_LANGUAGE_OPTIONS.find((option) => option.value === draft.ui.language) ?? ADMIN_LANGUAGE_OPTIONS[0];
  const companyDate = formatCompanyDateLabel(draft.updatedAt, text);

  return (
    <AdminCard className="shrink-0 p-4">
      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.85fr]">
        <section className="rounded-[28px] bg-[var(--admin-theme-surface)] p-4 text-[var(--admin-theme-text-on-surface)] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{companyName}</h2>
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
                  onClick={() => saveNextSettings({ ...draft, ui: { ...draft.ui, themeColor: option.value } })}
                  className={`h-9 rounded-2xl border transition ${draft.ui.themeColor === option.value ? "border-stone-950 bg-white" : "border-stone-200 bg-white/70 hover:bg-white"}`}
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
                  onClick={() => saveNextSettings({ ...draft, ui: { ...draft.ui, language: option.value } })}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${draft.ui.language === option.value ? "border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}
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
