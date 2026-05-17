"use client";

import { useEffect, useMemo, useState } from "react";

import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import { useI18n } from "@/lib/i18n";
import { usePbpTheme } from "@/lib/theme/PbpThemeProvider";
import { getPbpThemeDefinition } from "@/lib/theme/themeRegistry";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/utils/phoneFormat";
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

type PersonalProfile = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  birthday: string;
  companyId: string | null;
  companyName: string | null;
  companyMemberId: string | null;
  roleTemplateCode: string | null;
  profileComplete: boolean;
};

type PersonalProfileDraft = {
  name: string;
  phone: string;
  birthday: string;
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

function buildProfileDraft(profile: PersonalProfile | null): PersonalProfileDraft {
  return {
    name: profile?.name ?? "",
    phone: formatPhoneNumber(profile?.phone ?? ""),
    birthday: profile?.birthday ?? "",
  };
}

function ProfileSection({ copy }: { copy: PersonalSettingsCopy }) {
  const { refreshCurrentUser } = useCurrentUser();
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [draft, setDraft] = useState<PersonalProfileDraft>(() => buildProfileDraft(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileComplete = Boolean(profile?.profileComplete);
  const canSave = useMemo(() => {
    return Boolean(draft.name.trim() && normalizePhoneNumber(draft.phone).length >= 10 && draft.birthday);
  }, [draft]);

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/me/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("PROFILE_LOAD_FAILED");
        const payload = (await response.json()) as { profile: PersonalProfile | null };
        if (!alive) return;
        setProfile(payload.profile);
        setDraft(buildProfileDraft(payload.profile));
      } catch {
        if (alive) setError(copy.profile.errors.load);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      alive = false;
    };
  }, [copy.profile.errors.load]);

  async function saveProfile() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          phone: normalizePhoneNumber(draft.phone),
          birthday: draft.birthday,
        }),
      });

      if (!response.ok) throw new Error("PROFILE_SAVE_FAILED");
      const payload = (await response.json()) as { profile: PersonalProfile | null };
      setProfile(payload.profile);
      setDraft(buildProfileDraft(payload.profile));
      setMessage(copy.profile.saved);
      await refreshCurrentUser();
    } catch {
      setError(copy.profile.errors.save);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 shadow-sm sm:p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.profile.title}</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              profileComplete
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {profileComplete ? copy.profile.complete : copy.profile.incomplete}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{copy.profile.description}</p>
      </div>

      {!profileComplete ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
          {copy.profile.requiredNotice}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.name}
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2.5 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-accent)]"
            placeholder={copy.profile.placeholders.name}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.phone}
          <input
            value={draft.phone}
            onChange={(event) => setDraft((current) => ({ ...current, phone: formatPhoneNumber(event.target.value) }))}
            className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2.5 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-accent)]"
            placeholder={copy.profile.placeholders.phone}
            inputMode="tel"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.birthday}
          <input
            value={draft.birthday}
            onChange={(event) => setDraft((current) => ({ ...current, birthday: event.target.value }))}
            className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2.5 text-sm font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-accent)]"
            type="date"
          />
        </label>
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.email}
          <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-2.5 text-sm font-semibold text-[var(--pbp-text-subtle)]">
            {profile?.email || "-"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-[var(--pbp-text-muted)]">
          {loading ? copy.profile.loading : message || error || copy.profile.helper}
        </div>
        <button
          type="button"
          onClick={saveProfile}
          disabled={!canSave || saving}
          className="rounded-2xl border border-stone-900 bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
        >
          {saving ? copy.profile.saving : copy.profile.save}
        </button>
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
      <ProfileSection copy={copy} />
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
