import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_REGRESSION_POLICY_NOTES,
  SYSTEM_REGRESSION_ROUTES,
  type SystemRegressionRouteItem,
  type SystemRegressionRouteStatus,
} from "@/lib/system/systemRegressionRoutes";

interface SystemRegressionRoutePageProps {
  title: string;
  eyebrow: string;
  description: string;
  currentRouteId?: string;
}

function getStatusClassName(status: SystemRegressionRouteStatus) {
  if (status === "stable") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "api") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "needs_component_restore") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

function SystemRouteCard({ route }: { route: SystemRegressionRouteItem }) {
  const isApi = route.href.startsWith("/api/");

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-950">{route.label}</h2>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
            route.status,
          )}`}
        >
          {route.statusLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        {route.description}
      </p>
      {isApi ? (
        <code className="mt-4 block truncate rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
          {route.href}
        </code>
      ) : (
        <Link
          href={route.href}
          className="mt-4 inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
        >
          화면 열기
        </Link>
      )}
      <p className="mt-3 text-xs leading-5 text-stone-500">
        {route.nextAction}
      </p>
    </article>
  );
}

export default function SystemRegressionRoutePage({
  title,
  eyebrow,
  description,
  currentRouteId,
}: SystemRegressionRoutePageProps) {
  const currentRoute = SYSTEM_REGRESSION_ROUTES.find(
    (route) => route.id === currentRouteId,
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                {description}
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

        {currentRoute ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-semibold text-amber-700">
              현재 route 점검 상태
            </p>
            <h2 className="mt-2 text-lg font-semibold text-amber-950">
              {currentRoute.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              {currentRoute.nextAction}
            </p>
            {currentRoute.apiPath ? (
              <code className="mt-3 block truncate rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-amber-800">
                {currentRoute.apiPath}
              </code>
            ) : null}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SYSTEM_REGRESSION_ROUTES.map((route) => (
            <SystemRouteCard key={route.id} route={route} />
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">회귀 점검 기준</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_REGRESSION_POLICY_NOTES.map((note) => (
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
