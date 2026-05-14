"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { useI18n } from "@/lib/i18n";
import { usePbpTheme } from "@/lib/theme/PbpThemeProvider";
import { getPbpThemeDefinition } from "@/lib/theme/themeRegistry";
import {
  DEFAULT_PERSONAL_SETTINGS,
  applyPersonalSettingsToDocument,
  PERSONAL_DEFAULT_HOME_OPTIONS,
  PERSONAL_DENSITY_OPTIONS,
  PERSONAL_LANGUAGE_OPTIONS,
  PERSONAL_THEME_OPTIONS,
  readStoredPersonalSettings,
  resetStoredPersonalSettings,
  resolvePersonalSettingsHomeRoute,
  writeStoredPersonalSettings,
  type PersonalSettingsDefaultHome,
  type PersonalSettingsDensity,
  type PersonalSettingsDraft,
  type PersonalSettingsLanguage,
  type PersonalSettingsTheme,
} from "@/lib/me/personalSettings";

type PersonalSettingsOptionGroupProps<TValue extends string> = {
  title: string;
  description: string;
  options: Array<{ value: TValue }>;
  value: TValue;
  getLabel: (value: TValue) => string;
  onChange: (value: TValue) => void;
};

type PersonalSettingsCopy = ReturnType<typeof useI18n>["i18n"]["common"]["personalSettings"];

function getDensityClassName(density: PersonalSettingsDensity): string {
  return density === "compact" ? "gap-3 md:py-5" : "gap-5 md:py-8";
}

function getThemePreviewColors(theme: PersonalSettingsTheme) {
  const themeDefinition = getPbpThemeDefinition(theme);

  return {
    accent: themeDefinition.cssVariables["--pbp-accent"] ?? "#1c1917",
    surface: themeDefinition.cssVariables["--pbp-surface"] ?? "#ffffff",
    selected: themeDefinition.cssVariables["--pbp-selected-surface"] ?? "#f5f5f4",
    border: themeDefinition.cssVariables["--pbp-border"] ?? "#e7e5e4",
  };
}

