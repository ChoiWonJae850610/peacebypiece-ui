import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  ADMIN_CONSOLE_API_LINKS,
  ADMIN_CONSOLE_POLICY_NOTES,
  ADMIN_CONSOLE_PRIMARY_LINKS,
  ADMIN_CONSOLE_SECONDARY_LINKS,
  type AdminConsoleLinkItem,
  type AdminConsoleLinkStatus,
} from "@/lib/admin/adminConsoleLinks";

function getStatusClassName(status: AdminConsoleLinkStatus) {
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

function AdminConsoleCard({ item }: { item: AdminConsoleLinkItem }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-950">{item.label}</h2>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
            item.status,
          )}`}
        >
          {item.statusLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{item.description}</p>
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
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                ADMIN CONSOLE
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                고객관리자 콘솔
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                작업지시서, 거래처/공장관리, 멤버 초대, 저장소, 히스토리, 환경설정으로 이동하는 고객관리자 메뉴 허브입니다.
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
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템관리자
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          {ADMIN_CONSOLE_PRIMARY_LINKS.map((item) => (
            <AdminConsoleCard key={item.id} item={item} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">운영 메뉴</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {ADMIN_CONSOLE_SECONDARY_LINKS.map((item) => (
                <AdminConsoleCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">API 확인 경로</h2>
            <div className="mt-4 grid gap-3">
              {ADMIN_CONSOLE_API_LINKS.map((item) => (
                <AdminConsoleCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">운영 정책 메모</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-4">
            {ADMIN_CONSOLE_POLICY_NOTES.map((note) => (
              <li
                key={note}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-600"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
