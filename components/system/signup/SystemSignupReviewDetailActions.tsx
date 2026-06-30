"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { SignupReviewDetail, SignupReviewStatus, SignupReviewTransitionAction } from "@/lib/system/signupReviewRepository";

type Props = {
  application: SignupReviewDetail;
};

const REASON_MAX_LENGTH = 600;

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
        setMessage(payload?.code ?? "SIGNUP_REVIEW_TRANSITION_FAILED");
        return;
      }
      setMessage("상태가 갱신되었습니다.");
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
        setMessage(payload?.code ?? "SIGNUP_PROVISIONING_PLAN_UNAVAILABLE");
        return;
      }
      setProvisioningPlan(payload.plan);
      setMessage(payload.plan.canProvision ? "승인 실행 계획을 확인했습니다. 실제 실행은 별도 승인 gate가 필요합니다." : "승인 실행 차단 사유가 있습니다.");
    });
  }

  async function checkApproveGate() {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/system/signup/applications/${encodeURIComponent(application.id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({}),
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
        setMessage(`${payload?.code ?? "SIGNUP_PROVISIONING_EXECUTION_BLOCKED"}${gateReasons}`);
        return;
      }
      setMessage("승인 provisioning이 완료되었습니다.");
      router.refresh();
    });
  }

  const reviewingEnabled = canMoveToReviewing(application.status);
  const reasonActionsEnabled = canCloseWithReason(application.status);

  return (
    <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-4">
      <div className="flex flex-col gap-3">
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
            disabled={isPending}
            onClick={loadProvisioningPlan}
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            승인 계획 확인
          </button>
          <button
            type="button"
            disabled={!application.approveEligibility.eligible || isPending}
            onClick={checkApproveGate}
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
            title={application.approveEligibility.eligible ? "실제 실행은 서버 execution gate와 confirmation이 필요합니다." : application.approveEligibility.reasons.join(", ")}
          >
            승인 실행 gate 확인
          </button>
        </div>
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--pbp-text-primary)]">
          사유
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, REASON_MAX_LENGTH))}
            rows={4}
            className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm font-medium text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-brand-primary)]"
            placeholder="신청자에게 보여도 되는 보완 요청 또는 반려 사유를 입력합니다."
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
            <p className="mt-2">company/member/subscription provisioning port가 준비되었고, 실제 실행은 별도 서버 gate와 confirmation 이후에만 가능합니다.</p>
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
              <span>storage: {provisioningPlan.trial.storageLimitBytes} bytes</span>
              <span>members: {provisioningPlan.trial.memberLimit}</span>
            </div>
            {provisioningPlan.blockingReasons.length > 0 ? (
              <p className="mt-2 font-semibold text-[var(--pbp-status-warning)]">{provisioningPlan.blockingReasons.join(", ")}</p>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs text-[var(--pbp-text-muted)]">
          현재 상태가 바뀐 경우 compare-and-set 보호로 충돌 처리됩니다. 이메일 발송은 실행하지 않으며, 승인 mutation은 서버 gate와 confirmation 없이는 차단됩니다.
        </p>
        {message ? <p className="text-sm font-semibold text-[var(--pbp-status-warning)]">{message}</p> : null}
      </div>
    </div>
  );
}
