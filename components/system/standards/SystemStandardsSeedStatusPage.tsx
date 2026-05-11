import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import type { SystemStandardsSeedStatus } from "@/lib/system/standards/seedStatusRepository";

function statusClassName(ready: boolean) {
  return ready
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

export default function SystemStandardsSeedStatusPage({ seedStatus }: { seedStatus: SystemStandardsSeedStatus }) {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">SYSTEM STANDARDS SEED</p>
              <h1 className="text-2xl font-semibold text-stone-950">기준정보 seed 상태</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                기준정보 화면은 0.10.46부터 DB 결과만 사용합니다. 이 화면에서 단위 표준, 외주공정 유형, 생산품 유형 기본 템플릿의 seed 적용 상태를 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">v{APP_VERSION}</span>
              <Link href="/system/standards" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50">기준정보 관리</Link>
              <Link href="/system" className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50">시스템 콘솔</Link>
            </div>
          </div>
        </header>

        <section className={`rounded-3xl border p-5 shadow-sm ${statusClassName(seedStatus.ready)}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{seedStatus.mode === "db" ? "DB MODE" : "DB UNAVAILABLE"}</p>
          <h2 className="mt-2 text-lg font-semibold">{seedStatus.ready ? "seed 준비 완료" : "seed 확인 필요"}</h2>
          <p className="mt-2 text-sm leading-6">{seedStatus.message}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {seedStatus.items.map((item) => (
            <article key={item.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-stone-500">{item.tableName}</p>
                  <h2 className="mt-2 text-lg font-semibold text-stone-950">{item.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName(item.ready)}`}>{item.ready ? "준비됨" : "비어 있음"}</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-500">전체 항목</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-950">{item.count}개</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-xs font-semibold text-stone-500">활성 항목</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-950">{item.activeCount}개</p>
                  <p className="mt-1 text-[11px] font-medium text-stone-500">최소 기준 {item.minimumActiveCount}개</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
          <h2 className="text-base font-semibold text-amber-950">seed가 비어 있거나 최소 기준보다 부족할 때</h2>
          <ul className="mt-3 space-y-2">
            <li>· 기존 개발 DB를 유지하려면 db/schema/patch_0_10_48_system_standards_seed_refresh.sql을 실행합니다.</li>
            <li>· 개발 DB를 리셋할 수 있으면 db/schema/full_reset.sql 실행 후 full_reset_smoke_test.sql을 실행합니다.</li>
            <li>· 0.10.46부터 fallback은 기준정보 숫자와 선택지에 섞지 않습니다. seed가 부족하면 고객관리자 환경설정과 작업지시서 선택지는 빈 상태 또는 부족한 상태로 보입니다.</li>
          </ul>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 font-mono text-xs text-amber-950">
            db/schema/patch_0_10_48_system_standards_seed_refresh.sql
          </div>
        </section>
      </div>
    </main>
  );
}
