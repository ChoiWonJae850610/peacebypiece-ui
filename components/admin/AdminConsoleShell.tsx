"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import {
  ADMIN_CONSOLE_LINKS,
  ADMIN_CONSOLE_POLICY_NOTES,
} from "@/lib/admin/adminConsoleShell";
import type { CountMetric, RatioMetric, StatsSummary } from "@/lib/stats/statsTypes";

interface AdminStatsSuccess {
  ok: true;
  summary: StatsSummary;
}

interface AdminStatsError {
  ok: false;
  error: string;
  message?: string;
}

type AdminStatsResponse = AdminStatsSuccess | AdminStatsError;

const DEFAULT_COMPANY_ID = "company-sample-customer";

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) {
    return "0B";
  }

  const gb = bytes / 1024 / 1024 / 1024;
  if (gb >= 1) {
    return `${gb.toFixed(1)}GB`;
  }

  const mb = bytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(1)}MB`;
  }

  const kb = bytes / 1024;
  if (kb >= 1) {
    return `${kb.toFixed(1)}KB`;
  }

  return `${bytes}B`;
}

function formatMetricValue(metric: CountMetric): string {
  if (metric.key.includes("storage.used_bytes")) {
    return formatBytes(metric.value);
  }

  return formatNumber(metric.value);
}

function formatRatio(ratio: number): string {
  if (!Number.isFinite(ratio)) {
    return "0%";
  }

  return `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
}

function getStatusClassName(status: string): string {
  if (status === "current" || status === "linked") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "api") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "readonly") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

function getPrimaryMetric(summary: StatsSummary | null, key: string): CountMetric | null {
  return summary?.counts.find((metric) => metric.key === key) ?? null;
}

function MetricCard({ metric }: { metric: CountMetric }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{metric.label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
        {formatMetricValue(metric)}
      </p>
      <p className="mt-2 text-xs text-stone-500">{metric.key}</p>
    </article>
  );
}

function RatioCard({ metric }: { metric: RatioMetric }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{metric.label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
        {formatRatio(metric.ratio)}
      </p>
      <p className="mt-2 text-xs text-stone-500">
        {formatNumber(metric.numerator)} / {formatNumber(metric.denominator)}
      </p>
    </article>
  );
}

export default function AdminConsoleShell() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [message, setMessage] = useState("고객관리자 통계를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStats() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/admin/stats?companyId=${encodeURIComponent(companyId)}`,
          { method: "GET" },
        );
        const data = (await response.json()) as AdminStatsResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setSummary(null);
          setMessage(data.ok ? "고객관리자 통계를 불러오지 못했습니다." : data.message || data.error);
          return;
        }

        setSummary(data.summary);
        setMessage("DB 기준 고객관리자 통계를 불러왔습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setSummary(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "고객관리자 통계를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAdminStats();

    return () => {
      mounted = false;
    };
  }, [companyId]);

  const primaryMetrics = useMemo(() => {
    const keys = [
      "workorders.total",
      "attachments.count",
      "storage.used_bytes",
    ];

    return keys
      .map((key) => getPrimaryMetric(summary, key))
      .filter((metric): metric is CountMetric => metric !== null);
  }, [summary]);

  const statusMetrics = useMemo(
    () =>
      summary?.counts.filter((metric) =>
        metric.key.startsWith("workorders.status."),
      ) ?? [],
    [summary],
  );

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
                작업지시서, 첨부파일, 저장공간 사용량, 완료율을 read-only로 확인하는 고객관리자 홈입니다.
                저장 action, 통계 chart library, DB schema 변경은 이번 버전에서 연결하지 않습니다.
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
                시스템관리자
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

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                고객관리자 통계 연결 상태
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
              {summary ? (
                <p className="mt-1 text-xs text-stone-500">
                  period: {summary.period.from} ~ {summary.period.to} / generatedAt: {summary.generatedAt}
                </p>
              ) : null}
            </div>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              companyId
              <input
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
          </div>
          <code className="mt-4 block rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
            GET /api/admin/stats?companyId={companyId}
          </code>
        </section>

        {summary ? (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              {primaryMetrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </section>

            <section className="grid gap-3 md:grid-cols-2">
              {summary.ratios.map((metric) => (
                <RatioCard key={metric.key} metric={metric} />
              ))}
            </section>

            {statusMetrics.length > 0 ? (
              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-950">상태별 작업지시서</h2>
                <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {statusMetrics.map((metric) => (
                    <div
                      key={metric.key}
                      className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    >
                      <span className="truncate text-stone-600">{metric.label}</span>
                      <span className="font-semibold text-stone-950">
                        {formatNumber(metric.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">월별 작업지시서 series</h2>
              <div className="mt-4 grid gap-2">
                {summary.series.map((point) => (
                  <div
                    key={point.key}
                    className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  >
                    <span className="truncate text-stone-600">{point.label}</span>
                    <span className="font-semibold text-stone-950">
                      {formatNumber(point.value)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {isLoading
              ? "고객관리자 통계를 불러오는 중입니다."
              : "고객관리자 통계를 표시할 수 없습니다."}
          </div>
        )}

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">고객관리자 메뉴</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ADMIN_CONSOLE_LINKS.map((item) => {
              const href = item.href ?? item.apiPath ?? "#";
              const isApi = href.startsWith("/api/");

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-stone-950">{item.label}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                        item.status,
                      )}`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-stone-600">
                    {item.description}
                  </p>
                  {isApi ? (
                    <code className="mt-3 block truncate rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-500">
                      {href}
                    </code>
                  ) : (
                    <Link
                      href={href}
                      className="mt-3 inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                    >
                      화면 열기
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">운영 기준</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-3">
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
