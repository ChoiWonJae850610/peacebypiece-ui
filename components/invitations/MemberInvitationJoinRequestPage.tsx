"use client";

import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";

interface MemberInvitationJoinRequestPageProps {
  token: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

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
  if (!value) return "만료일 확인 중";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "만료일 확인 중";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function readCompanyName(invitation: PublicMemberInvitation | null): string {
  return invitation?.companyName || invitation?.customerName || "초대한 고객사";
}

function readPermissionLabel(invitation: PublicMemberInvitation | null): string {
  const preset = invitation?.permissionPreset || invitation?.recipientRole;
  if (!preset) return "초대 권한 확인 중";
  return preset
    .split(/[_.-]/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function readFriendlyError(error: string | null): string {
  if (error === "INVITATION_NOT_FOUND") return "유효하지 않은 초대 링크예요.";
  if (error === "INVITATION_EXPIRED") return "초대가 만료되었어요.";
  if (error === "INVITATION_NOT_ACTIVE") return "현재 사용할 수 없는 초대예요.";
  if (error === "INVITATION_SCOPE_MISMATCH") return "초대 링크의 사용 범위가 맞지 않아요.";
  return "초대 링크를 확인할 수 없어요.";
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
  const [verifyState, setVerifyState] = useState<VerifyState>(token.startsWith("preview-") ? "valid" : "idle");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<PublicMemberInvitation | null>(
    token.startsWith("preview-")
      ? {
          companyName: "샘플 고객사",
          recipientEmail: "member@example.com",
          permissionPreset: "검수 담당",
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      : null,
  );

  useEffect(() => {
    if (!token || token.startsWith("preview-")) return;

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
          setMessage(readFriendlyError(payload.error ?? null));
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
  const permissionLabel = readPermissionLabel(invitation);
  const expiresAtLabel = formatDate(invitation?.expiresAt);
  const recipientEmail = invitation?.recipientEmail || "Google 계정으로 확인 예정";
  const isJoinable = verifyState === "valid" && submitState !== "submitting";

  async function handleMockGoogleJoin() {
    if (!isJoinable) return;

    setSubmitState("submitting");
    setMessage("Google 계정 확인 화면으로 이동하는 중이에요.");

    window.setTimeout(() => {
      setSubmitState("success");
      setMessage("가입 신청이 접수되었어요. 관리자 승인을 기다려 주세요.");
    }, 520);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF8E7] px-4 py-8 text-[#2B2118] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(#D79C4A_1px,transparent_1px),linear-gradient(90deg,#D79C4A_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#F5B544]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-[#B8742B]/20 blur-3xl" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-[#D9A45A]/70 bg-[#FFFDF5]/90 shadow-[0_28px_80px_rgba(86,52,20,0.18)] backdrop-blur">
          <div className="flex flex-col gap-8 p-7 sm:p-9 lg:flex-row lg:items-stretch lg:p-10">
            <aside className="flex flex-col justify-between rounded-[1.6rem] bg-[#2B2118] p-6 text-[#FFF8E7] lg:w-72">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <WaffleGridMark />
                  <div>
                    <p className="text-2xl font-black tracking-tight">WAFL</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F6D58A]">
                      Work Assignment Flow
                    </p>
                  </div>
                </div>
                <div className="h-px bg-[#FFF8E7]/20" />
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F6D58A]">Invitation</p>
                  <h1 className="text-3xl font-black leading-tight tracking-[-0.04em]">
                    따뜻한 초대장이 도착했어요.
                  </h1>
                  <p className="text-sm leading-6 text-[#FFE7A8]">
                    WAFL은 작업지시서, 디자인, 파일, 생산 흐름을 한곳에서 확인하는 의류 생산관리 워크플로우입니다.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-[#FFF8E7]/15 bg-[#FFF8E7]/10 p-4 text-xs leading-5 text-[#FFE7A8]">
                v{APP_VERSION} · 초대 링크는 만료일 이후 사용할 수 없어요.
              </div>
            </aside>

            <article className="flex min-h-[560px] flex-1 flex-col justify-between gap-8">
              <div className="space-y-7">
                <div className="space-y-3">
                  <span className="inline-flex rounded-full bg-[#FFE7A8] px-3 py-1 text-xs font-bold text-[#6F3D14]">
                    WAFL 초대장
                  </span>
                  <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-[-0.04em] text-[#2B2118] sm:text-4xl">
                    {companyName}에서 당신을 초대했어요.
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-[#6A5948]">
                    Google 계정으로 가입 신청하면 고객사 관리자의 승인 후 WAFL 업무 화면을 사용할 수 있어요.
                  </p>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#E7BF80] bg-[#FFF8E7] p-4">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9C6424]">Company</dt>
                    <dd className="mt-2 truncate text-sm font-black text-[#2B2118]">{companyName}</dd>
                  </div>
                  <div className="rounded-2xl border border-[#E7BF80] bg-[#FFF8E7] p-4">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9C6424]">Role</dt>
                    <dd className="mt-2 truncate text-sm font-black text-[#2B2118]">{permissionLabel}</dd>
                  </div>
                  <div className="rounded-2xl border border-[#E7BF80] bg-[#FFF8E7] p-4">
                    <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9C6424]">Until</dt>
                    <dd className="mt-2 truncate text-sm font-black text-[#2B2118]">{expiresAtLabel}</dd>
                  </div>
                </dl>

                <div className="rounded-[1.4rem] border border-[#E7BF80] bg-white/70 p-4">
                  <p className="text-xs font-bold text-[#9C6424]">초대 대상</p>
                  <p className="mt-1 text-sm font-semibold text-[#2B2118]">{recipientEmail}</p>
                </div>
              </div>

              <div className="space-y-4">
                {verifyState === "invalid" ? (
                  <div className="rounded-2xl border border-[#E08A70] bg-[#FFF1EA] px-4 py-3 text-sm font-semibold text-[#9B3F24]">
                    {message ?? "초대 링크를 확인할 수 없어요."}
                  </div>
                ) : null}

                {submitState === "success" ? (
                  <div className="rounded-2xl border border-[#7CB68A] bg-[#EEF9EE] px-4 py-3 text-sm font-semibold text-[#2B6A3A]">
                    {message}
                  </div>
                ) : null}

                {submitState !== "success" ? (
                  <button
                    type="button"
                    disabled={!isJoinable}
                    onClick={handleMockGoogleJoin}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#2B2118] px-5 py-4 text-sm font-black text-[#FFF8E7] shadow-[0_12px_28px_rgba(86,52,20,0.22)] transition hover:-translate-y-0.5 hover:bg-[#3B2A1C] disabled:translate-y-0 disabled:bg-[#D8CDBB] disabled:text-[#857464]"
                  >
                    <GoogleMark />
                    {submitState === "submitting" ? "Google 계정 확인 중" : "Google로 가입 신청하기"}
                  </button>
                ) : null}

                <p className="text-center text-xs leading-5 text-[#7D6A58]">
                  실제 Google OAuth 연결은 다음 단계에서 추가됩니다. 지금은 가입 신청 흐름을 미리 확인하는 화면입니다.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
