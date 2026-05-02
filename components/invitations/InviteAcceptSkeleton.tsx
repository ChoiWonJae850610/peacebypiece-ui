import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  INVITATION_ACCEPT_POLICY_NOTES,
  INVITATION_ACCEPT_STATUS_CARDS,
  maskInviteToken,
} from "@/lib/invitations/invitationAcceptanceSkeleton";

interface InviteAcceptSkeletonProps {
  token: string;
}

function getStatusClassName(index: number) {
  if (index === 0) {
    return "border-stone-900 bg-stone-900 text-white";
  }

  return "border-stone-200 bg-stone-50 text-stone-600";
}

export default function InviteAcceptSkeleton({ token }: InviteAcceptSkeletonProps) {
  const maskedToken = maskInviteToken(token);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                INVITATION ACCEPT
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                초대 링크 수락
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                초대 링크의 token을 받아 수락 상태를 표시할 skeleton 화면입니다.
                실제 token 검증, 만료 확인, 수락 처리는 다음 API 작업에서 연결합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">수신 token</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            현재 URL에서 받은 token은 화면에서 마스킹해서만 표시합니다.
          </p>
          <code className="mt-4 block truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
            {maskedToken}
          </code>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {INVITATION_ACCEPT_STATUS_CARDS.map((card, index) => (
            <article
              key={card.status}
              className={`rounded-3xl border p-5 shadow-sm ${getStatusClassName(index)}`}
            >
              <p className="text-xs font-semibold opacity-80">{card.label}</p>
              <h2 className="mt-3 text-base font-semibold">{card.title}</h2>
              <p className="mt-2 text-xs leading-5 opacity-80">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">수락 처리 준비</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              0.9.85에서 초대 수락 API skeleton이 연결되면 이 영역에서 상태 조회와 수락 버튼을 활성화합니다.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400"
            >
              초대 검증 준비중
            </button>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">정책 메모</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-600">
              {INVITATION_ACCEPT_POLICY_NOTES.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
