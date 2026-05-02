import Link from "next/link";

import CategoryRulesManager from "@/app/system/category-rules/CategoryRulesManager";
import { APP_VERSION } from "@/lib/constants/app";
import { getCategoryRulesManagerText } from "@/lib/system/categoryRuleText";

export default function SystemCategoryRulesPage() {
  const text = getCategoryRulesManagerText();

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM CATEGORY RULES
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                카테고리 규칙
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                작업지시서 제목 기반 카테고리 추천 규칙을 관리하는 시스템관리자 화면입니다.
                이 화면은 기존 CategoryRulesManager를 다시 연결하며, 저장은 기존 local persistence 흐름을 유지합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템관리자 홈
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

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-950">
            복원 범위
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            0.9.103에서는 회귀 점검 화면을 제거하고 기존 카테고리 규칙 관리 UI를 재연결했습니다.
            DB schema, 추천 알고리즘, 저장소 구조는 변경하지 않았습니다.
          </p>
        </section>

        <CategoryRulesManager text={text} />
      </div>
    </main>
  );
}
