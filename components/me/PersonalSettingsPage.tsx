"use client";

import { useEffect, useMemo, useState } from "react";

import { useCurrentUser } from "@/components/auth/CurrentUserProvider";
import {
  WaflBadge,
  WaflButton,
  WaflInfoBox,
  WaflInput,
  WaflLinkButton,
  WaflSelectableCard,
  WaflSurface,
} from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";
import { RUNTIME_VISIBILITY } from "@/lib/runtime/runtimeMode";
import { usePbpTheme } from "@/lib/theme/PbpThemeProvider";
import { getPbpThemeDefinition } from "@/lib/theme/themeRegistry";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "@/lib/utils/phoneFormat";
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

type PersonalSettingsCopy = ReturnType<
  typeof useI18n
>["i18n"]["common"]["personalSettings"];

const PERSONAL_LANGUAGE_SWITCHER_ENABLED =
  RUNTIME_VISIBILITY.showPersonalLanguageSwitcher;

function resolveVisiblePersonalSettings(
  settings: PersonalSettingsDraft,
): PersonalSettingsDraft {
  if (PERSONAL_LANGUAGE_SWITCHER_ENABLED) return settings;
  return { ...settings, language: DEFAULT_PERSONAL_SETTINGS.language };
}

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
  memberStatus: string | null;
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
    selected:
      themeDefinition.cssVariables["--pbp-selected-surface"] ?? "#f5f5f4",
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
    <WaflSurface
      as="section"
      component="personal-settings-choice-section"
      shape="control"
      tone="surface"
      className="p-3 sm:p-4"
    >
      <div>
        <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
          {description}
        </p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <WaflSelectableCard
              key={option.value}
              component="personal-settings-choice-card"
              selected={selected}
              onClick={() => onChange(option.value)}
              className="min-h-11 px-3 py-2.5 text-sm font-semibold sm:min-h-12 sm:px-4"
              aria-pressed={selected}
            >
              <span>{option.label}</span>
              {option.preview ? (
                <span className="flex items-center gap-1" aria-hidden="true">
                  <span
                    className="h-5 w-5 rounded-full border"
                    style={{
                      backgroundColor: option.preview.surface,
                      borderColor: option.preview.border,
                    }}
                  />
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: option.preview.selected }}
                  />
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: option.preview.accent }}
                  />
                </span>
              ) : null}
            </WaflSelectableCard>
          );
        })}
      </div>
    </WaflSurface>
  );
}

function buildProfileDraft(
  profile: PersonalProfile | null,
): PersonalProfileDraft {
  return {
    name: profile?.name ?? "",
    phone: formatPhoneNumber(profile?.phone ?? ""),
    birthday: profile?.birthday ?? "",
  };
}

