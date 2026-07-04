import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import { SYSTEM_CARD_CLASS, SYSTEM_SMALL_TEXT_CLASS, SYSTEM_VALUE_TEXT_CLASS } from "@/components/system/systemSemanticClassNames";
import type { SignupReviewListResult, SignupReviewStatus } from "@/lib/system/signupReviewRepository";

const FILTERS: Array<{ label: string; value: SignupReviewStatus[] }> = [
  { label: "기본 대기열", value: ["submitted", "reviewing", "changes_requested"] },
  { label: "접수됨", value: ["submitted"] },
  { label: "검토 중", value: ["reviewing"] },
  { label: "보완 요청", value: ["changes_requested"] },
  { label: "반려", value: ["rejected"] },
  { label: "승인 실패", value: ["provisioning_failed"] },
  { label: "승인 완료", value: ["approved"] },
];

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function filterHref(statuses: SignupReviewStatus[]): string {
  return `/system/signup-applications?status=${encodeURIComponent(statuses.join(","))}&limit=25`;
}

function statusTone(status: SignupReviewStatus): "danger" | "warning" | "info" {
  if (status === "rejected" || status === "provisioning_failed") return "danger";
  if (status === "changes_requested") return "warning";
  return "info";
}

function consentSummary(item: SignupReviewListResult["applications"][number]): string {
  if (item.requiredConsentsComplete) return "충족";
  if (item.requiredConsentTypesPresent && !item.requiredConsentVersionsCurrent) return "최신 약관 확인 필요";
  return `${item.activeConsentCount}/2`;
}

function readinessLabel(item: SignupReviewListResult["applications"][number]): string {
  if (item.paymentReadiness.ready) return "준비됨";
  if (item.paymentReadiness.state === "blocked_pending_provider") return "결제 연동 대기";
  if (item.paymentReadiness.state === "revoked") return "취소됨";
  return "미준비";
}

function SummaryCard({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "warning" | "danger" }) {
  const toneClass = tone === "danger"
    ? "text-[var(--pbp-status-danger)]"
    : tone === "warning"
      ? "text-[var(--pbp-status-warning)]"
      : "text-[var(--pbp-text-primary)]";
  return (
    <div className="min-w-0 wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3">
      <p className={SYSTEM_SMALL_TEXT_CLASS}>{label}</p>
      <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function SystemSignupReviewListView({ result }: { result: SignupReviewListResult }) {
  const statusQuery = encodeURIComponent(result.filters.join(","));
  return (
    <SystemShell>
      <div className="flex min-w-0 flex-col gap-5">
        <header className={SYSTEM_CARD_CLASS}>
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">SIGNUP REVIEW</p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--pbp-text-primary)]">가입 신청 검토</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]">
                신규 회사 Trial 신청을 검토합니다. 결제수단 준비, 필수 동의, 사업자등록증과 신청 정보를 확인한 뒤 승인하거나 보완 요청/반려할 수 있습니다.
              </p>
            </div>
            <nav aria-label="가입 신청 상태 필터" className="flex min-w-0 flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <Link
                  key={filter.label}
                  href={filterHref(filter.value)}
                  className="wafl-shape-control border border-[var(--pbp-border)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]"
                >
                  {filter.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="접수됨" value={result.summary.submitted} />
            <SummaryCard label="검토 중" value={result.summary.reviewing} />
            <SummaryCard label="보완 요청" value={result.summary.changesRequested} tone="warning" />
            <SummaryCard label="승인 실패" value={result.summary.provisioningFailed} tone="danger" />
            <SummaryCard label="결제수단 미준비" value={result.summary.paymentReadinessMissing} tone="warning" />
          </div>
        </header>

        <section className={SYSTEM_CARD_CLASS}>
          <div className="overflow-x-auto">
            <div className="min-w-[1120px]">
              <div className="grid grid-cols-[1.1fr_1fr_1fr_0.7fr_0.7fr_0.8fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-[var(--pbp-border)] px-2 pb-3 text-xs font-semibold text-[var(--pbp-text-muted)]">
                <span>신청자</span>
                <span>회사</span>
                <span>사업자</span>
                <span>요금제</span>
                <span>상태</span>
                <span>제출</span>
                <span>보완</span>
                <span>증빙</span>
                <span>동의</span>
                <span>결제 준비</span>
              </div>
              <div className="divide-y divide-[var(--pbp-border)]">
                {result.applications.map((item) => (
                  <Link
                    key={item.id}
                    href={`/system/signup-applications/${encodeURIComponent(item.id)}`}
                    className="grid min-w-0 grid-cols-[1.1fr_1fr_1fr_0.7fr_0.7fr_0.8fr_0.8fr_0.7fr_0.7fr_0.8fr] gap-3 px-2 py-4 text-sm transition hover:bg-[var(--pbp-surface-muted)]"
                  >
                    <span className="min-w-0">
                      <span className={`block truncate font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{item.applicantName}</span>
                      <span className={SYSTEM_SMALL_TEXT_CLASS}>{item.emailDisplay}</span>
                    </span>
                    <span className="min-w-0 truncate font-medium text-[var(--pbp-text-primary)]">{item.requestedCompanyName}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-[var(--pbp-text-primary)]">{item.businessName}</span>
                      <span className={SYSTEM_SMALL_TEXT_CLASS}>{item.businessRegistrationNumberMasked}</span>
                    </span>
                    <span className="break-words">{item.requestedPlanCode}</span>
                    <span>
                      <AdminStatusBadge tone={statusTone(item.status)}>{item.status}</AdminStatusBadge>
                    </span>
                    <span>{formatDate(item.submittedAt)}</span>
                    <span>{item.correctionDueAt ? formatDate(item.correctionDueAt) : item.correctionReason ? "요청됨" : "-"}</span>
                    <span>{item.certificate.exists ? "있음" : "없음"}</span>
                    <span>{consentSummary(item)}</span>
                    <span className={item.paymentReadiness.ready ? "font-semibold text-[var(--pbp-status-success)]" : "font-semibold text-[var(--pbp-status-warning)]"}>
                      {readinessLabel(item)}
                    </span>
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
                <Link
                  href={`/system/signup-applications?status=${statusQuery}&limit=${result.pagination.limit}&offset=${Math.max(0, result.pagination.offset - result.pagination.limit)}`}
                  className="wafl-shape-control border border-[var(--pbp-border)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)]"
                >
                  이전
                </Link>
              ) : null}
              {result.pagination.nextOffset !== null ? (
                <Link
                  href={`/system/signup-applications?status=${statusQuery}&limit=${result.pagination.limit}&offset=${result.pagination.nextOffset}`}
                  className="wafl-shape-control border border-[var(--pbp-border)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)]"
                >
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
