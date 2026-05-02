"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";

interface StorageUsageSummary {
  companyId: string;
  usedBytes: number;
  attachmentCount: number;
  measuredAt: string;
  source: string;
  note: string;
}

interface StorageUsageApiSuccess {
  ok: true;
  summary: StorageUsageSummary;
}

interface StorageUsageApiError {
  ok: false;
  error: string;
  message?: string;
}

type StorageUsageApiResponse = StorageUsageApiSuccess | StorageUsageApiError;

const DEFAULT_COMPANY_ID = "company-sample-customer";

function formatBytes(bytes?: number | null): string {
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

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-xs leading-5 text-stone-500">{description}</p>
      ) : null}
    </article>
  );
}

export default function SystemStorageUsageReadOnlyPage() {
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [appliedCompanyId, setAppliedCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [summary, setSummary] = useState<StorageUsageSummary | null>(null);
  const [message, setMessage] = useState("저장공간 사용량을 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadStorageUsage() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/system/storage-usage?companyId=${encodeURIComponent(appliedCompanyId)}`,
          {
            method: "GET",
          },
        );
        const data = (await response.json()) as StorageUsageApiResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setSummary(null);
          setMessage(data.ok ? "저장공간 사용량을 불러오지 못했습니다." : data.message || data.error);
          return;
        }

        setSummary(data.summary);
        setMessage("DB metadata 기준 저장공간 사용량 summary를 불러왔습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setSummary(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "저장공간 사용량을 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadStorageUsage();

    return () => {
      mounted = false;
    };
  }, [appliedCompanyId]);

  function handleApplyCompanyId() {
    const normalized = companyId.trim();
    setAppliedCompanyId(normalized || DEFAULT_COMPANY_ID);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM STORAGE USAGE
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                저장공간 사용량
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                고객사별 저장공간 사용량과 첨부파일 수를 read-only로 확인하는 시스템관리자 화면입니다.
                R2 실시간 inventory 조회와 snapshot 생성 action은 이번 버전에서 연결하지 않습니다.
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

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px_auto] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">연결 상태</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
              <code className="mt-3 block rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
                GET /api/system/storage-usage?companyId={appliedCompanyId}
              </code>
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
        </section>

        {summary ? (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryCard label="고객사 ID" value={summary.companyId} />
              <SummaryCard label="사용량" value={formatBytes(summary.usedBytes)} />
              <SummaryCard label="첨부파일" value={`${summary.attachmentCount}개`} />
              <SummaryCard
                label="측정 시각"
                value={formatDateTime(summary.measuredAt)}
                description={summary.source}
              />
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">측정 메모</h2>
              <p className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
                {summary.note}
              </p>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {isLoading
              ? "저장공간 사용량을 불러오는 중입니다."
              : "저장공간 사용량을 표시할 수 없습니다."}
          </div>
        )}
      </div>
    </main>
  );
}
