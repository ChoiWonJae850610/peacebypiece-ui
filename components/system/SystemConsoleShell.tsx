import Link from "next/link";

import SystemStoragePurgeButton from "@/components/system/storage/SystemStoragePurgeButton";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_CONSOLE_LINKS,
  SYSTEM_CONSOLE_POLICY_NOTES,
  type SystemConsoleTabStatus,
} from "@/lib/system/systemConsoleShell";

function getStatusClassName(status: SystemConsoleTabStatus) {
  if (status === "current") {
    return "border-stone-900 bg-stone-900 text-white";
  }

  if (status === "linked") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "api") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "legacy") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

export default function SystemConsoleShell() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM CONSOLE
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                시스템관리자 콘솔
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                고객사 관리, 고객 초대, 요금제·용량, 카테고리 규칙, 통계, 저장공간 사용량으로 이동하는 시스템관리자 메뉴 허브입니다.
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
              <Link
                href="/admin"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                고객관리자
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SYSTEM_CONSOLE_LINKS.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-stone-950">
                  {item.label}
                </h2>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                    item.status,
                  )}`}
                >
                  {item.statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                {item.description}
              </p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-4 inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                >
                  화면 열기
                </Link>
              ) : item.apiPath ? (
                <code className="mt-4 block truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
                  {item.apiPath}
                </code>
              ) : (
                <span className="mt-4 inline-flex rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400">
                  준비중
                </span>
              )}
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">운영 정책 메모</h2>
            <ul className="mt-4 grid gap-3">
              {SYSTEM_CONSOLE_POLICY_NOTES.map((note) => (
                <li
                  key={note}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600"
                >
                  {note}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">스토리지 운영</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              기존 첨부파일 휴지통/삭제 운영 기능은 유지합니다.
            </p>
            <div className="mt-4">
              <SystemStoragePurgeButton />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
