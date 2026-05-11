import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_PRODUCT_TEMPLATE_POLICY,
  SYSTEM_PRODUCT_TEMPLATE_ROWS,
  SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS,
  type SystemProductTemplateRow,
  type SystemProductTemplateStatus,
} from "@/lib/system/standards/systemProductTemplateStandards";

const statusClassNames: Record<SystemProductTemplateStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  archived: "border-stone-200 bg-stone-50 text-stone-500",
};

function TemplateTreePreview({ template }: { template: SystemProductTemplateRow }) {
  const topLevelCount = template.tree.length;
  const secondLevelCount = template.tree.reduce((sum, top) => sum + top.children.length, 0);
  const thirdLevelCount = template.tree.reduce(
    (sum, top) => sum + top.children.reduce((childSum, second) => childSum + second.children.length, 0),
    0,
  );

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-stone-950">{template.name}</h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClassNames[template.status]}`}
            >
              {SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS[template.status]}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-600">{template.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-stone-600">
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">1차 {topLevelCount}개</span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">2차 {secondLevelCount}개</span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">3차 {thirdLevelCount}개</span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1">정렬 {template.sortOrder}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {template.tree.map((top) => (
          <div key={top.id} className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
            <p className="text-sm font-semibold text-stone-950">{top.name}</p>
            <div className="mt-3 grid gap-2">
              {top.children.map((second) => (
                <div key={second.id} className="rounded-xl border border-stone-200 bg-white p-3">
                  <p className="text-xs font-semibold text-stone-700">{second.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {second.children.map((leaf) => (
                      <span
                        key={leaf.id}
                        className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-600"
                        title={leaf.description}
                      >
                        {leaf.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SystemProductTemplateStandardsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                SYSTEM STANDARD TEMPLATE
              </p>
              <h1 className="text-2xl font-semibold text-stone-950">생산품 유형 기본 템플릿</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                신규 고객사 생성 시 복사할 생산품 유형 기본 템플릿을 설계하는 1차 화면입니다. 고객사별 생산품 유형은
                계속 고객관리자가 직접 관리하고, 시스템관리자는 초기값 템플릿만 관리합니다.
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
                <h2 className="text-lg font-semibold text-stone-950">시스템 생산품 유형 템플릿 원장</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  1차 → 2차 → 3차 계층 구조를 가진 기본 템플릿입니다. 실제 고객사 기준정보는 복사 후 고객사별로 분리됩니다.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-400"
                title="후속 버전에서 저장 기능을 연결합니다."
              >
                템플릿 추가 준비중
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {SYSTEM_PRODUCT_TEMPLATE_ROWS.map((template) => (
                <TemplateTreePreview key={template.id} template={template} />
              ))}
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">1차 연결 범위</h2>
              <ul className="mt-4 grid gap-3">
                {SYSTEM_PRODUCT_TEMPLATE_POLICY.map((note) => (
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
                다음 단계에서 템플릿 DB 원장과 신규 고객사 생성 시 복사 흐름을 분리합니다. 이번 화면은 저장 기능이 없는
                1차 관리 화면입니다.
              </p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
