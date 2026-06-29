"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
  GoogleMark,
} from "@/components/public/ATypePublicFrame";
import type { SignupApplicationPlanCode, SignupApplicationStatus } from "@/lib/signup/signupApplicationTypes";
import type { SignupConsentType } from "@/lib/signup/signupConsentPolicy";

type SignupApplicantView = {
  name: string;
  email: string;
  emailNormalized: string;
  emailVerified: true;
};

type SignupApplicationView = {
  id: string;
  status: SignupApplicationStatus;
  email: string;
  applicantName: string;
  requestedCompanyName: string;
  businessName: string;
  businessRegistrationNumberNormalized: string;
  requestedPlanCode: SignupApplicationPlanCode;
  correctionReason: string | null;
  correctionDueAt: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  canceledAt: string | null;
  provisioningStatus: string;
  provisioningErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

type SignupConsentPolicyView = {
  consentType: SignupConsentType;
  policyCode: string;
  policyVersion: string;
  label: string;
  required: true;
};

type SignupConsentView = {
  id: string;
  applicationId: string;
  consentType: SignupConsentType;
  policyCode: string;
  policyVersion: string;
  agreedAt: string;
  revokedAt: string | null;
};

type SignupApplicationResponse = {
  ok?: boolean;
  code?: string;
  applicant?: SignupApplicantView;
  application?: SignupApplicationView | null;
};

type SignupConsentsResponse = {
  ok?: boolean;
  code?: string;
  policies?: SignupConsentPolicyView[];
  consents?: SignupConsentView[];
};

type FormState = {
  requestedCompanyName: string;
  businessName: string;
  businessRegistrationNumber: string;
  requestedPlanCode: SignupApplicationPlanCode;
};

type ConsentSelectionState = Record<SignupConsentType, boolean>;

const requiredConsentTypes: SignupConsentType[] = ["terms_of_service", "privacy_policy"];

const emptyForm: FormState = {
  requestedCompanyName: "",
  businessName: "",
  businessRegistrationNumber: "",
  requestedPlanCode: "lite",
};

const emptyConsentSelections: ConsentSelectionState = {
  terms_of_service: false,
  privacy_policy: false,
};

const fallbackPolicies: SignupConsentPolicyView[] = [
  {
    consentType: "terms_of_service",
    policyCode: "wafl_terms_of_service",
    policyVersion: "0.24.26",
    label: "WAFL 이용약관",
    required: true,
  },
  {
    consentType: "privacy_policy",
    policyCode: "wafl_privacy_policy",
    policyVersion: "0.24.26",
    label: "개인정보 처리방침",
    required: true,
  },
];

const statusCopy: Record<SignupApplicationStatus | "verified_identity", {
  label: string;
  title: string;
  description: string;
  tone: "neutral" | "info" | "warning" | "danger" | "success";
}> = {
  verified_identity: {
    label: "신원 확인 완료",
    title: "회사 신청서를 시작하세요",
    description: "Google 이메일 인증을 확인했습니다. 회사 기본 정보와 필수 동의를 입력하면 신청서를 저장하고 제출할 수 있습니다.",
    tone: "info",
  },
  draft: {
    label: "작성 중",
    title: "신청서를 작성 중입니다",
    description: "제출 전에는 회사 정보, 요금제 선택, 필수 동의를 수정할 수 있습니다.",
    tone: "neutral",
  },
  submitted: {
    label: "접수 완료",
    title: "신청서가 접수되었습니다",
    description: "시스템 관리자가 입력 정보와 증빙 제출 상태를 검토합니다.",
    tone: "success",
  },
  reviewing: {
    label: "검토 중",
    title: "관리자 검토가 진행 중입니다",
    description: "승인 처리 목표는 1영업일입니다. 검토 중에는 신청 정보를 임의로 수정할 수 없습니다.",
    tone: "info",
  },
  changes_requested: {
    label: "보완 요청",
    title: "보완 요청이 있습니다",
    description: "요청 사유를 확인하고 필요한 내용을 수정한 뒤 다시 제출하세요.",
    tone: "warning",
  },
  approved: {
    label: "승인 완료",
    title: "승인이 완료되었습니다",
    description: "아직 실제 workspace provisioning 단계가 연결되지 않았습니다. 준비 상태가 완료될 때까지 이 화면에 머뭅니다.",
    tone: "success",
  },
  rejected: {
    label: "반려",
    title: "신청이 반려되었습니다",
    description: "반려 사유를 확인하세요. 필요한 경우 WAFL 지원 창구로 문의하세요.",
    tone: "danger",
  },
  canceled: {
    label: "취소됨",
    title: "신청이 취소되었습니다",
    description: "다시 신청하려면 Google signup 인증을 새로 시작하세요.",
    tone: "neutral",
  },
  provisioning_failed: {
    label: "처리 오류",
    title: "승인 후 처리 중 오류가 발생했습니다",
    description: "회사 생성 과정에서 오류가 기록되었습니다. 시스템 관리자의 복구 처리를 기다려 주세요.",
    tone: "danger",
  },
};

function normalizeBusinessRegistration(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function createFormFromApplication(application: SignupApplicationView | null): FormState {
  if (!application) return emptyForm;
  return {
    requestedCompanyName: application.requestedCompanyName,
    businessName: application.businessName,
    businessRegistrationNumber: application.businessRegistrationNumberNormalized,
    requestedPlanCode: application.requestedPlanCode,
  };
}

function createConsentSelections(
  policies: SignupConsentPolicyView[],
  consents: SignupConsentView[],
): ConsentSelectionState {
  const current = { ...emptyConsentSelections };
  for (const policy of policies) {
    current[policy.consentType] = consents.some((consent) => (
      consent.consentType === policy.consentType
      && consent.policyCode === policy.policyCode
      && consent.policyVersion === policy.policyVersion
      && !consent.revokedAt
    ));
  }
  return current;
}

function getSafeErrorMessage(code: string | null): string {
  if (!code) return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "SIGNUP_APPLICANT_SESSION_REQUIRED") return "가입 신청 세션이 없습니다. Google로 7일 무료 시작을 다시 진행해 주세요.";
  if (code === "SIGNUP_APPLICATION_ID_REQUIRED") return "신청서를 먼저 저장한 뒤 다시 시도해 주세요.";
  if (code === "SIGNUP_PAYLOAD_INVALID") return "필수 입력값을 확인해 주세요. 사업자등록번호는 숫자 10자리여야 합니다.";
  if (code === "SIGNUP_CONSENT_REQUIRED") return "필수 약관과 개인정보 처리방침 동의가 필요합니다.";
  if (code.startsWith("SIGNUP_DUPLICATE")) return "이미 검토 중인 신청 정보가 있습니다. 상태 화면을 새로고침해 주세요.";
  if (code === "SIGNUP_APPLICATION_CONFLICT") return "현재 상태에서는 이 작업을 수행할 수 없습니다. 상태를 새로고침해 주세요.";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

async function fetchConsents(): Promise<SignupConsentsResponse> {
  const response = await fetch("/api/signup/application/consents", { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as SignupConsentsResponse;
  if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_CONSENTS_FAILED");
  return payload;
}

export default function SignupApplicationDashboard() {
  const [applicant, setApplicant] = useState<SignupApplicantView | null>(null);
  const [application, setApplication] = useState<SignupApplicationView | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [policies, setPolicies] = useState<SignupConsentPolicyView[]>(fallbackPolicies);
  const [consents, setConsents] = useState<SignupConsentView[]>([]);
  const [consentSelections, setConsentSelections] = useState<ConsentSelectionState>(emptyConsentSelections);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = application?.status ?? "verified_identity";
  const copy = statusCopy[status];
  const canEdit = !application || application.status === "draft" || application.status === "changes_requested";
  const canSubmit = !application || application.status === "draft" || application.status === "changes_requested";
  const canCancel = application?.status === "draft" || application?.status === "submitted" || application?.status === "changes_requested";
  const allRequiredConsentsSelected = requiredConsentTypes.every((consentType) => consentSelections[consentType]);

  const formValid = useMemo(
    () => (
      form.requestedCompanyName.trim().length > 0
      && form.businessName.trim().length > 0
      && normalizeBusinessRegistration(form.businessRegistrationNumber).length === 10
      && allRequiredConsentsSelected
    ),
    [allRequiredConsentsSelected, form],
  );

  const applyConsentPayload = useCallback((payload: SignupConsentsResponse) => {
    const nextPolicies = payload.policies?.length ? payload.policies : fallbackPolicies;
    const nextConsents = payload.consents ?? [];
    setPolicies(nextPolicies);
    setConsents(nextConsents);
    setConsentSelections(createConsentSelections(nextPolicies, nextConsents));
  }, []);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/signup/application", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as SignupApplicationResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_STATUS_FAILED");
      setApplicant(payload.applicant ?? null);
      setApplication(payload.application ?? null);
      setForm(createFormFromApplication(payload.application ?? null));
      if (payload.applicant) {
        applyConsentPayload(await fetchConsents());
      } else {
        setConsents([]);
        setConsentSelections(emptyConsentSelections);
      }
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
      setApplicant(null);
      setApplication(null);
      setConsents([]);
      setConsentSelections(emptyConsentSelections);
    } finally {
      setIsLoading(false);
    }
  }, [applyConsentPayload]);

  async function saveApplicationDraft(): Promise<SignupApplicationView | null> {
    const response = await fetch("/api/signup/application", {
      method: application ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestedCompanyName: form.requestedCompanyName,
        businessName: form.businessName,
        businessRegistrationNumber: normalizeBusinessRegistration(form.businessRegistrationNumber),
        requestedPlanCode: form.requestedPlanCode,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as SignupApplicationResponse;
    if (!response.ok || !payload.ok || !payload.application) {
      throw new Error(payload.code || "SIGNUP_MUTATION_FAILED");
    }
    setApplicant(payload.applicant ?? applicant);
    setApplication(payload.application);
    setForm(createFormFromApplication(payload.application));
    return payload.application;
  }

  async function saveConsent(consentType: SignupConsentType): Promise<void> {
    const response = await fetch("/api/signup/application/consents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentType }),
    });
    const payload = (await response.json().catch(() => ({}))) as SignupConsentsResponse;
    if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_CONSENT_SAVE_FAILED");
    applyConsentPayload(payload);
  }

  async function revokeConsent(consentType: SignupConsentType): Promise<void> {
    const response = await fetch("/api/signup/application/consents/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentType }),
    });
    const payload = (await response.json().catch(() => ({}))) as SignupConsentsResponse;
    if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_CONSENT_REVOKE_FAILED");
    applyConsentPayload(payload);
  }

  async function ensureSelectedConsents(): Promise<void> {
    for (const consentType of requiredConsentTypes) {
      if (consentSelections[consentType]) {
        const policy = policies.find((item) => item.consentType === consentType);
        const hasCurrentConsent = Boolean(policy && consents.some((consent) => (
          consent.consentType === consentType
          && consent.policyCode === policy.policyCode
          && consent.policyVersion === policy.policyVersion
          && !consent.revokedAt
        )));
        if (!hasCurrentConsent) await saveConsent(consentType);
      }
    }
  }

  async function saveDraft() {
    if (isBusy) return;
    if (!formValid) {
      setError("필수 입력값과 동의를 확인해 주세요.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveApplicationDraft();
      await ensureSelectedConsents();
      setMessage("임시 저장되었습니다.");
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
      await loadStatus().catch(() => undefined);
    } finally {
      setIsBusy(false);
    }
  }

  async function submitApplication() {
    if (isBusy) return;
    if (!formValid) {
      setError("제출하려면 필수 입력값과 동의를 확인해 주세요.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      await saveApplicationDraft();
      await ensureSelectedConsents();
      const response = await fetch("/api/signup/application/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = (await response.json().catch(() => ({}))) as SignupApplicationResponse;
      if (!response.ok || !payload.ok || !payload.application) throw new Error(payload.code || "SIGNUP_SUBMIT_FAILED");
      setApplication(payload.application);
      setForm(createFormFromApplication(payload.application));
      setMessage("신청서가 제출되었습니다.");
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
      await loadStatus().catch(() => undefined);
    } finally {
      setIsBusy(false);
    }
  }

  async function cancelApplication() {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/signup/application/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const payload = (await response.json().catch(() => ({}))) as SignupApplicationResponse;
      if (!response.ok || !payload.ok || !payload.application) throw new Error(payload.code || "SIGNUP_CANCEL_FAILED");
      setApplication(payload.application);
      setForm(createFormFromApplication(payload.application));
      setMessage("신청이 취소되었습니다.");
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
    } finally {
      setIsBusy(false);
    }
  }

  async function toggleConsent(consentType: SignupConsentType, checked: boolean) {
    setConsentSelections((current) => ({ ...current, [consentType]: checked }));
    if (!application || !canEdit) return;
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (checked) {
        await saveConsent(consentType);
      } else {
        await revokeConsent(consentType);
      }
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
      await loadStatus().catch(() => undefined);
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadStatus]);

  return (
    <ATypePublicFrame
      eyebrow="WAFL 7일 무료 시작"
      title={<>가입 신청을<br />안전하게 진행하세요</>}
      description="이 화면은 Google 인증을 마친 신청자의 회사 신청 상태만 보여줍니다. Workspace 접근은 승인과 provisioning이 끝날 때까지 차단됩니다."
      heroItems={["7일 Trial", "100MB", "3명", "관리자 승인"]}
      footer={<p>사업자등록증 업로드와 관리자 승인 화면은 다음 scoped step에서 연결합니다.</p>}
    >
      <ATypePublicCard eyebrow={copy.label} title={copy.title} description={copy.description}>
        {isLoading ? <ATypePublicNotice tone="info">신청 상태를 불러오는 중입니다.</ATypePublicNotice> : null}

        {!isLoading && !applicant ? (
          <div className="space-y-4">
            {error ? <ATypePublicNotice tone="warning">{error}</ATypePublicNotice> : null}
            <a
              href="/api/auth/google/start?intent=signup"
              className="flex w-full items-center justify-center gap-3 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-5 py-4 text-sm font-black text-[var(--pbp-action-primary-text)] shadow-[var(--pbp-shadow-elevated-a-type)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-action-primary-surface-hover)]"
            >
              <GoogleMark />
              7일 무료로 시작하기
            </a>
          </div>
        ) : null}

        {!isLoading && applicant ? (
          <div className="space-y-5">
            <div className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
              <p className="font-black text-[var(--pbp-text-primary)]">{applicant.name}</p>
              <p>{applicant.email}</p>
            </div>

            {application?.status === "changes_requested" && application.correctionReason ? (
              <ATypePublicNotice tone="warning">
                보완 요청: {application.correctionReason}
                {application.correctionDueAt ? ` · 기한 ${formatDateTime(application.correctionDueAt)}` : ""}
              </ATypePublicNotice>
            ) : null}

            {application?.status === "rejected" && application.rejectionReason ? (
              <ATypePublicNotice tone="danger">반려 사유: {application.rejectionReason}</ATypePublicNotice>
            ) : null}

            {application?.status === "provisioning_failed" ? (
              <ATypePublicNotice tone="danger">
                처리 오류 코드: {application.provisioningErrorCode ?? "SIGNUP_PROVISIONING_FAILED"}
              </ATypePublicNotice>
            ) : null}

            {canEdit ? (
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
                  회사명
                  <input value={form.requestedCompanyName} onChange={(event) => setForm((current) => ({ ...current, requestedCompanyName: event.target.value }))} className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--pbp-brand-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
                  사업자명
                  <input value={form.businessName} onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))} className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--pbp-brand-primary)]" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
                  사업자등록번호
                  <input inputMode="numeric" value={form.businessRegistrationNumber} onChange={(event) => setForm((current) => ({ ...current, businessRegistrationNumber: normalizeBusinessRegistration(event.target.value) }))} className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--pbp-brand-primary)]" placeholder="숫자 10자리" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--pbp-text-primary)]">
                  요청 요금제
                  <select value={form.requestedPlanCode} onChange={(event) => setForm((current) => ({ ...current, requestedPlanCode: event.target.value as SignupApplicationPlanCode }))} className="rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-semibold outline-none focus:border-[var(--pbp-brand-primary)]">
                    <option value="lite">Lite</option>
                    <option value="flow">Flow</option>
                    <option value="studio">Studio</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <div className="rounded-[var(--pbp-radius-xl)] border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface-soft)] p-4 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">
                  사업자등록증 업로드는 다음 단계에서 연결합니다. 이번 화면에서는 제출 준비 상태와 동의 증적을 저장합니다.
                </div>
                <div className="grid gap-3 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
                  {policies.map((policy) => (
                    <label key={policy.consentType} className="flex items-start gap-3 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={consentSelections[policy.consentType]}
                        onChange={(event) => void toggleConsent(policy.consentType, event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        {policy.label}에 동의합니다.
                        <span className="block text-xs text-[var(--pbp-text-subtle)]">
                          {policy.policyCode} · v{policy.policyVersion}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-3 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                <p><span className="font-black text-[var(--pbp-text-primary)]">회사명</span> {application?.requestedCompanyName ?? "-"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">사업자명</span> {application?.businessName ?? "-"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">요금제</span> {application?.requestedPlanCode ?? "-"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">제출일</span> {formatDateTime(application?.submittedAt ?? null) ?? "-"}</p>
              </div>
            )}

            {error ? <ATypePublicNotice tone="danger">{error}</ATypePublicNotice> : null}
            {message ? <ATypePublicNotice tone="success">{message}</ATypePublicNotice> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              {canEdit ? (
                <button type="button" onClick={saveDraft} disabled={isBusy || !formValid} className="flex-1 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-brand-primary)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-black text-[var(--pbp-brand-primary)] transition hover:bg-[var(--pbp-surface-soft)] disabled:border-[var(--pbp-border-soft)] disabled:text-[var(--pbp-text-disabled)]">
                  임시 저장
                </button>
              ) : null}
              {canSubmit ? (
                <button type="button" onClick={submitApplication} disabled={isBusy || !formValid} className="flex-1 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-4 py-3 text-sm font-black text-[var(--pbp-action-primary-text)] transition hover:bg-[var(--pbp-action-primary-surface-hover)] disabled:bg-[var(--pbp-surface-soft)] disabled:text-[var(--pbp-text-disabled)]">
                  {application?.status === "changes_requested" ? "수정 후 다시 제출" : "제출"}
                </button>
              ) : null}
              {canCancel ? (
                <button type="button" onClick={cancelApplication} disabled={isBusy} className="flex-1 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-status-danger-border)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-black text-[var(--pbp-status-danger-fg)] transition hover:bg-[var(--pbp-status-danger-bg)] disabled:border-[var(--pbp-border-soft)] disabled:text-[var(--pbp-text-disabled)]">
                  신청 취소
                </button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={loadStatus} disabled={isBusy || isLoading} className="flex-1 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-bold text-[var(--pbp-text-primary)] transition hover:bg-[var(--pbp-surface-soft)]">
                상태 새로고침
              </button>
              <form action="/api/auth/logout" method="post" className="flex-1">
                <button type="submit" className="w-full rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-bold text-[var(--pbp-text-primary)] transition hover:bg-[var(--pbp-surface-soft)]">
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
