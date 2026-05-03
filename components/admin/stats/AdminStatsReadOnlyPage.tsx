"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import type {
  CountMetric,
  RatioMetric,
  SeriesMetricPoint,
  StatsSummary,
} from "@/lib/stats/statsTypes";

interface AdminStatsApiSuccess {
  ok: true;
  summary: StatsSummary;
}

interface AdminStatsApiError {
  ok: false;
  error: string;
  message?: string;
}

type AdminStatsApiResponse = AdminStatsApiSuccess | AdminStatsApiError;

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

function getBarWidth(value: number, maxValue: number): string {
  if (maxValue <= 0) {
    return "0%";
  }

  return `${Math.round((value / maxValue) * 100)}%`;
}

function MetricCard({ metric }: { metric: CountMetric }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{metric.label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
        {formatMetricValue(metric)}
      </p>
      <code className="mt-2 block truncate text-xs text-stone-500">
        {metric.key}
      </code>
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
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-stone-900"
          style={{ width: formatRatio(metric.ratio) }}
        />
      </div>
    </article>
  );
}

function MetricList({ metrics }: { metrics: CountMetric[] }) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
        표시할 count metric이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className="grid gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm lg:grid-cols-[1fr_auto]"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-stone-950">{metric.label}</p>
            <code className="mt-1 block truncate text-xs text-stone-500">
              {metric.key}
            </code>
          </div>
          <p className="font-semibold text-stone-950">
            {formatMetricValue(metric)}
          </p>
        </div>
      ))}
    </div>
  );
}

function SeriesList({ series }: { series: SeriesMetricPoint[] }) {
  const maxValue = Math.max(1, ...series.map((point) => point.value));

  if (series.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
        표시할 series metric이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {series.map((point) => (
        <div
          key={point.key}
          className="grid gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-stone-600">{point.label}</span>
            <span className="font-semibold text-stone-950">
              {formatNumber(point.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-stone-900"
              style={{ width: getBarWidth(point.value, maxValue) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminStatsReadOnlyPage() {
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [appliedCompanyId, setAppliedCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [message, setMessage] = useState("고객관리자 통계 상세를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadAdminStats() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/admin/stats?companyId=${encodeURIComponent(appliedCompanyId)}`,
          {
            method: "GET",
          },
        );
        const data = (await response.json()) as AdminStatsApiResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setSummary(null);
          setMessage(data.ok ? "고객관리자 통계 상세를 불러오지 못했습니다." : data.message || data.error);
          return;
        }

        setSummary(data.summary);
        setMessage("DB 기준 고객관리자 통계 상세를 불러왔습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setSummary(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "고객관리자 통계 상세를 불러오지 못했습니다.",
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
  }, [appliedCompanyId]);

  function handleApplyCompanyId() {
    const normalized = companyId.trim();
    setAppliedCompanyId(normalized || DEFAULT_COMPANY_ID);
  }

  const primaryMetrics = useMemo(
    () =>
      summary?.counts.filter((metric) =>
        [
          "workorders.total",
          "attachments.count",
          "storage.used_bytes",
        ].includes(metric.key),
      ) ?? [],
    [summary],
  );

  const statusMetrics = useMemo(
    () =>
      summary?.counts.filter((metric) =>
        metric.key.startsWith("workorders.status."),
      ) ?? [],
    [summary],
  );

  const otherCounts = useMemo(
    () =>
      summary?.counts.filter(
        (metric) =>
          !primaryMetrics.some((primary) => primary.key === metric.key) &&
          !statusMetrics.some((statusMetric) => statusMetric.key === metric.key),
      ) ?? [],
    [primaryMetrics, statusMetrics, summary],
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                ADMIN STATS
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                고객관리자 통계 상세
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                고객사 기준 작업지시서, 첨부파일, 저장공간, 완료율, 상태별 수, series를 read-only로 확인하는 상세 화면입니다.
                통계 계산식과 DB schema는 변경하지 않습니다.
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
                고객관리자 홈
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
          <div className="grid gap-4 lg:grid-cols-[1fr_320px_auto] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">연결 상태</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
              {summary ? (
                <p className="mt-1 text-xs text-stone-500">
                  scope: {summary.scope} / period: {summary.period.from} ~ {summary.period.to} / generatedAt: {summary.generatedAt}
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
            <button
              type="button"
              onClick={handleApplyCompanyId}
              className="rounded-xl border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              조회
            </button>
          </div>
          <code className="mt-4 block rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
            GET /api/admin/stats?companyId={appliedCompanyId}
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

            <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-950">
                  상태별 작업지시서
                </h2>
                <div className="mt-4">
                  <MetricList metrics={statusMetrics} />
                </div>
              </article>

              <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-950">
                  월별 series
                </h2>
                <div className="mt-4">
                  <SeriesList series={summary.series} />
                </div>
              </article>
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">
                기타 count metric
              </h2>
              <div className="mt-4">
                <MetricList metrics={otherCounts} />
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {isLoading
              ? "고객관리자 통계 상세를 불러오는 중입니다."
              : "고객관리자 통계 상세를 표시할 수 없습니다."}
          </div>
        )}
      </div>
    </main>
  );
}
