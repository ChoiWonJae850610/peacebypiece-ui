import Link from "next/link";

import AdminWorkOrderHistoryPage from "@/components/admin/history/AdminWorkOrderHistoryPage";
import { APP_VERSION } from "@/lib/constants/app";
import { listAdminHistoryEvents } from "@/lib/admin/history/repository";

export default async function AdminHistoryReadOnlyPage() {
  const historyEvents = await listAdminHistoryEvents();

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                ADMIN HISTORY
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                히스토리
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                작업지시서, 첨부파일, 거래처/공장관리 관련 변경 이력을 read-only로 확인하는 관리자 히스토리 화면입니다.
                이 화면은 이력 조회와 필터만 제공하며, write action은 포함하지 않습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/admin"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                관리자 홈
              </Link>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-950">
                DB history log snapshot
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                현재 표시 대상 이력 {historyEvents.length}개를 서버에서 조회했습니다.
                DB가 설정되지 않았거나 이력이 없으면 빈 목록으로 표시됩니다.
              </p>
            </div>
            <code className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
              listAdminHistoryEvents()
            </code>
          </div>
        </section>

        <AdminWorkOrderHistoryPage initialHistoryEvents={historyEvents} />
      </div>
    </main>
  );
}
