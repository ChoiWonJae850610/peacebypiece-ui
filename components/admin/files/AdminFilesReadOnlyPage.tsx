"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import type {
  AdminFileManagementSnapshot,
  AdminFileTrendPeriod,
  AdminManagedFileItem,
  AdminTrashFileItem,
} from "@/lib/admin/files/types";

interface AdminFileSnapshotSuccess {
  ok: true;
  snapshot: AdminFileManagementSnapshot;
}

interface AdminFileSnapshotError {
  ok: false;
  error: string;
  message?: string;
  snapshot: AdminFileManagementSnapshot;
}

type AdminFileSnapshotResponse =
  | AdminFileSnapshotSuccess
  | AdminFileSnapshotError;

const TREND_PERIODS: AdminFileTrendPeriod[] = [7, 15, 30];

function formatDate(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function getUsageToneClassName(
  tone: AdminFileManagementSnapshot["usageSummary"]["statusTone"],
) {
  if (tone === "danger") {
    return "bg-red-100 text-red-700";
  }

  if (tone === "caution") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-emerald-100 text-emerald-700";
}

function getPurgeToneClassName(item: AdminTrashFileItem) {
  if (item.isPurgeReady) {
    return "bg-red-100 text-red-700";
  }

  if (item.purgeStatus === "failed") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-stone-100 text-stone-600";
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
      {label}
    </div>
  );
}

function UsageCards({ snapshot }: { snapshot: AdminFileManagementSnapshot }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {snapshot.usageCards.map((card) => (
        <article
          key={card.label}
          className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold text-stone-500">{card.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
            {card.value}
          </p>
          <p className="mt-2 text-xs leading-5 text-stone-500">
            {card.description || "DB snapshot 기준"}
          </p>
        </article>
      ))}
    </section>
  );
}

function StorageSummary({ snapshot }: { snapshot: AdminFileManagementSnapshot }) {
  const usageSummary = snapshot.usageSummary;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">
            저장소 사용 현황
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            첨부파일 metadata와 회사 파일 정책 기준의 read-only 요약입니다.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getUsageToneClassName(
            usageSummary.statusTone,
          )}`}
        >
          {usageSummary.statusLabel}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-stone-500">
          <span>{usageSummary.usedLabel}</span>
          <span>{usageSummary.limitLabel}</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-stone-900"
            style={{ width: formatPercent(usageSummary.usagePercent) }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-500">
          사용률 {formatPercent(usageSummary.usagePercent)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {snapshot.storagePolicies.map((policy) => (
          <article
            key={policy.label}
            className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
          >
            <p className="text-xs font-medium text-stone-500">{policy.label}</p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {policy.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              {policy.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AttachmentTable({ items }: { items: AdminManagedFileItem[] }) {
  if (items.length === 0) {
    return <EmptyRow label="표시할 첨부파일이 없습니다." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="hidden grid-cols-[1.1fr_1.25fr_0.65fr_0.6fr_0.72fr] gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500 lg:grid">
        <span>작업지시서</span>
        <span>파일명</span>
        <span>유형</span>
        <span>용량</span>
        <span>등록일</span>
      </div>
      <div className="divide-y divide-stone-100">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.1fr_1.25fr_0.65fr_0.6fr_0.72fr] lg:items-center"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400 lg:hidden">
                작업지시서
              </p>
              <p className="truncate font-semibold text-stone-950">
                {item.workorderTitle}
              </p>
              <p className="mt-1 truncate text-xs text-stone-500">
                {item.uploadedBy || "등록자 없음"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400 lg:hidden">
                파일명
              </p>
              <p className="truncate text-stone-700">{item.fileName}</p>
            </div>
            <p className="text-stone-600">{item.fileType || item.fileIcon}</p>
            <p className="text-stone-600">{item.fileSizeLabel}</p>
            <p className="text-stone-600">{formatDate(item.uploadedAt)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function TrashTable({ items }: { items: AdminTrashFileItem[] }) {
  if (items.length === 0) {
    return <EmptyRow label="휴지통에 보관 중인 파일이 없습니다." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="hidden grid-cols-[1.05fr_1.2fr_0.62fr_0.7fr_0.75fr_0.75fr] gap-3 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500 lg:grid">
        <span>작업지시서</span>
        <span>파일명</span>
        <span>용량</span>
        <span>삭제일</span>
        <span>보관</span>
        <span>상태</span>
      </div>
      <div className="divide-y divide-stone-100">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.05fr_1.2fr_0.62fr_0.7fr_0.75fr_0.75fr] lg:items-center"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400 lg:hidden">
                작업지시서
              </p>
              <p className="truncate font-semibold text-stone-950">
                {item.workorderTitle}
              </p>
              <p className="mt-1 truncate text-xs text-stone-500">
                {item.deletedBy || "삭제자 없음"}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-400 lg:hidden">
                파일명
              </p>
              <p className="truncate text-stone-700">{item.fileName}</p>
              <p className="mt-1 truncate text-xs text-stone-500">
                {item.deleteReason || "삭제 사유 없음"}
              </p>
            </div>
            <p className="text-stone-600">{item.fileSizeLabel}</p>
            <p className="text-stone-600">{formatDate(item.deletedAt)}</p>
            <p className="text-stone-600">{item.restoreLabel}</p>
            <span
              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getPurgeToneClassName(
                item,
              )}`}
            >
              {item.purgeStatusLabel}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}