function PersonalSettingsOptionGroup<TValue extends string>({
  title,
  description,
  options,
  value,
  getLabel,
  onChange,
}: PersonalSettingsOptionGroupProps<TValue>) {
  return (
    <section className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--pbp-text-primary)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={selected
                ? "pbp-action-primary inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition"
                : "pbp-action-secondary inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition"}
            >
              {getLabel(option.value)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PersonalThemeOptionGroup({ copy, value, onChange }: { copy: PersonalSettingsCopy; value: PersonalSettingsTheme; onChange: (value: PersonalSettingsTheme) => void }) {
  return (
    <section className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--pbp-text-primary)]">{copy.sections.theme.title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">{copy.sections.theme.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PERSONAL_THEME_OPTIONS.map((option) => {
          const selected = option.value === value;
          const previewColors = getThemePreviewColors(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={selected
                ? "rounded-2xl border border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] px-3 py-3 text-left shadow-sm transition"
                : "rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-3 text-left transition hover:bg-[var(--pbp-surface-muted)]"}
            >
              <span className="flex h-9 w-full overflow-hidden rounded-xl border" style={{ borderColor: previewColors.border }}>
                <span className="h-full flex-1" style={{ backgroundColor: previewColors.surface }} />
                <span className="h-full flex-1" style={{ backgroundColor: previewColors.selected }} />
                <span className="h-full flex-1" style={{ backgroundColor: previewColors.accent }} />
              </span>
              <span className="mt-3 block text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.themeOptions[option.value]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PersonalSettingsSummary({ copy, draft, onReset }: { copy: PersonalSettingsCopy; draft: PersonalSettingsDraft; onReset: () => void }) {
  const defaultHomeHref = resolvePersonalSettingsHomeRoute(draft.defaultHome);

  return (
    <section className="rounded-[30px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-5 py-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--pbp-action-primary-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-action-primary-text)]">PeacebyPiece</span>
            <span className="rounded-full bg-[var(--pbp-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">{WORKSPACE_COMPANY_NAME}</span>
            <span className="rounded-full bg-[var(--pbp-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">v{APP_VERSION}</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--pbp-text-primary)]">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pbp-text-muted)]">{copy.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={defaultHomeHref} className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800">
            {copy.actions.openDefaultHome}
          </Link>
          <Link href="/workspace" className="inline-flex items-center justify-center rounded-full border border-[var(--pbp-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--pbp-text-primary)] transition hover:bg-[var(--pbp-surface-muted)]">
            {copy.actions.workspaceHome}
          </Link>
          <button type="button" onClick={onReset} className="inline-flex items-center justify-center rounded-full border border-[var(--pbp-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--pbp-text-primary)] transition hover:bg-[var(--pbp-surface-muted)]">
            {copy.actions.reset}
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-3">
          <p className="text-[11px] font-semibold text-[var(--pbp-text-muted)]">{copy.summary.language}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.languageOptions[draft.language]}</p>
        </div>
        <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-3">
          <p className="text-[11px] font-semibold text-[var(--pbp-text-muted)]">{copy.summary.theme}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.themeOptions[draft.theme]}</p>
        </div>
        <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-3">
          <p className="text-[11px] font-semibold text-[var(--pbp-text-muted)]">{copy.summary.density}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.densityOptions[draft.density]}</p>
        </div>
        <div className="rounded-2xl bg-[var(--pbp-surface-muted)] px-3 py-3">
          <p className="text-[11px] font-semibold text-[var(--pbp-text-muted)]">{copy.summary.defaultHome}</p>
          <p className="mt-2 text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.defaultHomeOptions[draft.defaultHome]}</p>
        </div>
      </div>
    </section>
  );
}

export default function PersonalSettingsPage() {
  const { i18n, setLocale } = useI18n();
  const copy = i18n.common.personalSettings;
  const { setThemeId } = usePbpTheme();
  const [draft, setDraft] = useState<PersonalSettingsDraft>(DEFAULT_PERSONAL_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedSettings = readStoredPersonalSettings(window.localStorage);
    setDraft(storedSettings);
    setLocale(storedSettings.language);
    setThemeId(storedSettings.theme);
    applyPersonalSettingsToDocument(storedSettings, document.documentElement);
    setLoaded(true);
  }, []);

  function commitDraft(nextDraft: PersonalSettingsDraft, persist: (storage: Storage | null | undefined, settings: PersonalSettingsDraft) => PersonalSettingsDraft = writeStoredPersonalSettings) {
    const normalizedDraft = persist(window.localStorage, nextDraft);
    setDraft(normalizedDraft);
    setLocale(normalizedDraft.language);
    setThemeId(normalizedDraft.theme);
    applyPersonalSettingsToDocument(normalizedDraft, document.documentElement);
  }

  function updateDraft(nextDraft: PersonalSettingsDraft) {
    commitDraft(nextDraft);
  }

  function resetDraft() {
    commitDraft(DEFAULT_PERSONAL_SETTINGS, resetStoredPersonalSettings);
  }

  function updateLanguage(language: PersonalSettingsLanguage) {
    updateDraft({ ...draft, language });
  }

  function updateTheme(theme: PersonalSettingsTheme) {
    updateDraft({ ...draft, theme });
  }

  function updateDensity(density: PersonalSettingsDensity) {
    updateDraft({ ...draft, density });
  }

  function updateDefaultHome(defaultHome: PersonalSettingsDefaultHome) {
    updateDraft({ ...draft, defaultHome });
  }

  return (
    <main className={`min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--pbp-text-primary)] md:px-6 ${getDensityClassName(draft.density)}`}>
      <div className={`mx-auto flex w-full max-w-6xl flex-col ${draft.density === "compact" ? "gap-3" : "gap-5"}`}>
        <PersonalSettingsSummary copy={copy} draft={draft} onReset={resetDraft} />

        <div className="grid gap-4 lg:grid-cols-2">
          <PersonalSettingsOptionGroup
            title={copy.sections.language.title}
            description={copy.sections.language.description}
            options={PERSONAL_LANGUAGE_OPTIONS}
            value={draft.language}
            getLabel={(value) => copy.languageOptions[value]}
            onChange={updateLanguage}
          />
          <PersonalThemeOptionGroup copy={copy} value={draft.theme} onChange={updateTheme} />
          <PersonalSettingsOptionGroup
            title={copy.sections.density.title}
            description={copy.sections.density.description}
            options={PERSONAL_DENSITY_OPTIONS}
            value={draft.density}
            getLabel={(value) => copy.densityOptions[value]}
            onChange={updateDensity}
          />
          <PersonalSettingsOptionGroup
            title={copy.sections.defaultHome.title}
            description={copy.sections.defaultHome.description}
            options={PERSONAL_DEFAULT_HOME_OPTIONS}
            value={draft.defaultHome}
            getLabel={(value) => copy.defaultHomeOptions[value]}
            onChange={updateDefaultHome}
          />
        </div>

        <section className="rounded-3xl border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface-muted)] p-5 text-sm leading-6 text-[var(--pbp-text-muted)]">
          <p className="font-semibold text-[var(--pbp-text-primary)]">{copy.policyNote.title}</p>
          <p className="mt-2">{copy.policyNote.description}</p>
          {!loaded ? <p className="mt-2 text-xs font-semibold text-[var(--pbp-text-subtle)]">{copy.loading}</p> : null}
        </section>
      </div>
    </main>
  );
}
