import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_ACCESS_CHECKPOINT_GROUPS,
  SYSTEM_ACCESS_CHECKPOINT_NEXT_ACTIONS,
  SYSTEM_ACCESS_CHECKPOINT_SUMMARY,
  type SystemAccessCheckpointStatus,
} from "@/lib/system/systemAccessStabilityCheckpoint";

function getStatusClassName(status: SystemAccessCheckpointStatus) {
  if (status === "stable") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "ready") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

export default function SystemAccessStabilityCheckpoint() {
  const totalCount = SYSTEM_ACCESS_CHECKPOINT_GROUPS.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const stableCount = SYSTEM_ACCESS_CHECKPOINT_GROUPS.reduce(
    (sum, group) =>
      sum + group.items.filter((item) => item.status === "stable").length,
    0,
  );
  const partialCount = SYSTEM_ACCESS_CHECKPOINT_GROUPS.reduce(
    (sum, group) =>
      sum + group.items.filter((item) => item.status === "partial").length,
    0,
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM ACCESS CHECKPOINT
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  {SYSTEM_ACCESS_CHECKPOINT_SUMMARY.title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  {SYSTEM_ACCESS_CHECKPOINT_SUMMARY.description}
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
                시스템 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">점검 범위</p>
            <p className="mt-3 text-xl font-semibold text-stone-950">
              {SYSTEM_ACCESS_CHECKPOINT_SUMMARY.versionRange}
            </p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">점검 항목</p>
            <p className="mt-3 text-xl font-semibold text-stone-950">
              {totalCount}개
            </p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">화면 안정</p>
            <p className="mt-3 text-xl font-semibold text-stone-950">
              {stableCount}개
            </p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">실제 연결 대기</p>
            <p className="mt-3 text-xl font-semibold text-stone-950">
              {partialCount}개
            </p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {SYSTEM_ACCESS_CHECKPOINT_GROUPS.map((group) => (
            <article
              key={group.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="border-b border-stone-100 pb-4">
                <h2 className="text-lg font-semibold text-stone-950">
                  {group.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {group.description}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-stone-600">
                          {item.description}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                          item.status,
                        )}`}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-stone-500">
                      <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1">
                        owner: {item.owner}
                      </span>
                      {item.route ? (
                        <Link
                          href={item.route}
                          className="rounded-full border border-stone-200 bg-white px-2.5 py-1 underline underline-offset-4 hover:bg-stone-100"
                        >
                          {item.route}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">
              다음 실제 연결 후보
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              0.10.70은 안정화 체크포인트이므로 신규 저장 동작을 만들지 않고, 다음 실제 연결 범위를 분리합니다.
            </p>
          </div>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {SYSTEM_ACCESS_CHECKPOINT_NEXT_ACTIONS.map((action, index) => (
              <li
                key={action}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
              >
                <span className="mr-2 font-semibold text-stone-950">
                  {index + 1}.
                </span>
                {action}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
