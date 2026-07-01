import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import SystemSignupReviewDetailActions from "@/components/system/signup/SystemSignupReviewDetailActions";
import { SYSTEM_CARD_CLASS, SYSTEM_SECTION_TITLE_CLASS, SYSTEM_SMALL_TEXT_CLASS, SYSTEM_VALUE_TEXT_CLASS } from "@/components/system/systemSemanticClassNames";
import type { SignupReviewDetail } from "@/lib/system/signupReviewRepository";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatBytes(value: number | null): string {
  if (value === null) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3">
      <p className={SYSTEM_SMALL_TEXT_CLASS}>{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{value || "-"}</p>
    </div>
  );
}

function ConsentEvidenceStatus({ application }: { application: SignupReviewDetail }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="필수 동의 종류" value={application.requiredConsentTypesPresent ? "충족" : "미충족"} />
      <Field label="현재 정책 버전" value={application.requiredConsentVersionsCurrent ? "충족" : "미충족"} />
      <Field label="전체 검토 조건" value={application.requiredConsentsComplete ? "충족" : "미충족"} />
    </div>
  );
}

export default function SystemSignupReviewDetailView({ application }: { application: SignupReviewDetail }) {
  return (
    <SystemShell>
      <div className="flex min-w-0 flex-col gap-5">
        <header className={SYSTEM_CARD_CLASS}>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">SIGNUP REVIEW</p>
              <h1 className="mt-2 break-words text-2xl font-semibold text-[var(--pbp-text-primary)]">{application.requestedCompanyName}</h1>
              <p className="mt-2 break-words text-sm text-[var(--pbp-text-muted)]">{application.applicantName} / {application.emailDisplay}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <AdminStatusBadge tone="info">{application.status}</AdminStatusBadge>
              <Link href="/system/signup-applications" className="rounded-full border border-[var(--pbp-border)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)]">
                목록
              </Link>
            </div>
          </div>
        </header>

        <section className={SYSTEM_CARD_CLASS}>
          <h2 className={SYSTEM_SECTION_TITLE_CLASS}>신청 정보</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="사업자명" value={application.businessName} />
            <Field label="사업자등록번호" value={application.businessRegistrationNumberMasked} />
            <Field label="요청 요금제" value={application.requestedPlanCode} />
            <Field label="제출 시각" value={formatDate(application.submittedAt)} />
            <Field label="사업자번호 검증" value={application.businessValidationStatus} />
            <Field label="검증 시각" value={formatDate(application.businessValidationCheckedAt)} />
            <Field label="Google email_verified" value={application.identityEvidence.googleEmailVerified ? "true" : "false"} />
            <Field label="Google subject fingerprint" value={application.identityEvidence.googleSubjectFingerprint} />
            <Field label="provisioning error" value={application.provisioningErrorCode} />
          </div>
          {!application.identityEvidence.googleEmailVerified ? (
            <p className="mt-3 text-sm font-semibold text-[var(--pbp-status-danger)]">Google email_verified가 false입니다. 승인 조건을 충족하지 않습니다.</p>
          ) : null}
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <h2 className={SYSTEM_SECTION_TITLE_CLASS}>동의 증거</h2>
          <div className="mt-4">
            <ConsentEvidenceStatus application={application} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {application.consents.map((consent) => (
              <div key={consent.id} className="min-w-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
                <p className="break-words text-sm font-semibold text-[var(--pbp-text-primary)]">{consent.consentType}</p>
                <p className="mt-1 break-words text-xs text-[var(--pbp-text-muted)]">{consent.policyCode} / v{consent.policyVersion}</p>
                <p className="mt-2 text-xs text-[var(--pbp-text-muted)]">동의 {formatDate(consent.agreedAt)} / 철회 {formatDate(consent.revokedAt)}</p>
              </div>
            ))}
            {application.consents.length === 0 ? <p className="text-sm text-[var(--pbp-text-muted)]">동의 증거가 없습니다.</p> : null}
          </div>
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <h2 className={SYSTEM_SECTION_TITLE_CLASS}>사업자등록증</h2>
          <div className="mt-4 min-w-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
            {application.certificate.exists ? (
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-[var(--pbp-text-primary)]">{application.certificate.originalName}</p>
                  <p className="mt-1 break-words text-xs text-[var(--pbp-text-muted)]">
                    {application.certificate.mimeType} / {formatBytes(application.certificate.sizeBytes)} / {formatDate(application.certificate.uploadedAt)}
                  </p>
                </div>
                {application.certificateViewerPath ? (
                  <a
                    href={application.certificateViewerPath}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-full bg-[var(--pbp-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-inverse)]"
                  >
                    inline viewer
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[var(--pbp-text-muted)]">제출된 파일이 없습니다. 증빙 viewer는 서버 프록시로만 열리며 signed URL을 노출하지 않습니다.</p>
            )}
          </div>
        </section>

        <section className={SYSTEM_CARD_CLASS}>
          <h2 className={SYSTEM_SECTION_TITLE_CLASS}>검토 상태</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="보완 사유" value={application.correctionReason} />
            <Field label="보완 기한" value={formatDate(application.correctionDueAt)} />
            <Field label="반려 사유" value={application.rejectionReason} />
            <Field label="검토 시각" value={formatDate(application.reviewedAt)} />
          </div>
          <div className="mt-4">
            <SystemSignupReviewDetailActions application={application} />
          </div>
        </section>
      </div>
    </SystemShell>
  );
}
