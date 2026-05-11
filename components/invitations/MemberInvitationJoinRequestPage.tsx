import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  MEMBER_INVITATION_JOIN_REQUEST_DESCRIPTION,
  MEMBER_INVITATION_JOIN_REQUEST_FIELDS,
  MEMBER_INVITATION_JOIN_REQUEST_POLICY_NOTES,
  MEMBER_INVITATION_JOIN_REQUEST_STEPS,
  MEMBER_INVITATION_JOIN_REQUEST_TITLE,
  createMemberInvitationTokenPreview,
  type MemberInvitationJoinRequestStatus,
} from "@/lib/invitations/memberInvitationJoinRequestPresentation";

interface MemberInvitationJoinRequestPageProps {
  token: string;
}

function getStatusClassName(status: MemberInvitationJoinRequestStatus): string {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "planned") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export default function MemberInvitationJoinRequestPage({
  token,
}: MemberInvitationJoinRequestPageProps) {
  const tokenPreview = createMemberInvitationTokenPreview(token);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                MEMBER JOIN REQUEST
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  {MEMBER_INVITATION_JOIN_REQUEST_TITLE}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  {MEMBER_INVITATION_JOIN_REQUEST_DESCRIPTION}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/admin"
                aria-label="관리자 홈"
                title="관리자 홈"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-50"
              >
                <HomeIcon />
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="border-b border-stone-100 pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                Invitation token
              </p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">
                초대 링크 상태
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                현재 버전에서는 URL token을 화면에서 식별하고, 후속 버전에서 DB token_hash 조회와 만료 검증을 연결합니다.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-stone-500">token</p>
                  <p className="mt-1 truncate text-base font-semibold text-stone-950">
                    {tokenPreview.maskedToken}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {tokenPreview.stateLabel}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                {tokenPreview.description}
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              Login gate
            </p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">
              Google 로그인 후 신청
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              이메일/비밀번호 직접 구현은 후순위이며, 1차 인증은 Google OAuth 기준으로 연결합니다.
            </p>
            <button
              type="button"
              disabled
              className="mt-5 w-full rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-400"
            >
              Google 로그인 연결 예정
            </button>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">가입 신청 정보</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              신청 완료 시 join_requests.pending으로 저장되고, 승인 전에는 제한된 대기 화면만 접근합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {MEMBER_INVITATION_JOIN_REQUEST_FIELDS.map((field) => (
              <label
                key={field.id}
                className="block rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <span className="text-xs font-semibold text-stone-500">
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <input
                  type="text"
                  disabled
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-400 outline-none"
                />
                <span className="mt-2 block text-[11px] leading-4 text-stone-500">
                  {field.helper}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-stone-500">
              실제 신청 저장, 중복 신청 방지, 승인 대기 redirect는 후속 API 연결에서 처리합니다.
            </p>
            <button
              type="button"
              disabled
              className="rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-400"
            >
              가입 신청 제출 준비중
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">처리 흐름</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              초대 링크 접속부터 고객관리자 승인까지의 상태 전환 기준입니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {MEMBER_INVITATION_JOIN_REQUEST_STEPS.map((step, index) => (
              <article
                key={step.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                      step.status,
                    )}`}
                  >
                    {step.statusLabel}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-stone-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {MEMBER_INVITATION_JOIN_REQUEST_POLICY_NOTES.map((note) => (
            <article
              key={note.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-stone-950">{note.title}</h2>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {note.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
