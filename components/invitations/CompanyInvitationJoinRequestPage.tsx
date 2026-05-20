"use client";

import { useEffect, useState } from "react";

import {
  ATypePublicCard,
  ATypePublicFrame,
  ATypePublicNotice,
  GoogleMark,
} from "@/components/public/ATypePublicFrame";
import {
  resolveCompanyInvitationAlreadyUsedMessage,
  resolveCompanyInvitationErrorMessage,
} from "@/lib/invitations/invitationErrorPresentation";

interface CompanyInvitationJoinRequestPageProps {
  token: string;
}

type SubmitState = "idle" | "redirecting";
type VerifyState = "idle" | "loading" | "valid" | "invalid";

type PublicCompanyInvitation = {
  id?: string;
  recipientEmail?: string | null;
  status?: string | null;
  expiresAt?: string | null;
};

type VerifyInvitationPayload = {
  ok?: boolean;
  isJoinable?: boolean;
  error?: string;
  invitation?: PublicCompanyInvitation | null;
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

export default function CompanyInvitationJoinRequestPage({ token }: CompanyInvitationJoinRequestPageProps) {
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<PublicCompanyInvitation | null>(null);

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    async function verifyInvitation() {
      setVerifyState("loading");
      try {
        const response = await fetch(
          `/api/invitations/verify?requestType=company&token=${encodeURIComponent(token)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as VerifyInvitationPayload;
        if (!response.ok || !payload.ok) {
          setVerifyState("invalid");
          setMessage(resolveCompanyInvitationErrorMessage(payload.error ?? null));
          setInvitation(payload.invitation ?? null);
          return;
        }

        setInvitation(payload.invitation ?? null);

        if (!payload.isJoinable) {
          setVerifyState("invalid");
          const status = payload.invitation?.status ?? null;
          setMessage(
            status === "accepted"
              ? resolveCompanyInvitationAlreadyUsedMessage()
              : resolveCompanyInvitationErrorMessage(payload.error ?? null),
          );
          return;
        }

        setVerifyState("valid");
        setMessage(null);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setVerifyState("invalid");
        setMessage("고객사 초대장을 불러오는 중 문제가 발생했습니다.");
      }
    }

    verifyInvitation();

    return () => controller.abort();
  }, [token]);

  const invitationStatusLabel =
    verifyState === "valid"
      ? "사용 가능한 초대 링크"
      : verifyState === "invalid"
        ? "초대 링크 확인 실패"
        : "초대 링크 확인 중";
  const expiresAtLabel = formatDate(invitation?.expiresAt);
  const isJoinable = verifyState === "valid" && submitState !== "redirecting";

  function handleGoogleJoin() {
    if (!isJoinable) return;
    setSubmitState("redirecting");
    window.location.href = `/api/auth/google/start?requestType=company&token=${encodeURIComponent(token)}`;
  }

  return (
    <ATypePublicFrame
      eyebrow="Company admin invitation"
      title={
        <>
          고객사 관리자
          <br />
          등록을 시작하세요.
        </>
      }
      description="Google 계정으로 본인 확인을 진행한 뒤 회사 정보와 담당자 정보를 입력하고 승인 요청을 보낼 수 있습니다."
      heroItems={["회사 정보", "대표 관리자", "승인 요청", "Trial 7일"]}
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
          <ATypePublicNotice tone="success">이 링크로 고객사 관리자 등록을 시작할 수 있습니다.</ATypePublicNotice>
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
          Google 로그인 이메일과 초대 이메일 일치 여부는 검사하지 않습니다. 회사 정보 입력은 로그인 후 관리자 화면에서 진행합니다.
        </p>
      </ATypePublicCard>
    </ATypePublicFrame>
  );
}
