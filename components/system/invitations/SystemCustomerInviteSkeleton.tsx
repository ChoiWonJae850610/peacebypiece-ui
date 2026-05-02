import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_CUSTOMER_INVITE_FIELDS,
  SYSTEM_CUSTOMER_INVITE_POLICY_NOTES,
  SYSTEM_CUSTOMER_INVITE_STEPS,
} from "@/lib/system/systemCustomerInviteSkeleton";

function getStepStatusClassName(status: "ready" | "planned" | "locked") {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "planned") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

export default function SystemCustomerInviteSkeleton() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM INVITATION
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  시스템관리자 고객 초대
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  시스템관리자가 고객사를 선택하고 고객사 관리자를 초대하는 화면 skeleton입니다.
                  실제 이메일 발송 없이 초대 링크 생성 흐름을 먼저 고정합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템 콘솔
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {SYSTEM_CUSTOMER_INVITE_FIELDS.map((field) => (
            <article
              key={field.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-stone-500">{field.label}</p>
              <p className="mt-2 text-lg font-semibold text-stone-950">{field.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                {field.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">초대 생성 흐름</h2>
            <p className="text-sm leading-6 text-stone-600">
              0.9.63 초대 링크 생성 API와 연결하기 전까지 입력, 정책, 결과 영역만 고정합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            {SYSTEM_CUSTOMER_INVITE_STEPS.map((step, index) => (
              <article
                key={step.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStepStatusClassName(
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

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">초대 링크 생성 영역</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-medium text-stone-700">
                고객사
                <input
                  value="샘플 고객사"
                  readOnly
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-stone-700">
                고객관리자 이메일
                <input
                  value="admin@example.com"
                  readOnly
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-stone-700">
                초대 링크
                <input
                  value="API 연결 후 생성 응답에서 1회 표시"
                  readOnly
                  className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400"
              >
                초대 링크 생성 준비중
              </button>
              <button
                type="button"
                disabled
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-400"
              >
                QR 표시 준비중
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">정책 메모</h2>
            <ul className="mt-4 space-y-3">
              {SYSTEM_CUSTOMER_INVITE_POLICY_NOTES.map((note) => (
                <li key={note} className="flex gap-2 text-sm leading-6 text-stone-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </main>
  );
}