function TrendSection({ snapshot }: { snapshot: AdminFileManagementSnapshot }) {
  const maxTrendValue = Math.max(
    1,
    ...snapshot.recentUploadTrend.map((point) => point.value),
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">
          최근 업로드 추이
        </h2>
        <div className="mt-5 grid gap-2">
          {snapshot.recentUploadTrend.map((point) => (
            <div
              key={point.label}
              className="grid grid-cols-[72px_1fr_44px] items-center gap-3"
            >
              <span className="text-xs text-stone-500">{point.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-stone-900"
                  style={{
                    width: `${Math.round((point.value / maxTrendValue) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-right text-xs font-semibold text-stone-700">
                {point.value}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">파일 유형</h2>
        <div className="mt-5 space-y-3">
          {snapshot.fileTypeDistribution.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-sm text-stone-600">{item.label}</span>
              <span className="text-sm font-semibold text-stone-950">
                {item.value}개 / {item.percent}%
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default function AdminFilesReadOnlyPage() {
  const [snapshot, setSnapshot] = useState<AdminFileManagementSnapshot | null>(
    null,
  );
  const [trendPeriod, setTrendPeriod] = useState<AdminFileTrendPeriod>(7);
  const [message, setMessage] = useState("파일 관리 데이터를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSnapshot() {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/admin/files/snapshot?period=${trendPeriod}`,
          {
            method: "GET",
          },
        );
        const data = (await response.json()) as AdminFileSnapshotResponse;

        if (!mounted) {
          return;
        }

        setSnapshot(data.snapshot);
        setMessage(
          data.ok
            ? "DB 기준 파일 관리 snapshot을 불러왔습니다."
            : data.message || data.error,
        );
      } catch (error) {
        if (!mounted) {
          return;
        }

        setSnapshot(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "파일 관리 데이터를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadSnapshot();

    return () => {
      mounted = false;
    };
  }, [trendPeriod]);

  const activeItems = useMemo(
    () => snapshot?.attachments ?? [],
    [snapshot?.attachments],
  );
  const trashItems = useMemo(
    () => snapshot?.trashItems ?? [],
    [snapshot?.trashItems],
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                ADMIN FILES
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                저장소 관리
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                첨부파일 목록, 휴지통, 저장공간 사용량을 read-only로 확인하는 관리자 파일 관리 화면입니다.
                업로드, 삭제, 복구, R2 실제 삭제 흐름은 이번 버전에서 변경하지 않습니다.
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

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                snapshot 연결 상태
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {message}
              </p>
              {snapshot ? (
                <p className="mt-1 text-xs text-stone-500">
                  dataSource: {snapshot.dataSourceLabel}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {TREND_PERIODS.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setTrendPeriod(period)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    trendPeriod === period
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {period}일
                </button>
              ))}
            </div>
          </div>
        </section>

        {snapshot ? (
          <>
            <UsageCards snapshot={snapshot} />
            <StorageSummary snapshot={snapshot} />

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">
                    첨부파일 목록
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    작업지시서에 연결된 사용중 파일을 read-only로 표시합니다.
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {activeItems.length}개
                </span>
              </div>
              <AttachmentTable items={activeItems} />
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">
                    휴지통
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    삭제 요청된 파일의 보관 상태를 read-only로 표시합니다.
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {trashItems.length}개
                </span>
              </div>
              <TrashTable items={trashItems} />
            </section>

            <TrendSection snapshot={snapshot} />
          </>
        ) : (
          <EmptyRow
            label={
              isLoading
                ? "파일 관리 데이터를 불러오는 중입니다."
                : "파일 관리 데이터를 표시할 수 없습니다."
            }
          />
        )}
      </div>
    </main>
  );
}
