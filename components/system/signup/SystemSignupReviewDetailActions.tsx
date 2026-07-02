"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { SignupReviewDetail, SignupReviewStatus, SignupReviewTransitionAction } from "@/lib/system/signupReviewRepository";

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
  if (!code) return "요청을 처리하지 못했습니다.";
  if (code === "SIGNUP_APPROVAL_PAYMENT_READINESS_REQUIRED") return "승인 전에 결제수단 readiness가 필요합니다.";
  if (code === "SIGNUP_PROVISIONING_EXECUTION_BLOCKED") return "승인 실행 gate가 닫혀 있습니다. dev/test 승인 환경과 confirmation을 확인하세요.";
  if (code === "SIGNUP_REVIEW_TRANSITION_CONFLICT") return "현재 상태가 변경되어 요청을 적용하지 못했습니다. 새로고침 후 다시 확인하세요.";
  if (code === "SIGNUP_PAYMENT_READINESS_STATUS_CLOSED") return "이미 종료된 신청에는 readiness를 변경할 수 없습니다.";
  if (code === "WAFL_RUNTIME_BLOCKED") return "production에서는 fake payment readiness를 만들 수 없습니다.";
  return code;
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
    return "보완 요청 또는 반려 사유를 입력하세요.";
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
      setMessage("검토 상태가 갱신되었습니다.");
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
      setMessage(method === "POST" ? "dev/test 결제 readiness를 준비했습니다." : "결제 readiness를 취소했습니다.");
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
      setMessage(payload.plan.canProvision ? "승인 실행 계획을 확인했습니다." : "승인 실행 차단 사유가 있습니다.");
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
      setMessage("승인과 Trial provisioning이 완료되었습니다.");
      router.refresh();
    });
  }

  const reviewingEnabled = canMoveToReviewing(application.status);
  const reasonActionsEnabled = canCloseWithReason(application.status);

  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!reviewingEnabled || isPending}
            onClick={() => runTransition("reviewing")}
            className="rounded-full bg-[var(--pbp-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-inverse)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            검토 시작
          </button>
          <button
            type="button"
            disabled={!reasonActionsEnabled || isPending || !trimmedReason}
            onClick={() => runTransition("changes_requested")}
            className="rounded-full border border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] px-4 py-2 text-sm font-semibold text-[var(--pbp-status-warning)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            보완 요청
          </button>
          <button
            type="button"
            disabled={!reasonActionsEnabled || isPending || !trimmedReason}
            onClick={() => runTransition("rejected")}
            className="rounded-full border border-[var(--pbp-status-danger)] bg-[var(--pbp-status-danger-soft)] px-4 py-2 text-sm font-semibold text-[var(--pbp-status-danger)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            반려
          </button>
          <button
            type="button"
            disabled={isPending || application.status === "approved" || application.status === "rejected" || application.status === "canceled"}
            onClick={() => updatePaymentReadiness("POST")}
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            dev/test 결제 준비
          </button>
          <button
            type="button"
            disabled={isPending || !application.paymentReadiness.ready}
            onClick={() => updatePaymentReadiness("DELETE")}
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            readiness 취소
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={loadProvisioningPlan}
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            승인 계획 확인
          </button>
          <button
            type="button"
            disabled={!application.approveEligibility.eligible || isPending}
            onClick={approveAndProvision}
            className="rounded-full bg-[var(--pbp-brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-inverse)] disabled:cursor-not-allowed disabled:opacity-45"
            title={application.approveEligibility.eligible ? "dev/test 승인 실행 gate와 confirmation을 포함해 provisioning을 실행합니다." : application.approveEligibility.reasons.join(", ")}
          >
            승인 및 Trial 생성
          </button>
        </div>
        <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-[var(--pbp-text-primary)]">
          사유
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX_LENGTH))}
            rows={4}
            className="min-w-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-brand-primary)]"
            placeholder="신청자에게 보이는 보완 요청 또는 반려 사유를 입력합니다."
          />
        </label>
        <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">
          <p className="font-semibold text-[var(--pbp-text-primary)]">
            승인 eligibility: {application.approveEligibility.eligible ? "충족" : "미충족"}
          </p>
          {application.approveEligibility.reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {application.approveEligibility.reasons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">company/member/subscription provisioning 조건이 준비되었습니다. 실제 실행은 서버 gate와 confirmation을 통과한 뒤에만 가능합니다.</p>
          )}
        </div>
        {provisioningPlan ? (
          <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">
            <p className="font-semibold text-[var(--pbp-text-primary)]">
              Provisioning plan: {provisioningPlan.canProvision ? "ready" : "blocked"}
            </p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              <span>company: {provisioningPlan.wouldCreateCompany ? "create" : "-"}</span>
              <span>user: {provisioningPlan.wouldReuseUser ? "reuse by Google sub" : provisioningPlan.wouldCreateUser ? "create" : "-"}</span>
              <span>membership: {provisioningPlan.wouldCreateMembership ? "create" : "-"}</span>
              <span>company-admin permissions: {provisioningPlan.wouldAssignCompanyAdmin ? "assign" : "-"}</span>
              <span>Trial subscription: {provisioningPlan.wouldCreateTrialSubscription ? "create" : "-"}</span>
              <span>certificate: {provisioningPlan.wouldLinkCertificate ? "link" : "-"}</span>
              <span>storage: {formatBytes(provisioningPlan.trial.storageLimitBytes)}</span>
              <span>members: {provisioningPlan.trial.memberLimit}</span>
            </div>
            {provisioningPlan.blockingReasons.length > 0 ? (
              <p className="mt-2 break-words font-semibold text-[var(--pbp-status-warning)]">{provisioningPlan.blockingReasons.join(", ")}</p>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs text-[var(--pbp-text-muted)]">
          상태 전환은 compare-and-set으로 보호됩니다. dev/test fake readiness는 실제 카드/PG를 저장하지 않으며 production runtime에서는 서버에서 차단됩니다.
        </p>
        {message ? <p className="break-words text-sm font-semibold text-[var(--pbp-status-warning)]">{message}</p> : null}
      </div>
    </div>
  );
}
