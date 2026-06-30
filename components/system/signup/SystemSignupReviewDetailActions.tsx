"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { SignupReviewDetail, SignupReviewStatus, SignupReviewTransitionAction } from "@/lib/system/signupReviewRepository";

type Props = {
  application: SignupReviewDetail;
};

const REASON_MAX_LENGTH = 600;

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
            disabled
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-sm font-semibold text-[var(--pbp-text-muted)] opacity-55"
            title={application.approveEligibility.eligible ? "provisioning 실행은 다음 승인 단계에서 별도 연결합니다." : application.approveEligibility.reasons.join(", ")}
          >
            승인 준비 중
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
            <p className="mt-2">실제 company/member/subscription provisioning 실행은 아직 연결하지 않았습니다.</p>
          )}
        </div>
        <p className="text-xs text-[var(--pbp-text-muted)]">
          현재 상태가 바뀐 경우 compare-and-set 보호로 충돌 처리됩니다. 실제 승인, 회사 생성, Trial 활성화, 이메일 발송은 실행하지 않습니다.
        </p>
        {message ? <p className="text-sm font-semibold text-[var(--pbp-status-warning)]">{message}</p> : null}
      </div>
    </div>
  );
}
