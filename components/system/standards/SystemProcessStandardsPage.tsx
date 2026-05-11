import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_PROCESS_STANDARD_POLICY,
  SYSTEM_PROCESS_STANDARD_ROWS,
  SYSTEM_PROCESS_STANDARD_STATUS_LABELS,
  type SystemProcessStandardStatus,
} from "@/lib/system/standards/systemProcessStandards";

const statusClassNames: Record<SystemProcessStandardStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-stone-200 bg-stone-50 text-stone-500",
  review: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function SystemProcessStandardsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                SYSTEM STANDARD MASTER
              </p>
              <h1 className="text-2xl font-semibold text-stone-950">외주공정 유형 관리</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                고객사가 공통으로 선택할 수 있는 외주공정 유형 원장을 관리하는 1차 화면입니다. 이번 단계에서는 화면 구조와
                관리 필드만 확정하고, 실제 추가·수정·삭제 저장은 후속 버전에서 연결합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system/standards"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                기준정보 설계
              </Link>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템 콘솔
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">시스템 외주공정 유형 원장</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  공정명, 분류, 설명, 사용 예시, 활성 상태, 정렬 순서를 기준 필드로 사용합니다.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-400"
                title="후속 버전에서 저장 기능을 연결합니다."
              >
                공정 추가 준비중
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
              <div className="grid grid-cols-[0.7fr_0.7fr_1.2fr_0.8fr_0.45fr_0.5fr] gap-3 border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                <span>공정명</span>
                <span>분류</span>
                <span>설명</span>
                <span>사용 예시</span>
                <span className="text-right">정렬</span>
                <span className="text-right">상태</span>
              </div>
              <div className="divide-y divide-stone-100 bg-white">
                {SYSTEM_PROCESS_STANDARD_ROWS.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[0.7fr_0.7fr_1.2fr_0.8fr_0.45fr_0.5fr] gap-3 px-4 py-3 text-sm text-stone-700"
                  >
                    <span className="font-semibold text-stone-950">{row.name}</span>
                    <span className="text-xs font-semibold text-stone-600">{row.category}</span>
                    <span className="text-xs leading-5 text-stone-600">{row.description}</span>
                    <span className="text-xs text-stone-500">{row.example}</span>
                    <span className="text-right text-xs text-stone-500">{row.sortOrder}</span>
                    <span
                      className={`justify-self-end rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClassNames[row.status]}`}
                    >
                      {SYSTEM_PROCESS_STANDARD_STATUS_LABELS[row.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">1차 연결 범위</h2>
              <ul className="mt-4 grid gap-3">
                {SYSTEM_PROCESS_STANDARD_POLICY.map((note) => (
                  <li
                    key={note}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800 shadow-sm">
              <h2 className="font-semibold text-amber-900">후속 구현 메모</h2>
              <p className="mt-2">
                다음 단계에서 DB 원장, 고객사별 사용 여부, 감사 로그 기록을 분리해 연결합니다. 이번 화면은 저장 기능이 없는
                1차 관리 화면입니다.
              </p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
