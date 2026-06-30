import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import { SYSTEM_CARD_CLASS, SYSTEM_SMALL_TEXT_CLASS, SYSTEM_VALUE_TEXT_CLASS } from "@/components/system/systemSemanticClassNames";
import type { SignupReviewListResult, SignupReviewStatus } from "@/lib/system/signupReviewRepository";

const FILTERS: Array<{ label: string; value: SignupReviewStatus[] }> = [
  { label: "기본 queue", value: ["submitted", "reviewing", "changes_requested"] },
  { label: "submitted", value: ["submitted"] },
  { label: "reviewing", value: ["reviewing"] },
  { label: "changes_requested", value: ["changes_requested"] },
  { label: "rejected", value: ["rejected"] },
  { label: "provisioning_failed", value: ["provisioning_failed"] },
  { label: "approved", value: ["approved"] },
];

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function filterHref(statuses: SignupReviewStatus[]): string {
  return `/system/signup-applications?status=${encodeURIComponent(statuses.join(","))}&limit=25`;
}

function consentSummary(item: SignupReviewListResult["applications"][number]): string {
  if (item.requiredConsentsComplete) return "충족";
  if (item.requiredConsentTypesPresent && !item.requiredConsentVersionsCurrent) return "버전 불일치";
  return `${item.activeConsentCount}/2`;
}

export default function SystemSignupReviewListView({ result }: { result: SignupReviewListResult }) {
  const statusQuery = encodeURIComponent(result.filters.join(","));
  return (
    <SystemShell>
      <div className="flex flex-col gap-5">
        <header className={SYSTEM_CARD_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">Signup review</p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--pbp-text-primary)]">가입 신청 검토</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]">
                실제 system-admin 세션으로만 접근하는 검토 queue입니다. 승인/provisioning은 아직 실행하지 않습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <Link key={filter.label} href={filterHref(filter.value)} className="rounded-full border border-[var(--pbp-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <section className={SYSTEM_CARD_CLASS}>
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[1.1fr_1fr_1fr_0.8fr_0.7fr_0.8fr_0.8fr_0.7fr_0.7fr] gap-3 border-b border-[var(--pbp-border)] px-2 pb-3 text-xs font-semibold text-[var(--pbp-text-muted)]">
                <span>신청자</span>
                <span>회사</span>
                <span>사업자</span>
                <span>요금제</span>
                <span>상태</span>
                <span>제출</span>
                <span>보완</span>
                <span>파일</span>
                <span>동의</span>
              </div>
              <div className="divide-y divide-[var(--pbp-border)]">
                {result.applications.map((item) => (
                  <Link
                    key={item.id}
                    href={`/system/signup-applications/${encodeURIComponent(item.id)}`}
                    className="grid grid-cols-[1.1fr_1fr_1fr_0.8fr_0.7fr_0.8fr_0.8fr_0.7fr_0.7fr] gap-3 px-2 py-4 text-sm transition hover:bg-[var(--pbp-surface-muted)]"
                  >
                    <span>
                      <span className={`block font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{item.applicantName}</span>
                      <span className={SYSTEM_SMALL_TEXT_CLASS}>{item.emailDisplay}</span>
                    </span>
                    <span className="font-medium text-[var(--pbp-text-primary)]">{item.requestedCompanyName}</span>
                    <span>
                      <span className="block font-medium text-[var(--pbp-text-primary)]">{item.businessName}</span>
                      <span className={SYSTEM_SMALL_TEXT_CLASS}>{item.businessRegistrationNumberMasked}</span>
                    </span>
                    <span>{item.requestedPlanCode}</span>
                    <span>
                      <AdminStatusBadge tone={item.status === "rejected" ? "danger" : item.status === "changes_requested" ? "warning" : "info"}>
                        {item.status}
                      </AdminStatusBadge>
                    </span>
                    <span>{formatDate(item.submittedAt)}</span>
                    <span>{item.correctionDueAt ? formatDate(item.correctionDueAt) : item.correctionReason ? "요청됨" : "-"}</span>
                    <span>{item.certificate.exists ? "있음" : "없음"}</span>
                    <span>{consentSummary(item)}</span>
                  </Link>
                ))}
                {result.applications.length === 0 ? (
                  <div className="px-2 py-8 text-sm text-[var(--pbp-text-muted)]">표시할 가입 신청이 없습니다.</div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[var(--pbp-text-muted)]">limit {result.pagination.limit} / offset {result.pagination.offset}</p>
            <div className="flex gap-2">
              {result.pagination.offset > 0 ? (
                <Link href={`/system/signup-applications?status=${statusQuery}&limit=${result.pagination.limit}&offset=${Math.max(0, result.pagination.offset - result.pagination.limit)}`} className="rounded-full border border-[var(--pbp-border)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)]">
                  이전
                </Link>
              ) : null}
              {result.pagination.nextOffset !== null ? (
                <Link href={`/system/signup-applications?status=${statusQuery}&limit=${result.pagination.limit}&offset=${result.pagination.nextOffset}`} className="rounded-full border border-[var(--pbp-border)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)]">
                  다음
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </SystemShell>
  );
}
