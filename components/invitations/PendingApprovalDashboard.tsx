import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import {
  PENDING_APPROVAL_ACCESS_ITEMS,
  PENDING_APPROVAL_DASHBOARD_DESCRIPTION,
  PENDING_APPROVAL_DASHBOARD_TITLE,
  PENDING_APPROVAL_POLICY_NOTES,
  PENDING_APPROVAL_STEPS,
  PENDING_APPROVAL_SUMMARY_ITEMS,
  getPendingApprovalAccessTone,
} from "@/lib/invitations/pendingApprovalDashboardPresentation";

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

function LogoutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function PendingApprovalDashboard() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_48%,#eef2ff_100%)] px-4 py-5 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[30px] border border-stone-200 bg-white/95 px-5 py-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
                  PeacebyPiece
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">
                  {WORKSPACE_COMPANY_NAME}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">
                  v{APP_VERSION}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-950">
                {PENDING_APPROVAL_DASHBOARD_TITLE}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
                {PENDING_APPROVAL_DASHBOARD_DESCRIPTION}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/me/settings"
                className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
              >
                개인 설정
              </Link>
              <Link
                href="/workspace"
                aria-label="승인 후 메인화면"
                title="승인 후 메인화면"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50"
              >
                <HomeIcon />
              </Link>
              <button
                type="button"
                disabled
                title="로그아웃 연결 예정"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-stone-400"
              >
                <span className="sr-only">로그아웃 연결 예정</span>
                <LogoutIcon />
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PENDING_APPROVAL_SUMMARY_ITEMS.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-stone-500">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-stone-950">{item.value}</p>
              <p className="mt-3 text-xs leading-5 text-stone-500">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white/90 p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">승인 전 접근 범위</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              승인 전 사용자는 신청 상태 확인과 개인 설정 정도만 접근할 수 있고, 고객사 업무 데이터는 차단합니다.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {PENDING_APPROVAL_ACCESS_ITEMS.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPendingApprovalAccessTone(item.status)}`}
                  >
                    {item.statusLabel}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-stone-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white/90 p-5 shadow-sm">
          <div className="border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">승인 처리 흐름</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              가입 신청 접수 후 고객관리자가 승인하고 권한을 확정하기까지의 기준입니다.
            </p>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-4">
            {PENDING_APPROVAL_STEPS.map((step, index) => (
              <article
                key={step.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-stone-950">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-stone-600">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          {PENDING_APPROVAL_POLICY_NOTES.map((note) => (
            <article
              key={note.id}
              className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-stone-950">{note.title}</h2>
              <p className="mt-2 text-xs leading-5 text-stone-600">{note.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
