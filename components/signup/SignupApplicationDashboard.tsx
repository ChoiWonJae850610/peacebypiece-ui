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

type SignupCertificateView = {
  id: string;
  applicationId: string;
  fileType: "business_registration";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  reviewedAt: string | null;
  approvedCompanyFileId: string | null;
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

type SignupCertificateResponse = {
  ok?: boolean;
  code?: string;
  certificate?: SignupCertificateView | null;
};

type CustomerPolicyDocumentView = {
  id: string;
  title: string;
  subtitle: string;
  versionLabel: string;
  effectiveDateLabel: string;
  markdown: string;
};

type CustomerPolicyDocumentResponse = {
  ok?: boolean;
  document?: CustomerPolicyDocumentView;
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
    label: "이용약관",
    required: true,
  },
  {
    consentType: "privacy_policy",
    policyCode: "wafl_privacy_policy",
    policyVersion: "0.24.26",
    label: "개인정보처리방침",
    required: true,
  },
];

const planCards: Array<{
  code: Exclude<SignupApplicationPlanCode, "custom">;
  name: string;
  price: string;
  storage: string;
  members: string;
}> = [
  { code: "lite", name: "Lite", price: "월 9,900원", storage: "500MB", members: "3명" },
  { code: "flow", name: "Flow", price: "월 19,900원", storage: "1.5GB", members: "10명" },
  { code: "studio", name: "Studio", price: "월 39,900원", storage: "5GB", members: "30명" },
];

const policyDocumentIdByConsentType: Record<SignupConsentType, string> = {
  terms_of_service: "terms-of-service",
  privacy_policy: "privacy-policy",
};

