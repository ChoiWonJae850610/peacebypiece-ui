"use client";

import { type InputHTMLAttributes, type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/utils/phoneFormat";

type CompanyOnboardingProfile = {
  companyId: string;
  companyName: string;
  companyEnglishName: string;
  businessName: string;
  businessRegistrationNumber: string;
  logoUrl: string;
  postalCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  addressExtra: string;
  requestedPlanCode: string;
  onboardingStatus: "profile_required" | "approval_pending" | "active";
  onboardingCompletedAt?: string | null;
  subscriptionStatus: "trialing" | "trial_expired" | "active" | "past_due" | "canceled";
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  trialExpired: boolean;
  adminName: string;
  adminPhone: string;
  profileComplete: boolean;
};

type CompanyOnboardingDraft = {
  companyName: string;
  companyEnglishName: string;
  businessName: string;
  businessRegistrationNumber: string;
  logoUrl: string;
  postalCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  addressExtra: string;
  requestedPlanCode: string;
  adminName: string;
  adminPhone: string;
};

type CompanyOnboardingResponse = {
  profile?: CompanyOnboardingProfile | null;
  error?: string;
};

type CompanyOnboardingErrorCopy = {
  load: string;
  save: string;
  requiredFields: string;
};

const ONBOARDING_PLACEHOLDER_COMPANY_NAME_PATTERNS = [
  /회사\s*정보\s*입력\s*필요/i,
  /^회사\s*정보\s*입력\s*전$/i,
  /^company\s*profile\s*required$/i,
];

function isOnboardingPlaceholderCompanyName(value: string | null | undefined): boolean {
  const normalized = String(value ?? "").trim();
  return Boolean(normalized) && ONBOARDING_PLACEHOLDER_COMPANY_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}

function resolveCompanyOnboardingErrorMessage(errorCode: string | null | undefined, copy: CompanyOnboardingErrorCopy): string {
  if (errorCode === "COMPANY_ONBOARDING_REQUIRED_FIELDS") return copy.requiredFields;
  if (errorCode === "COMPANY_ONBOARDING_LOAD_FAILED") return copy.load;
  if (errorCode === "COMPANY_ONBOARDING_SAVE_FAILED") return copy.save;
  return copy.save;
}

function buildRequiredFieldsMessage(prefix: string, labels: string[]): string {
  return `${prefix}: ${labels.join(", ")}`;
}

function buildDraft(profile: CompanyOnboardingProfile | null): CompanyOnboardingDraft {
  return {
    companyName: isOnboardingPlaceholderCompanyName(profile?.companyName) ? "" : profile?.companyName ?? "",
    companyEnglishName: profile?.companyEnglishName ?? "",
    businessName: profile?.businessName ?? "",
    businessRegistrationNumber: profile?.businessRegistrationNumber ?? "",
    logoUrl: profile?.logoUrl ?? "",
    postalCode: profile?.postalCode ?? "",
    roadAddress: profile?.roadAddress ?? "",
    jibunAddress: profile?.jibunAddress ?? "",
    addressDetail: profile?.addressDetail ?? "",
    addressExtra: profile?.addressExtra ?? "",
    requestedPlanCode: profile?.requestedPlanCode || "basic",
    adminName: profile?.adminName ?? "",
    adminPhone: formatPhoneNumber(profile?.adminPhone ?? ""),
  };
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  readOnly,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-[var(--pbp-text-primary)]">
      <span>
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        inputMode={inputMode}
        className="h-11 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition placeholder:font-normal placeholder:text-[var(--pbp-text-subtle)] focus:border-[var(--pbp-accent)] read-only:bg-[var(--pbp-surface-muted)]"
      />
    </label>
  );
}

