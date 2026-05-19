"use client";

import { useEffect, useState } from "react";

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
  if (!value) return "만료일을 확인하고 있어요.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "만료일을 확인하고 있어요.";
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

function GoogleMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-black text-[#2B2118] shadow-sm">
      G
    </span>
  );
}

function WaffleGridMark() {
  return (
    <div aria-hidden="true" className="grid h-12 w-12 grid-cols-3 gap-1 rounded-2xl bg-[#B8742B] p-2 shadow-[inset_0_0_0_1px_rgba(62,39,18,0.22)]">
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className="rounded-[0.35rem] bg-[#FFE7A8] shadow-[inset_0_-1px_0_rgba(62,39,18,0.16)]"
        />
      ))}
    </div>
  );
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
        setMessage("초대장을 불러오는 중 문제가 생겼어요.");
      }
    }

    verifyInvitation();

    return () => controller.abort();
  }, [token]);

  const companyName = readCompanyName(invitation);
  const expiresAtLabel = formatDate(invitation?.expiresAt);
  const isJoinable = verifyState === "valid" && submitState !== "redirecting";

  function handleGoogleJoin() {
    if (!isJoinable) return;
    setSubmitState("redirecting");
    window.location.href = `/api/auth/google/start?requestType=member&token=${encodeURIComponent(token)}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF7E3] px-5 py-6 text-[#2A2016] sm:px-8 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(#D89B43_1px,transparent_1px),linear-gradient(90deg,#D89B43_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="pointer-events-none absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-[#F3C05E]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-8rem] h-96 w-96 rounded-full bg-[#9F6227]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between gap-8 lg:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <WaffleGridMark />
            <div>
              <p className="text-2xl font-black tracking-[-0.04em] text-[#2A2016]">WAFL</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9C6424]">
                Work Assignment Flow
              </p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.54fr)] lg:gap-14">
          <article className="max-w-3xl space-y-8 sm:space-y-10">
            <div className="space-y-5 sm:space-y-6">
              <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.07em] text-[#2A2016] sm:text-6xl lg:text-7xl">
                {companyName}에서
                <br />
                당신을
                <br className="sm:hidden" /> 초대했어요.
              </h1>
            </div>

            <div className="space-y-5 text-3xl font-black leading-tight tracking-[-0.04em] text-[#4A321C] sm:text-4xl lg:text-5xl">
              <p>함께 시작해요.</p>
              <p>
                <span className="inline-block rounded-[1.2rem] bg-[#FFE1A6]/85 px-3 py-1 text-[#7A4516] shadow-[0_12px_34px_rgba(184,116,43,0.2)] ring-1 ring-[#D89B43]/25 sm:px-4">
                  와플
                </span>
                에서.
              </p>
            </div>
          </article>

          <aside className="w-full rounded-[2rem] border border-[#E1AF68]/60 bg-[#FFFDF7]/75 p-5 shadow-[0_24px_70px_rgba(89,53,18,0.14)] backdrop-blur sm:p-6 lg:p-7">
            <div className="space-y-5">
              {verifyState === "loading" ? (
                <div className="rounded-3xl bg-[#FFF4D8] px-5 py-4 text-sm font-bold text-[#8B5A24]">
                  초대장을 확인하고 있어요.
                </div>
              ) : null}

              {verifyState === "invalid" ? (
                <div className="rounded-3xl border border-[#E08A70]/70 bg-[#FFF1EA] px-5 py-4 text-sm font-bold text-[#9B3F24]">
                  {message ?? "초대 링크를 확인할 수 없어요."}
                </div>
              ) : null}

              <button
                  type="button"
                  disabled={!isJoinable}
                  onClick={handleGoogleJoin}
                  className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-[#2A2016] px-5 py-4 text-sm font-black text-[#FFF8E7] shadow-[0_14px_30px_rgba(72,42,16,0.22)] transition hover:-translate-y-0.5 hover:bg-[#3A2A1B] disabled:translate-y-0 disabled:bg-[#D8CDBB] disabled:text-[#857464]"
                >
                  <GoogleMark />
                  {submitState === "redirecting" ? "Google로 이동 중" : "Google로 계속하기"}
                </button>
            </div>
          </aside>
        </div>

        <footer className="relative flex flex-col gap-3 text-xs font-semibold leading-5 text-[#8B6A45] sm:flex-row sm:items-end sm:justify-start">
          <p>
            {expiresAtLabel} 이후
            <br />이 초대장은 사라집니다.
          </p>
        </footer>
      </section>
    </main>
  );
}