function ProfileSection({ copy }: { copy: PersonalSettingsCopy }) {
  const { refreshCurrentUser } = useCurrentUser();
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [draft, setDraft] = useState<PersonalProfileDraft>(() =>
    buildProfileDraft(null),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profileComplete = Boolean(profile?.profileComplete);
  const isCompanyAdminProfile = profile?.roleTemplateCode === "company_admin";
  const isWithdrawalRequested =
    profile?.memberStatus === "withdrawal_requested";
  const isWithdrawn = profile?.memberStatus === "withdrawn";
  const canRequestWithdrawal = Boolean(
    profile?.companyMemberId &&
    !isCompanyAdminProfile &&
    !isWithdrawalRequested &&
    !isWithdrawn,
  );
  const canSave = useMemo(() => {
    return Boolean(
      draft.name.trim() && normalizePhoneNumber(draft.phone).length >= 10,
    );
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
        const payload = (await response.json()) as {
          profile: PersonalProfile | null;
        };
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

  async function requestWithdrawal() {
    if (!canRequestWithdrawal || requestingWithdrawal) return;
    const confirmed = window.confirm(copy.profile.withdrawal.confirm);
    if (!confirmed) return;

    setRequestingWithdrawal(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/me/profile/withdrawal", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("PROFILE_WITHDRAWAL_REQUEST_FAILED");
      const payload = (await response.json()) as {
        profile: PersonalProfile | null;
      };
      setProfile(payload.profile);
      setDraft(buildProfileDraft(payload.profile));
      setMessage(copy.profile.withdrawal.requested);
      await refreshCurrentUser();
    } catch {
      setError(copy.profile.withdrawal.error);
    } finally {
      setRequestingWithdrawal(false);
    }
  }

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
      const payload = (await response.json()) as {
        profile: PersonalProfile | null;
      };
      setProfile(payload.profile);
      setDraft(buildProfileDraft(payload.profile));
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("wafl-profile-updated"));
      setMessage(copy.profile.saved);
      await refreshCurrentUser();
    } catch {
      setError(copy.profile.errors.save);
    } finally {
      setSaving(false);
    }
  }

  return (
    <WaflSurface
      as="section"
      component="personal-profile-section"
      shape="control"
      tone="surface"
      className="p-3 sm:p-4"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
            {copy.profile.title}
          </h3>
          <WaflBadge tone={profileComplete ? "success" : "warning"} size="sm">
            {profileComplete ? copy.profile.complete : copy.profile.incomplete}
          </WaflBadge>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
          {copy.profile.description}
        </p>
      </div>

      {!profileComplete ? (
        <WaflInfoBox
          component="personal-profile-required-notice"
          tone="info"
          state="info"
          density="compact"
          className="mt-4 text-xs font-semibold leading-5 text-[var(--pbp-text-primary)]"
        >
          {copy.profile.requiredNotice}
        </WaflInfoBox>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.name}
          <WaflInput
            fieldSize="sm"
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={copy.profile.placeholders.name}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.phone}
          <WaflInput
            fieldSize="sm"
            value={draft.phone}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                phone: formatPhoneNumber(event.target.value),
              }))
            }
            placeholder={copy.profile.placeholders.phone}
            inputMode="tel"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.birthday}
          <div className="flex gap-2">
            <WaflInput
              fieldSize="sm"
              value={draft.birthday}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  birthday: event.target.value,
                }))
              }
              className="min-w-0 flex-1"
              type="date"
            />
            <WaflButton
              variant="secondary"
              size="sm"
              onClick={() =>
                setDraft((current) => ({ ...current, birthday: "" }))
              }
              disabled={!draft.birthday}
              className="px-3 text-xs"
            >
              {copy.profile.clearBirthday}
            </WaflButton>
          </div>
        </label>
        <div className="flex flex-col gap-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
          {copy.profile.fields.email}
          <WaflInfoBox
            component="personal-profile-email-field"
            tone="muted"
            density="compact"
            className="text-sm font-semibold text-[var(--pbp-text-subtle)]"
          >
            {profile?.email || "-"}
          </WaflInfoBox>
        </div>
      </div>

      <WaflInfoBox
        component="personal-profile-withdrawal-card"
        tone="warning"
        state="warning"
        density="default"
        className="mt-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[var(--pbp-text-primary)]">
              {copy.profile.withdrawal.title}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
              {isCompanyAdminProfile
                ? copy.profile.withdrawal.companyAdminBlocked
                : isWithdrawalRequested
                  ? copy.profile.withdrawal.pending
                  : isWithdrawn
                    ? copy.profile.withdrawal.withdrawn
                    : copy.profile.withdrawal.description}
            </p>
          </div>
          <WaflButton
            variant="danger"
            size="sm"
            onClick={requestWithdrawal}
            disabled={!canRequestWithdrawal || requestingWithdrawal}
          >
            {requestingWithdrawal
              ? copy.profile.withdrawal.requesting
              : copy.profile.withdrawal.action}
          </WaflButton>
        </div>
      </WaflInfoBox>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div
          data-wafl-component="personal-profile-message"
          className="text-xs font-semibold text-[var(--pbp-text-muted)]"
        >
          {loading
            ? copy.profile.loading
            : message || error || copy.profile.helper}
        </div>
        <WaflButton
          variant="primary"
          size="md"
          onClick={saveProfile}
          disabled={!canSave || saving}
          className="px-4 text-xs"
        >
          {saving ? copy.profile.saving : copy.profile.save}
        </WaflButton>
      </div>
    </WaflSurface>
  );
}

export function PersonalSettingsPanel({
  className = "",
}: {
  className?: string;
}) {
  const { i18n, setLocale } = useI18n();
  const copy = i18n.common.personalSettings;
  const { setThemeId } = usePbpTheme();
  const [draft, setDraft] = useState<PersonalSettingsDraft>(
    DEFAULT_PERSONAL_SETTINGS,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedSettings = resolveVisiblePersonalSettings(
      readStoredPersonalSettings(window.localStorage),
    );
    setDraft(storedSettings);
    setLocale(storedSettings.language);
    setThemeId(storedSettings.theme);
    applyPersonalSettingsToDocument(storedSettings, document.documentElement);
    setLoaded(true);
  }, [setLocale, setThemeId]);

  function commitDraft(nextDraft: PersonalSettingsDraft) {
    const visibleDraft = resolveVisiblePersonalSettings(nextDraft);
    const normalizedDraft = writeStoredPersonalSettings(
      window.localStorage,
      visibleDraft,
    );
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
      {PERSONAL_LANGUAGE_SWITCHER_ENABLED ? (
        <ChoiceGroup
          title={copy.sections.language.title}
          description={copy.sections.language.description}
          options={languageOptions}
          value={draft.language}
          onChange={updateLanguage}
        />
      ) : null}
      <ChoiceGroup
        title={copy.sections.theme.title}
        description={copy.sections.theme.description}
        options={themeOptions}
        value={draft.theme}
        onChange={updateTheme}
      />

      <WaflSurface
        as="section"
        component="personal-policy-access-section"
        shape="control"
        tone="surface"
        className="p-3 sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
              {copy.policyAccess.title}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">
              {copy.policyAccess.description}
            </p>
          </div>
          <WaflLinkButton
            href="/workspace/legal"
            variant="secondary"
            size="sm"
            className="px-4"
          >
            {copy.policyAccess.action}
          </WaflLinkButton>
        </div>
      </WaflSurface>
      {!loaded ? (
        <p className="text-xs font-semibold text-[var(--pbp-text-subtle)]">
          {copy.loading}
        </p>
      ) : null}
    </div>
  );
}

export default function PersonalSettingsPage() {
  const { i18n } = useI18n();
  const copy = i18n.common.personalSettings;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--pbp-text-primary)] md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <WaflSurface
          as="section"
          component="personal-settings-hero"
          className="p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-muted)]">
            WAFL
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--pbp-text-primary)]">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
            {copy.description}
          </p>
        </WaflSurface>
        <PersonalSettingsPanel />
      </div>
    </main>
  );
}
