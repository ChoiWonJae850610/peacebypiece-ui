"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { usePbpTheme } from "@/lib/theme/PbpThemeProvider";
import { getPbpThemeDefinition } from "@/lib/theme/themeRegistry";
import {
  DEFAULT_PERSONAL_SETTINGS,
  PERSONAL_LANGUAGE_OPTIONS,
  PERSONAL_THEME_OPTIONS,
  applyPersonalSettingsToDocument,
  readStoredPersonalSettings,
  writeStoredPersonalSettings,
  type PersonalSettingsDraft,
  type PersonalSettingsLanguage,
  type PersonalSettingsTheme,
} from "@/lib/me/personalSettings";

type PersonalSettingsCopy = ReturnType<typeof useI18n>["i18n"]["common"]["personalSettings"];

type ChoiceOption<TValue extends string> = {
  value: TValue;
  label: string;
  preview?: ReturnType<typeof getThemePreviewColors>;
};

function getThemePreviewColors(theme: PersonalSettingsTheme) {
  const themeDefinition = getPbpThemeDefinition(theme);

  return {
    accent: themeDefinition.cssVariables["--pbp-accent"] ?? "#1c1917",
    surface: themeDefinition.cssVariables["--pbp-surface"] ?? "#ffffff",
    selected: themeDefinition.cssVariables["--pbp-selected-surface"] ?? "#f5f5f4",
    border: themeDefinition.cssVariables["--pbp-border"] ?? "#e7e5e4",
  };
}

function ChoiceGroup<TValue extends string>({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description: string;
  options: Array<ChoiceOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <section className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{description}</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex min-h-[58px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                selected
                  ? "border-[var(--pbp-accent)] bg-[var(--pbp-selected-surface)] text-[var(--pbp-text-primary)] shadow-sm"
                  : "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)] hover:border-[var(--pbp-border-strong)] hover:text-[var(--pbp-text-primary)]"
              }`}
              aria-pressed={selected}
            >
              <span>{option.label}</span>
              {option.preview ? (
                <span className="flex items-center gap-1" aria-hidden="true">
                  <span
                    className="h-5 w-5 rounded-full border"
                    style={{ backgroundColor: option.preview.surface, borderColor: option.preview.border }}
                  />
                  <span className="h-5 w-5 rounded-full" style={{ backgroundColor: option.preview.selected }} />
                  <span className="h-5 w-5 rounded-full" style={{ backgroundColor: option.preview.accent }} />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function PersonalSettingsPanel({ className = "" }: { className?: string }) {
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
  }, [setLocale, setThemeId]);

  function commitDraft(nextDraft: PersonalSettingsDraft) {
    const normalizedDraft = writeStoredPersonalSettings(window.localStorage, nextDraft);
    setDraft(normalizedDraft);
    setLocale(normalizedDraft.language);
    setThemeId(normalizedDraft.theme);
    applyPersonalSettingsToDocument(normalizedDraft, document.documentElement);
  }

  function updateLanguage(language: PersonalSettingsLanguage) {
    commitDraft({ ...draft, language });
  }

  function updateTheme(theme: PersonalSettingsTheme) {
    commitDraft({ ...draft, theme });
  }

  const languageOptions = PERSONAL_LANGUAGE_OPTIONS.map((option) => ({
    value: option.value,
    label: copy.languageOptions[option.value],
  }));

  const themeOptions = PERSONAL_THEME_OPTIONS.map((option) => ({
    value: option.value,
    label: copy.themeOptions[option.value],
    preview: getThemePreviewColors(option.value),
  }));

  return (
    <div className={`space-y-4 ${className}`}>
      <ChoiceGroup
        title={copy.sections.language.title}
        description={copy.sections.language.description}
        options={languageOptions}
        value={draft.language}
        onChange={updateLanguage}
      />
      <ChoiceGroup
        title={copy.sections.theme.title}
        description={copy.sections.theme.description}
        options={themeOptions}
        value={draft.theme}
        onChange={updateTheme}
      />
      {!loaded ? <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">{copy.loading}</p> : null}
    </div>
  );
}

export default function PersonalSettingsPage() {
  const { i18n } = useI18n();
  const copy = i18n.common.personalSettings;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--pbp-text-primary)] md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <section className="rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-muted)]">WAFL</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--pbp-text-primary)]">{copy.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">{copy.description}</p>
        </section>
        <PersonalSettingsPanel />
      </div>
    </main>
  );
}
