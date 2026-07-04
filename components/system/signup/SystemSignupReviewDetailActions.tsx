"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type {
  SignupReviewDetail,
  SignupReviewStatus,
  SignupReviewTransitionAction,
} from "@/lib/system/signupReviewRepository";

type Props = {
  application: SignupReviewDetail;
};

const REASON_MAX_LENGTH = 600;
const APPROVAL_CONFIRMATION = "RUN_SIGNUP_APPROVAL_PROVISIONING_DEV_TEST";

type ProvisioningPlan = {
  canProvision: boolean;
  blockingReasons: string[];
  wouldCreateCompany: boolean;
  wouldCreateUser: boolean;
  wouldReuseUser: boolean;
  wouldCreateMembership: boolean;
  wouldAssignCompanyAdmin: boolean;
  wouldCreateTrialSubscription: boolean;
  wouldLinkCertificate: boolean;
  requestedPlanCode: string | null;
  trial: {
    startedAt: string | null;
    endsAt: string | null;
    storageLimitBytes: number;
    memberLimit: number;
  };
};

function canMoveToReviewing(status: SignupReviewStatus): boolean {
  return status === "submitted";
}

function canCloseWithReason(status: SignupReviewStatus): boolean {
  return status === "submitted" || status === "reviewing";
}

function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function messageForCode(code: string | undefined): string {
  if (!code) return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED") {
    return "승인 전에 결제수단 준비가 필요합니다.";
  }
  if (code === "SIGNUP_PROVISIONING_EXECUTION_BLOCKED") {
    return "승인 실행 조건이 아직 충족되지 않았습니다.";
  }
  if (code === "SIGNUP_REVIEW_TRANSITION_CONFLICT") {
    return "신청 상태가 바뀌었습니다. 새로고침 후 다시 확인해 주세요.";
  }
  if (code === "SIGNUP_PAYMENT_READINESS_STATUS_CLOSED") {
    return "이미 종료된 신청은 결제수단 준비 상태를 바꿀 수 없습니다.";
  }
  if (code === "WAFL_RUNTIME_BLOCKED") {
    return "현재 환경에서는 이 테스트 작업을 실행할 수 없습니다.";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function ActionButton({
  children,
  disabled,
  tone = "neutral",
  title,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  tone?: "primary" | "neutral" | "warning" | "danger";
  title?: string;
  onClick: () => void;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[var(--pbp-brand-primary)] text-[var(--pbp-text-inverse)]"
      : tone === "warning"
        ? "border border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] text-[var(--pbp-status-warning)]"
        : tone === "danger"
          ? "border border-[var(--pbp-status-danger)] bg-[var(--pbp-status-danger-soft)] text-[var(--pbp-status-danger)]"
          : "border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)]";

  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`wafl-shape-control px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export default function SystemSignupReviewDetailActions({ application }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [provisioningPlan, setProvisioningPlan] = useState<ProvisioningPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  const trimmedReason = reason.trim();
  const reasonRequiredMessage = useMemo(() => {
    if (trimmedReason.length > 0) return null;
    return "보완 요청 또는 반려 사유를 입력해 주세요.";
  }, [trimmedReason]);

  async function runTransition(action: SignupReviewTransitionAction) {
    setMessage(null);
    const needsReason = action === "changes_requested" || action === "rejected";
    if (needsReason && !trimmedReason) {
      setMessage(reasonRequiredMessage);
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/system/signup/applications/${encodeURIComponent(application.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action,
          expectedStatus: application.status,
          reason: needsReason ? trimmedReason.slice(0, REASON_MAX_LENGTH) : undefined,
        }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string } | null;
      if (!response.ok || !payload?.ok) {
        setMessage(messageForCode(payload?.code ?? "SIGNUP_REVIEW_TRANSITION_FAILED"));
        return;
      }
      setMessage("검토 상태를 저장했습니다.");
      router.refresh();
    });
  }

  async function updatePaymentReadiness(method: "POST" | "DELETE") {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/system/signup/applications/${encodeURIComponent(application.id)}/payment-readiness`, {
        method,
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string } | null;
      if (!response.ok || !payload?.ok) {
        setMessage(messageForCode(payload?.code ?? "SIGNUP_PAYMENT_READINESS_FAILED"));
        return;
      }
      setMessage(method === "POST" ? "결제수단 준비 상태로 표시했습니다." : "결제수단 준비 상태를 취소했습니다.");
      router.refresh();
    });
  }

  async function loadProvisioningPlan() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/system/signup/applications/${encodeURIComponent(application.id)}/provisioning-plan`, {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string; plan?: ProvisioningPlan } | null;
      if (!response.ok || !payload?.ok || !payload.plan) {
        setMessage(messageForCode(payload?.code ?? "SIGNUP_PROVISIONING_PLAN_UNAVAILABLE"));
        return;
      }
      setProvisioningPlan(payload.plan);
      setMessage(payload.plan.canProvision ? "승인 준비 상태를 확인했습니다." : "승인 전에 해결할 항목이 있습니다.");
    });
  }

  async function approveAndProvision() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/system/signup/applications/${encodeURIComponent(application.id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ confirmation: APPROVAL_CONFIRMATION }),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        code?: string;
        gate?: { enabled?: boolean; reasons?: string[] };
        plan?: ProvisioningPlan;
      } | null;
      if (payload?.plan) setProvisioningPlan(payload.plan);
      if (!response.ok || !payload?.ok) {
        const gateReasons = payload?.gate?.reasons?.length ? ` (${payload.gate.reasons.join(", ")})` : "";
        setMessage(`${messageForCode(payload?.code)}${gateReasons}`);
        return;
      }
      setMessage("승인과 Trial 생성이 완료되었습니다.");
      router.refresh();
    });
  }

  const reviewingEnabled = canMoveToReviewing(application.status);
  const reasonActionsEnabled = canCloseWithReason(application.status);

  return (
    <div className="wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <ActionButton
            tone="primary"
            disabled={!reviewingEnabled || isPending}
            onClick={() => runTransition("reviewing")}
          >
            검토 시작
          </ActionButton>
          <ActionButton
            tone="warning"
            disabled={!reasonActionsEnabled || isPending || !trimmedReason}
            onClick={() => runTransition("changes_requested")}
          >
            보완 요청
          </ActionButton>
          <ActionButton
            tone="danger"
            disabled={!reasonActionsEnabled || isPending || !trimmedReason}
            onClick={() => runTransition("rejected")}
          >
            반려
          </ActionButton>
          <ActionButton
            disabled={isPending || application.status === "approved" || application.status === "rejected" || application.status === "canceled"}
            onClick={() => updatePaymentReadiness("POST")}
          >
            결제수단 준비
          </ActionButton>
          <ActionButton
            disabled={isPending || !application.paymentReadiness.ready}
            onClick={() => updatePaymentReadiness("DELETE")}
          >
            결제수단 준비 취소
          </ActionButton>
          <ActionButton disabled={isPending} onClick={loadProvisioningPlan}>
            승인 준비 확인
          </ActionButton>
          <ActionButton
            tone="primary"
            disabled={!application.approveEligibility.eligible || isPending}
            onClick={approveAndProvision}
            title={application.approveEligibility.eligible ? "승인과 Trial 생성을 실행합니다." : application.approveEligibility.reasons.join(", ")}
          >
            승인 및 Trial 생성
          </ActionButton>
        </div>

        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-[var(--pbp-text-primary)]">
          사유
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX_LENGTH))}
            rows={4}
            className="min-w-0 wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-brand-primary)]"
            placeholder="신청자에게 보일 보완 요청 또는 반려 사유를 입력합니다."
          />
        </label>

        <div className="wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">
          <p className="font-semibold text-[var(--pbp-text-primary)]">
            승인 준비 상태: {application.approveEligibility.eligible ? "충족" : "확인 필요"}
          </p>
          {application.approveEligibility.reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {application.approveEligibility.reasons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">회사, 관리자, Trial, 증빙 연결 조건이 준비되었습니다.</p>
          )}
        </div>

        {provisioningPlan ? (
          <div className="wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">
            <p className="font-semibold text-[var(--pbp-text-primary)]">
              승인 실행 계획: {provisioningPlan.canProvision ? "준비됨" : "확인 필요"}
            </p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              <span>회사: {provisioningPlan.wouldCreateCompany ? "생성" : "유지"}</span>
              <span>사용자: {provisioningPlan.wouldReuseUser ? "기존 계정 연결" : provisioningPlan.wouldCreateUser ? "신규 생성" : "유지"}</span>
              <span>멤버십: {provisioningPlan.wouldCreateMembership ? "생성" : "유지"}</span>
              <span>관리자 권한: {provisioningPlan.wouldAssignCompanyAdmin ? "부여" : "유지"}</span>
              <span>Trial: {provisioningPlan.wouldCreateTrialSubscription ? "생성" : "유지"}</span>
              <span>사업자등록증: {provisioningPlan.wouldLinkCertificate ? "연결" : "유지"}</span>
              <span>저장공간: {formatBytes(provisioningPlan.trial.storageLimitBytes)}</span>
              <span>구성원: {provisioningPlan.trial.memberLimit}명</span>
            </div>
            {provisioningPlan.blockingReasons.length > 0 ? (
              <p className="mt-2 break-words font-semibold text-[var(--pbp-status-warning)]">
                {provisioningPlan.blockingReasons.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs text-[var(--pbp-text-muted)]">
          승인 전에는 결제수단 준비와 필수 증빙 상태를 확인합니다. 실제 결제나 이메일 발송은 이 화면에서 실행하지 않습니다.
        </p>
        {message ? <p className="break-words text-sm font-semibold text-[var(--pbp-status-warning)]">{message}</p> : null}
      </div>
    </div>
  );
}