export default function AdminCompanyOnboardingGate({ children }: { children: ReactNode }) {
  const { i18n } = useI18n();
  const copy = i18n.admin.companyOnboarding;
  const [profile, setProfile] = useState<CompanyOnboardingProfile | null>(null);
  const [draft, setDraft] = useState<CompanyOnboardingDraft>(() => buildDraft(null));
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);

  const requiresOnboarding = loadState === "loaded" && profile !== null && !profile.profileComplete;
  const isApprovalPending = loadState === "loaded" && profile?.profileComplete && profile.onboardingStatus === "approval_pending";
  const isTrialExpired = loadState === "loaded" && profile?.profileComplete && profile.trialExpired;
  const isCheckingOnboarding = loadState === "idle" || loadState === "loading";
  const blocksAdminWorkspace = isCheckingOnboarding || requiresOnboarding || isApprovalPending || isTrialExpired || loadState === "error";
  const missingRequiredLabels = useMemo(() => {
    const missing: string[] = [];
    if (!draft.companyName.trim()) missing.push(copy.fields.companyName);
    if (!draft.businessName.trim()) missing.push(copy.fields.businessName);
    if (!draft.businessRegistrationNumber.trim()) missing.push(copy.fields.businessRegistrationNumber);
    if (!draft.postalCode.trim()) missing.push(copy.fields.postalCode);
    if (!draft.roadAddress.trim()) missing.push(copy.fields.roadAddress);
    if (!draft.addressDetail.trim()) missing.push(copy.fields.addressDetail);
    if (!draft.adminName.trim()) missing.push(copy.fields.adminName);
    if (normalizePhoneNumber(draft.adminPhone).length < 10) missing.push(copy.fields.adminPhone);
    return missing;
  }, [
    copy.fields.addressDetail,
    copy.fields.adminName,
    copy.fields.adminPhone,
    copy.fields.businessName,
    copy.fields.businessRegistrationNumber,
    copy.fields.companyName,
    copy.fields.postalCode,
    copy.fields.roadAddress,
    draft,
  ]);

  const canSave = missingRequiredLabels.length === 0;

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoadState("loading");
      setErrorMessage(null);
      try {
        const response = await fetch("/api/admin/companies/onboarding", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 404) {
          setLoadState("loaded");
          return;
        }

        const payload = (await response.json()) as CompanyOnboardingResponse;
        if (!response.ok || !payload.profile) {
          throw new Error(payload.error ?? "COMPANY_ONBOARDING_LOAD_FAILED");
        }

        setProfile(payload.profile);
        setDraft(buildDraft(payload.profile));
        setLoadState("loaded");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setLoadState("error");
        setErrorMessage(error instanceof Error ? resolveCompanyOnboardingErrorMessage(error.message, copy.errors) : copy.errors.load);
      }
    }

    void load();
    return () => controller.abort();
  }, [copy.errors]);

  useEffect(() => {
    if (!blocksAdminWorkspace) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [blocksAdminWorkspace]);

  function updateDraft<TKey extends keyof CompanyOnboardingDraft>(key: TKey, value: CompanyOnboardingDraft[TKey]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (saveState === "error") setSaveState("idle");
    if (errorMessage) setErrorMessage(null);
  }


  function keepFocusInsideDialog(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("aria-hidden"));

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function save() {
    if (saveState === "saving") return;

    if (!canSave) {
      setSaveState("error");
      setErrorMessage(buildRequiredFieldsMessage(copy.errors.requiredFields, missingRequiredLabels));
      return;
    }

    setSaveState("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/companies/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          adminPhone: normalizePhoneNumber(draft.adminPhone),
        }),
      });
      const payload = (await response.json()) as CompanyOnboardingResponse;

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? "COMPANY_ONBOARDING_SAVE_FAILED");
      }

      setProfile(payload.profile);
      setDraft(buildDraft(payload.profile));
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setErrorMessage(error instanceof Error ? resolveCompanyOnboardingErrorMessage(error.message, copy.errors) : copy.errors.save);
    }
  }

  return (
    <>
      <div aria-hidden={blocksAdminWorkspace} className={blocksAdminWorkspace ? "pointer-events-none select-none" : undefined}>
        {children}
      </div>
      {blocksAdminWorkspace ? (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-stone-950/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) event.preventDefault();
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") event.preventDefault();
          }}
        >
          <div className="mx-auto grid min-h-full max-w-4xl place-items-center">
            <section
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="company-onboarding-title"
              onKeyDown={keepFocusInsideDialog}
              className="w-full rounded-[32px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 text-[var(--pbp-text-primary)] shadow-2xl outline-none sm:p-7"
            >
              <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--pbp-accent)]">
                    {copy.eyebrow}
                  </p>
                  <h2 id="company-onboarding-title" className="mt-2 text-2xl font-bold tracking-tight">{copy.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pbp-text-muted)]">{copy.description}</p>
                </div>
                <a
                  href="/api/auth/logout"
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--pbp-border)] px-4 text-sm font-semibold text-[var(--pbp-text-muted)] transition hover:border-[var(--pbp-border-strong)] hover:text-[var(--pbp-text-primary)]"
                >
                  {copy.logout}
                </a>
              </div>

              {isCheckingOnboarding ? (
                <div className="mt-5 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-5 text-sm leading-6 text-[var(--pbp-text-muted)]">
                  <p className="font-bold text-[var(--pbp-text-primary)]">{copy.loading.title}</p>
                  <p className="mt-2">{copy.loading.description}</p>
                </div>
              ) : loadState === "error" ? (
                <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                  {errorMessage ?? copy.errors.load}
                </div>
              ) : isTrialExpired ? (
                <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-800">
                  <p className="font-bold">{copy.trialExpired.title}</p>
                  <p className="mt-2">{copy.trialExpired.description}</p>
                  <a
                    href="/admin/settings"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-2xl bg-[var(--pbp-accent)] px-4 text-sm font-bold text-white"
                  >
                    {copy.trialExpired.action}
                  </a>
                </div>
              ) : isApprovalPending ? (
                <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                  <p className="font-bold">{copy.pending.title}</p>
                  <p className="mt-2">{copy.pending.description}</p>
                </div>
              ) : (
                <div className="mt-5 grid gap-5">
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    <p className="font-bold">{copy.requiredNoticeTitle}</p>
                    <p className="mt-1">{copy.requiredNoticeDescription}</p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
                      <h3 className="text-base font-bold">{copy.sections.company}</h3>
                      <TextInput label={copy.fields.companyName} value={draft.companyName} onChange={(value) => updateDraft("companyName", value)} placeholder={copy.placeholders.companyName} required />
                      <TextInput label={copy.fields.companyEnglishName} value={draft.companyEnglishName} onChange={(value) => updateDraft("companyEnglishName", value)} placeholder={copy.placeholders.companyEnglishName} />
                      <TextInput label={copy.fields.businessName} value={draft.businessName} onChange={(value) => updateDraft("businessName", value)} placeholder={copy.placeholders.businessName} required />
                      <TextInput label={copy.fields.businessRegistrationNumber} value={draft.businessRegistrationNumber} onChange={(value) => updateDraft("businessRegistrationNumber", value)} placeholder={copy.placeholders.businessRegistrationNumber} inputMode="numeric" required />
                      <TextInput label={copy.fields.logoUrl} value={draft.logoUrl} onChange={(value) => updateDraft("logoUrl", value)} placeholder={copy.placeholders.logoUrl} />
                    </section>

                    <section className="grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
                      <h3 className="text-base font-bold">{copy.sections.address}</h3>
                      <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                        <TextInput label={copy.fields.postalCode} value={draft.postalCode} onChange={(value) => updateDraft("postalCode", value)} placeholder={copy.placeholders.postalCode} inputMode="numeric" required />
                        <TextInput label={copy.fields.roadAddress} value={draft.roadAddress} onChange={(value) => updateDraft("roadAddress", value)} placeholder={copy.placeholders.roadAddress} required />
                      </div>
                      <TextInput label={copy.fields.jibunAddress} value={draft.jibunAddress} onChange={(value) => updateDraft("jibunAddress", value)} placeholder={copy.placeholders.jibunAddress} />
                      <TextInput label={copy.fields.addressDetail} value={draft.addressDetail} onChange={(value) => updateDraft("addressDetail", value)} placeholder={copy.placeholders.addressDetail} required />
                      <TextInput label={copy.fields.addressExtra} value={draft.addressExtra} onChange={(value) => updateDraft("addressExtra", value)} placeholder={copy.placeholders.addressExtra} />
                      <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">{copy.addressApiNote}</p>
                    </section>
                  </div>

                  <section className="grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
                    <h3 className="text-base font-bold">{copy.sections.admin}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextInput label={copy.fields.adminName} value={draft.adminName} onChange={(value) => updateDraft("adminName", value)} placeholder={copy.placeholders.adminName} required />
                      <TextInput
                        label={copy.fields.adminPhone}
                        value={draft.adminPhone}
                        onChange={(value) => updateDraft("adminPhone", formatPhoneNumber(value))}
                        placeholder={copy.placeholders.adminPhone}
                        inputMode="tel"
                        required
                      />
                    </div>
                    <label className="grid gap-1.5 text-sm font-semibold text-[var(--pbp-text-primary)]">
                      <span>{copy.fields.requestedPlanCode}</span>
                      <select
                        value={draft.requestedPlanCode}
                        onChange={(event) => updateDraft("requestedPlanCode", event.target.value)}
                        className="h-11 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-accent)]"
                      >
                        <option value="basic">{copy.planOptions.basic}</option>
                        <option value="standard">{copy.planOptions.standard}</option>
                        <option value="pro">{copy.planOptions.pro}</option>
                      </select>
                    </label>
                  </section>

                  {errorMessage ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                      {errorMessage}
                    </div>
                  ) : null}
                  {saveState === "saved" ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      {copy.saved}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 border-t border-[var(--pbp-border)] pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => void save()}
                      disabled={saveState === "saving"}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--pbp-accent)] px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saveState === "saving" ? copy.saving : copy.submit}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
