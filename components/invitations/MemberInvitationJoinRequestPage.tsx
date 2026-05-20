"use client";

import { useEffect, useState } from "react";

import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
  GoogleMark,
} from "@/components/public/ATypePublicFrame";
import { resolveMemberInvitationErrorMessage } from "@/lib/invitations/invitationErrorPresentation";

interface MemberInvitationJoinRequestPageProps {
  token: string;
}

type SubmitState = "idle" | "redirecting";
type VerifyState = "idle" | "loading" | "valid" | "invalid";

type PublicMemberInvitation = {
  id?: string;
  companyId?: string | null;
  companyName?: string | null;
  customerName?: string | null;
  recipientEmail?: string | null;
  permissionPreset?: string | null;
  recipientRole?: string | null;
  status?: string | null;
  expiresAt?: string | null;
};

type VerifyInvitationPayload = {
  ok?: boolean;
  isJoinable?: boolean;
  error?: string;
  invitation?: PublicMemberInvitation | null;
};

function formatDate(value?: string | null): string {
  if (!value) return "만료일을 확인하고 있습니다.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "만료일을 확인하고 있습니다.";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readCompanyName(invitation: PublicMemberInvitation | null): string {
  return invitation?.companyName || invitation?.customerName || "초대한 고객사";
}

export default function MemberInvitationJoinRequestPage({
  token,
}: MemberInvitationJoinRequestPageProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<PublicMemberInvitation | null>(null);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    async function verifyInvitation() {
      setVerifyState("loading");
      try {
        const response = await fetch(
          `/api/invitations/verify?requestType=member&token=${encodeURIComponent(token)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as VerifyInvitationPayload;
        if (!response.ok || !payload.ok || !payload.isJoinable) {
          setVerifyState("invalid");
          setMessage(resolveMemberInvitationErrorMessage(payload.error ?? null));
          setInvitation(payload.invitation ?? null);
          return;
        }
        setInvitation(payload.invitation ?? null);
        setVerifyState("valid");
        setMessage(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setVerifyState("invalid");
        setMessage("초대장을 불러오는 중 문제가 발생했습니다.");
      }
    }

    verifyInvitation();

    return () => controller.abort();
  }, [token]);

  const companyName = readCompanyName(invitation);
  const expiresAtLabel = formatDate(invitation?.expiresAt);
  const isJoinable = verifyState === "valid" && submitState !== "redirecting";
  const invitationStatusLabel =
    verifyState === "valid"
      ? "사용 가능한 초대 링크"
      : verifyState === "invalid"
        ? "초대 링크 확인 실패"
        : "초대 링크 확인 중";

  function handleGoogleJoin() {
    if (!isJoinable) return;
    setSubmitState("redirecting");
    window.location.href = `/api/auth/google/start?requestType=member&token=${encodeURIComponent(token)}`;
  }

  return (
    <ATypePublicFrame
      eyebrow="Member invitation"
      title={
        <>
          WAFL 멤버
          <br />
          참여를 요청하세요.
        </>
      }
      description={`${companyName}에서 보낸 초대 링크입니다. Google 계정으로 본인 확인을 진행하면 관리자 승인 대기 상태로 등록됩니다.`}
      heroItems={["멤버 초대", "권한 템플릿", "승인 대기", "작업 참여"]}
      footer={
        <p>
          {expiresAtLabel} 이후 이 초대 링크는 사용할 수 없습니다.
        </p>
      }
    >
      <ATypePublicCard eyebrow="초대 상태" title={invitationStatusLabel}>
        {verifyState === "loading" ? (
          <ATypePublicNotice tone="neutral">초대장을 확인하고 있습니다.</ATypePublicNotice>
        ) : null}

        {verifyState === "invalid" ? (
          <ATypePublicNotice tone="danger">{message ?? "초대 링크를 확인할 수 없습니다."}</ATypePublicNotice>
        ) : null}

        {verifyState === "valid" ? (
          <ATypePublicNotice tone="success">이 링크로 WAFL 참여 요청을 보낼 수 있습니다.</ATypePublicNotice>
        ) : null}

        <button
          type="button"
          disabled={!isJoinable}
          onClick={handleGoogleJoin}
          className="flex w-full items-center justify-center gap-3 rounded-[var(--pbp-radius-xl)] bg-[var(--pbp-action-primary-surface)] px-5 py-4 text-sm font-black text-[var(--pbp-action-primary-text)] shadow-[var(--pbp-shadow-elevated-a-type)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-action-primary-surface-hover)] disabled:translate-y-0 disabled:bg-[var(--pbp-text-disabled)] disabled:text-[var(--pbp-text-secondary)]"
        >
          <GoogleMark />
          {submitState === "redirecting" ? "Google로 이동 중" : "Google로 계속하기"}
        </button>

        <p className="text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">
          초대 승인 전에는 고객사 업무 화면에 접근할 수 없습니다. 승인 상태는 승인 대기 화면에서 확인할 수 있습니다.
        </p>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