const statusCopy: Record<SignupApplicationStatus | "verified_identity", {
  label: string;
  title: string;
  description: string;
  tone: "neutral" | "info" | "warning" | "danger" | "success";
}> = {
  verified_identity: {
    label: "본인 확인 완료",
    title: "회사 정보를 입력해 주세요",
    description: "Google 계정 확인이 끝났습니다. 회사 정보와 필수 동의를 제출하면 담당자가 신청 내용을 확인합니다.",
    tone: "info",
  },
  draft: {
    label: "작성 중",
    title: "가입 신청을 작성 중입니다",
    description: "회사 정보, 요금제, 사업자등록증, 필수 동의를 확인한 뒤 제출해 주세요.",
    tone: "neutral",
  },
  submitted: {
    label: "접수 완료",
    title: "가입 신청이 접수되었습니다",
    description: "담당자가 입력 정보와 증빙 파일을 확인합니다. 승인되면 7일 무료 체험이 시작됩니다.",
    tone: "success",
  },
  reviewing: {
    label: "확인 중",
    title: "가입 신청을 확인하고 있습니다",
    description: "담당자가 회사 정보와 증빙 파일을 확인하는 중입니다.",
    tone: "info",
  },
  changes_requested: {
    label: "보완 요청",
    title: "보완이 필요한 항목이 있습니다",
    description: "아래 안내를 확인하고 필요한 정보를 수정한 뒤 다시 제출해 주세요.",
    tone: "warning",
  },
  approved: {
    label: "승인 완료",
    title: "가입이 승인되었습니다",
    description: "회사 workspace가 준비되었습니다. 다시 로그인하거나 화면을 새로 열면 WAFL을 이용할 수 있습니다.",
    tone: "success",
  },
  rejected: {
    label: "반려",
    title: "가입 신청이 반려되었습니다",
    description: "반려 사유를 확인해 주세요. 필요한 경우 WAFL 지원 창구로 문의해 주세요.",
    tone: "danger",
  },
  canceled: {
    label: "취소됨",
    title: "가입 신청이 취소되었습니다",
    description: "다시 신청하려면 Google로 가입 신청을 새로 시작해 주세요.",
    tone: "neutral",
  },
  provisioning_failed: {
    label: "처리 지연",
    title: "가입 처리 중 문제가 발생했습니다",
    description: "담당자가 복구를 진행합니다. 잠시 후 다시 확인해 주세요.",
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
  if (code === "SIGNUP_APPLICANT_SESSION_REQUIRED") return "가입 신청 세션을 확인할 수 없습니다. Google로 가입 신청을 다시 시작해 주세요.";
  if (code === "SIGNUP_APPLICATION_ID_REQUIRED") return "회사 정보를 먼저 입력해 주세요.";
  if (code === "SIGNUP_PAYLOAD_INVALID") return "필수 입력값을 확인해 주세요. 사업자등록번호는 숫자 10자리입니다.";
  if (code === "SIGNUP_CONSENT_REQUIRED") return "이용약관과 개인정보처리방침 동의가 필요합니다.";
  if (code === "SIGNUP_CERTIFICATE_UPLOAD_NOT_CONFIGURED") return "파일 업로드 준비가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "SIGNUP_CERTIFICATE_UPLOAD_NOT_ALLOWED") return "현재 상태에서는 사업자등록증을 변경할 수 없습니다.";
  if (code === "SIGNUP_CERTIFICATE_FILE_REQUIRED") return "사업자등록증 파일을 선택해 주세요.";
  if (code === "SIGNUP_CERTIFICATE_SIZE_UNSUPPORTED") return "파일 크기는 최대 10MB까지 가능합니다.";
  if (
    code === "SIGNUP_CERTIFICATE_MIME_TYPE_UNSUPPORTED"
    || code === "SIGNUP_CERTIFICATE_EXTENSION_UNSUPPORTED"
    || code === "SIGNUP_CERTIFICATE_SIGNATURE_UNSUPPORTED"
  ) {
    return "PNG, JPEG, PDF 파일만 등록할 수 있습니다.";
  }
  if (code === "SIGNUP_CERTIFICATE_UPLOAD_FAILED") return "파일을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "SIGNUP_CERTIFICATE_DELETE_FAILED") return "파일을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  if (code.startsWith("SIGNUP_DUPLICATE")) return "이미 확인 중인 가입 신청이 있습니다.";
  if (code === "SIGNUP_APPLICATION_CONFLICT") return "현재 상태에서는 이 작업을 할 수 없습니다. 화면을 다시 열어 확인해 주세요.";
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function formatFileSize(sizeBytes: number): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileKindLabel(file: SignupCertificateView): string {
  if (file.mimeType === "application/pdf") return "PDF";
  if (file.mimeType === "image/png") return "PNG";
  if (file.mimeType === "image/jpeg") return "JPG";
  return "파일";
}

async function fetchConsents(): Promise<SignupConsentsResponse> {
  const response = await fetch("/api/signup/application/consents", { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as SignupConsentsResponse;
  if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_CONSENTS_FAILED");
  return payload;
}

async function fetchCertificate(): Promise<SignupCertificateResponse> {
  const response = await fetch("/api/signup/application/certificate", { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as SignupCertificateResponse;
  if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_CERTIFICATE_STATUS_FAILED");
  return payload;
}

export default function SignupApplicationDashboard() {
  const [applicant, setApplicant] = useState<SignupApplicantView | null>(null);
  const [application, setApplication] = useState<SignupApplicationView | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [policies, setPolicies] = useState<SignupConsentPolicyView[]>(fallbackPolicies);
  const [consents, setConsents] = useState<SignupConsentView[]>([]);
  const [certificate, setCertificate] = useState<SignupCertificateView | null>(null);
  const [consentSelections, setConsentSelections] = useState<ConsentSelectionState>(emptyConsentSelections);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [openPolicy, setOpenPolicy] = useState<SignupConsentPolicyView | null>(null);
  const [openedPolicyDocument, setOpenedPolicyDocument] = useState<CustomerPolicyDocumentView | null>(null);
  const [openedPolicyError, setOpenedPolicyError] = useState<string | null>(null);
  const [openedPolicyLoading, setOpenedPolicyLoading] = useState(false);

  const status = application?.status ?? "verified_identity";
  const copy = statusCopy[status];
  const canEdit = !application || application.status === "draft" || application.status === "changes_requested";
  const canSubmit = !application || application.status === "draft" || application.status === "changes_requested";
  const canCancel = application?.status === "draft" || application?.status === "submitted" || application?.status === "changes_requested";
  const allRequiredConsentsSelected = requiredConsentTypes.every((consentType) => consentSelections[consentType]);

  const companyInfoValid = useMemo(
    () => (
      form.requestedCompanyName.trim().length > 0
      && form.businessName.trim().length > 0
      && normalizeBusinessRegistration(form.businessRegistrationNumber).length === 10
      && form.requestedPlanCode !== "custom"
    ),
    [form],
  );

  const formValid = companyInfoValid && allRequiredConsentsSelected && Boolean(certificate);

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
    setConsentError(null);
    setCertificateError(null);
    try {
      const response = await fetch("/api/signup/application", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as SignupApplicationResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_STATUS_FAILED");
      const nextApplicant = payload.applicant ?? null;
      const nextApplication = payload.application ?? null;
      setApplicant(nextApplicant);
      setApplication(nextApplication);
      setForm(createFormFromApplication(nextApplication));
      if (!nextApplicant) {
        setConsents([]);
        setCertificate(null);
        setConsentSelections(emptyConsentSelections);
        return;
      }

      try {
        applyConsentPayload(await fetchConsents());
      } catch (consentLoadError) {
        setConsentError(getSafeErrorMessage(consentLoadError instanceof Error ? consentLoadError.message : null));
      }

      if (nextApplication) {
        try {
          const certificatePayload = await fetchCertificate();
          setCertificate(certificatePayload.certificate ?? null);
        } catch (certificateLoadError) {
          setCertificateError(getSafeErrorMessage(certificateLoadError instanceof Error ? certificateLoadError.message : null));
          setCertificate(null);
        }
      } else {
        setCertificate(null);
      }
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
      setApplication(null);
      setConsents([]);
      setCertificate(null);
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

  async function uploadCertificate(nextFile: File | null) {
    if (isBusy) return;
    if (!nextFile) {
      setError(getSafeErrorMessage("SIGNUP_CERTIFICATE_FILE_REQUIRED"));
      return;
    }
    if (!companyInfoValid) {
      setError("회사명, 사업자명, 사업자등록번호, 요금제를 먼저 확인해 주세요.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!application) await saveApplicationDraft();
      const formData = new FormData();
      formData.append("file", nextFile);
      const response = await fetch("/api/signup/application/certificate", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as SignupCertificateResponse;
      if (!response.ok || !payload.ok || !payload.certificate) {
        throw new Error(payload.code || "SIGNUP_CERTIFICATE_UPLOAD_FAILED");
      }
      setCertificate(payload.certificate);
      setCertificateError(null);
      setMessage("사업자등록증 파일을 등록했습니다.");
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
      await loadStatus().catch(() => undefined);
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteCertificate() {
    if (isBusy || !certificate) return;
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/signup/application/certificate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: certificate.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as SignupCertificateResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.code || "SIGNUP_CERTIFICATE_DELETE_FAILED");
      setCertificate(payload.certificate ?? null);
      setMessage("사업자등록증 파일을 삭제했습니다.");
    } catch (nextError) {
      setError(getSafeErrorMessage(nextError instanceof Error ? nextError.message : null));
    } finally {
      setIsBusy(false);
    }
  }

  async function submitApplication() {
    if (isBusy) return;
    if (!formValid) {
      setError("필수 입력, 사업자등록증, 약관 동의를 모두 확인해 주세요.");
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
      setMessage("가입 신청을 제출했습니다.");
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
      setMessage("가입 신청을 취소했습니다.");
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

  function openPolicyDocument(policy: SignupConsentPolicyView) {
    setOpenedPolicyDocument(null);
    setOpenedPolicyError(null);
    setOpenedPolicyLoading(true);
    setOpenPolicy(policy);
  }

  function closePolicyDocument() {
    setOpenPolicy(null);
    setOpenedPolicyDocument(null);
    setOpenedPolicyError(null);
    setOpenedPolicyLoading(false);
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [loadStatus]);

  useEffect(() => {
    if (!openPolicy) return;

    let active = true;
    const documentId = policyDocumentIdByConsentType[openPolicy.consentType];

    fetch(`/api/policies/customer-documents/${encodeURIComponent(documentId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as CustomerPolicyDocumentResponse | null;
        if (!response.ok || !payload?.ok || !payload.document) {
          throw new Error("POLICY_DOCUMENT_LOAD_FAILED");
        }
        if (active) setOpenedPolicyDocument(payload.document);
      })
      .catch(() => {
        if (active) setOpenedPolicyError("정책 문서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => {
        if (active) setOpenedPolicyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [openPolicy]);

  useEffect(() => {
    if (!openPolicy) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePolicyDocument();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPolicy]);

  return (
    <ATypePublicFrame
      eyebrow="WAFL 무료 체험"
      title={<>7일 무료로<br />WAFL을 시작하세요</>}
      description="회사 정보를 제출하면 담당자가 확인합니다. 승인되면 7일 동안 무료로 이용할 수 있습니다."
      heroItems={["가입 신청", "담당자 확인", "7일 무료 이용"]}
      footer={<p>가입 승인 전에는 입력 정보를 확인하고, 승인 후 7일 무료 체험이 시작됩니다.</p>}
    >
      <ATypePublicCard eyebrow={copy.label} title={copy.title} description={copy.description}>
        {isLoading ? <ATypePublicNotice tone="info">가입 신청 정보를 불러오고 있습니다.</ATypePublicNotice> : null}

        {!isLoading && !applicant ? (
          <div className="space-y-4">
            {error ? <ATypePublicNotice tone="warning">{error}</ATypePublicNotice> : null}
            <a
              href="/api/auth/google/start?intent=signup"
              className="flex w-full items-center justify-center gap-3 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-5 py-4 text-sm font-black text-[var(--pbp-action-primary-text)] shadow-[var(--pbp-shadow-elevated-a-type)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-action-primary-surface-hover)]"
            >
              <GoogleMark />
              Google로 가입 신청하기
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
              <ATypePublicNotice tone="danger">가입 처리에 시간이 더 필요합니다. 담당자가 확인하고 있습니다.</ATypePublicNotice>
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

                <section className="grid gap-3">
                  <div>
                    <p className="text-sm font-black text-[var(--pbp-text-primary)]">요금제 선택</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-secondary)]">부가세 포함 · 승인 후 7일 무료 · 오늘 결제금액 0원</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {planCards.map((plan) => {
                      const selected = form.requestedPlanCode === plan.code;
                      return (
                        <button
                          key={plan.code}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, requestedPlanCode: plan.code }))}
                          className={`rounded-[var(--pbp-radius-xl)] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] ${
                            selected
                              ? "border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-muted)]"
                              : "border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] hover:bg-[var(--pbp-surface-soft)]"
                          }`}
                        >
                          <span className="block text-sm font-black text-[var(--pbp-text-primary)]">{plan.name}</span>
                          <span className="mt-2 block text-lg font-black text-[var(--pbp-brand-primary)]">{plan.price}</span>
                          <span className="mt-2 block text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">{plan.storage} · {plan.members}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-3 rounded-[var(--pbp-radius-xl)] border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface-soft)] p-4 text-xs font-semibold leading-5 text-[var(--pbp-text-secondary)]">
                  <div>
                    <p className="text-sm font-black text-[var(--pbp-text-primary)]">사업자등록증</p>
                    <p>PNG, JPEG, PDF · 최대 10MB</p>
                  </div>
                  {certificate ? (
                    <div className="min-w-0 rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] p-3">
                      <p className="truncate font-black text-[var(--pbp-text-primary)]">{certificate.originalName}</p>
                      <p>{getFileKindLabel(certificate)} · {formatFileSize(certificate.sizeBytes)} · {formatDateTime(certificate.uploadedAt)}</p>
                    </div>
                  ) : (
                    <p>등록된 파일이 없습니다.</p>
                  )}
                  {!companyInfoValid ? <ATypePublicNotice tone="info">회사 정보를 먼저 입력하면 파일을 선택할 수 있습니다.</ATypePublicNotice> : null}
                  {certificateError ? <ATypePublicNotice tone="warning">{certificateError}</ATypePublicNotice> : null}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf"
                    disabled={isBusy || !companyInfoValid}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file) void uploadCertificate(file);
                      event.currentTarget.value = "";
                    }}
                    className="w-full min-w-0 text-xs font-semibold text-[var(--pbp-text-secondary)] file:mr-3 file:rounded-[var(--pbp-radius-lg)] file:border-0 file:bg-[var(--pbp-brand-primary)] file:px-3 file:py-2 file:text-xs file:font-black file:text-[var(--pbp-text-inverse)]"
                  />
                  {certificate ? (
                    <button type="button" onClick={deleteCertificate} disabled={isBusy} className="w-full rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-status-danger-border)] bg-[var(--pbp-surface-base)] px-3 py-2 text-xs font-black text-[var(--pbp-status-danger-fg)] disabled:border-[var(--pbp-border-soft)] disabled:text-[var(--pbp-text-disabled)]">
                      파일 삭제
                    </button>
                  ) : null}
                </section>

                <section className="grid gap-3 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4">
                  {consentError ? <ATypePublicNotice tone="warning">{consentError}</ATypePublicNotice> : null}
                  {policies.map((policy) => (
                    <div key={policy.consentType} className="flex flex-wrap items-start justify-between gap-3 rounded-[var(--pbp-radius-lg)] bg-[var(--pbp-surface-base)] p-3">
                      <label className="flex min-w-0 flex-1 items-start gap-3 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                        <input
                          type="checkbox"
                          checked={consentSelections[policy.consentType]}
                          onChange={(event) => void toggleConsent(policy.consentType, event.target.checked)}
                          className="mt-1 h-4 w-4"
                        />
                        <span>[필수] {policy.label}에 동의합니다.</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => openPolicyDocument(policy)}
                        className="rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] px-3 py-1.5 text-xs font-black text-[var(--pbp-text-primary)]"
                      >
                        보기
                      </button>
                    </div>
                  ))}
                </section>
              </div>
            ) : (
              <div className="grid gap-3 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4 text-sm font-semibold leading-6 text-[var(--pbp-text-secondary)]">
                <p><span className="font-black text-[var(--pbp-text-primary)]">회사명</span> {application?.requestedCompanyName ?? "-"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">사업자명</span> {application?.businessName ?? "-"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">요금제</span> {application?.requestedPlanCode ?? "-"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">사업자등록증</span> {certificate ? `${certificate.originalName} · ${formatFileSize(certificate.sizeBytes)}` : "등록된 파일 없음"}</p>
                <p><span className="font-black text-[var(--pbp-text-primary)]">제출일</span> {formatDateTime(application?.submittedAt ?? null) ?? "-"}</p>
              </div>
            )}

            {error ? <ATypePublicNotice tone="danger">{error}</ATypePublicNotice> : null}
            {message ? <ATypePublicNotice tone="success">{message}</ATypePublicNotice> : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              {canSubmit ? (
                <button type="button" onClick={submitApplication} disabled={isBusy || !formValid} className="flex-1 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-4 py-3 text-sm font-black text-[var(--pbp-action-primary-text)] transition hover:bg-[var(--pbp-action-primary-surface-hover)] disabled:bg-[var(--pbp-surface-soft)] disabled:text-[var(--pbp-text-disabled)]">
                  {application?.status === "changes_requested" ? "수정 후 다시 제출" : "가입 신청 제출"}
                </button>
              ) : null}
              {canCancel ? (
                <button type="button" onClick={cancelApplication} disabled={isBusy} className="flex-1 rounded-[var(--pbp-radius-xl)] border border-[var(--pbp-status-danger-border)] bg-[var(--pbp-surface-base)] px-4 py-3 text-sm font-black text-[var(--pbp-status-danger-fg)] transition hover:bg-[var(--pbp-status-danger-bg)] disabled:border-[var(--pbp-border-soft)] disabled:text-[var(--pbp-text-disabled)]">
                  신청 취소
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </ATypePublicCard>

      {openPolicy ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-6" role="dialog" aria-modal="true" aria-label={openedPolicyDocument?.title ?? openPolicy.label}>
          <button type="button" aria-label="정책 문서 닫기" className="absolute inset-0 cursor-default" onClick={closePolicyDocument} />
          <div className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[var(--pbp-radius-modal)] bg-[var(--pbp-surface-base)] p-5 shadow-[var(--pbp-shadow-modal-a-type)] sm:max-w-2xl sm:rounded-[var(--pbp-radius-modal)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--pbp-brand-soft)]">WAFL</p>
                <h2 className="mt-2 text-xl font-black text-[var(--pbp-text-primary)]">{openedPolicyDocument?.title ?? openPolicy.label}</h2>
                <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">
                  {openedPolicyDocument
                    ? `${openedPolicyDocument.versionLabel} · ${openedPolicyDocument.effectiveDateLabel}`
                    : `${openPolicy.policyCode} · ${openPolicy.policyVersion}`}
                </p>
              </div>
              <button type="button" onClick={closePolicyDocument} className="rounded-full border border-[var(--pbp-border-soft)] px-3 py-1 text-sm font-black text-[var(--pbp-text-primary)]">
                닫기
              </button>
            </div>
            <div className="mt-5 grid gap-3 text-sm font-semibold leading-7 text-[var(--pbp-text-secondary)]">
              {openedPolicyLoading ? <p>정책 문서를 불러오는 중입니다.</p> : null}
              {openedPolicyError ? <ATypePublicNotice tone="warning">{openedPolicyError}</ATypePublicNotice> : null}
              {openedPolicyDocument ? (
                <div className="whitespace-pre-wrap break-words rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-4 text-sm font-semibold leading-7 text-[var(--pbp-text-secondary)]">
                  {openedPolicyDocument.markdown}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </ATypePublicFrame>
  );
}
