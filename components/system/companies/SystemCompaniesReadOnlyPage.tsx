"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import type { CompanySummary } from "@/lib/company/companyTypes";

interface CompaniesApiSuccess {
  ok: true;
  companies: CompanySummary[];
}

interface CompaniesApiError {
  ok: false;
  error: string;
  message?: string;
}

type CompaniesApiResponse = CompaniesApiSuccess | CompaniesApiError;

type StatusFilter = "all" | "active" | "inactive";

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

function getUsagePercent(company: CompanySummary): number {
  const used = company.storageUsedBytes ?? 0;
  const limit = company.storageLimitBytes ?? 0;

  if (limit <= 0) {
    return 0;
  }

  return Math.round(Math.max(0, Math.min(1, used / limit)) * 100);
}

function getStatusClassName(status: CompanySummary["status"]) {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-stone-200 text-stone-600";
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

function CompanyCard({ company }: { company: CompanySummary }) {
  const usagePercent = getUsagePercent(company);

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-stone-950">
            {company.name}
          </h2>
          <p className="mt-1 truncate text-xs text-stone-500">{company.id}</p>
        </div>
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(
            company.status,
          )}`}
        >
          {company.status === "active" ? "활성" : "비활성"}
        </span>
      </div>

      {company.memo ? (
        <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-600">
          {company.memo}
        </p>
      ) : null}

      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-stone-500">멤버</dt>
          <dd className="mt-1 text-sm font-semibold text-stone-950">
            {company.memberCount}명
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">저장공간</dt>
          <dd className="mt-1 text-sm font-semibold text-stone-950">
            {formatBytes(company.storageUsedBytes)} / {formatBytes(company.storageLimitBytes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">생성일</dt>
          <dd className="mt-1 text-sm font-semibold text-stone-950">
            {formatDate(company.createdAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">수정일</dt>
          <dd className="mt-1 text-sm font-semibold text-stone-950">
            {formatDate(company.updatedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-stone-500">
          <span>저장공간 사용률</span>
          <span>{usagePercent}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-stone-900"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export default function SystemCompaniesReadOnlyPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("고객사 목록을 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadCompanies() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/system/companies?includeInactive=true", {
          method: "GET",
        });
        const data = (await response.json()) as CompaniesApiResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setCompanies([]);
          setMessage(data.ok ? "고객사 목록을 불러오지 못했습니다." : data.message || data.error);
          return;
        }

        setCompanies(data.companies);
        setMessage("고객사 목록을 불러왔습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setCompanies([]);
        setMessage(
          error instanceof Error
            ? error.message
            : "고객사 목록을 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanies();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredCompanies = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return companies.filter((company) => {
      if (statusFilter !== "all" && company.status !== statusFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return (
        company.name.toLowerCase().includes(normalizedKeyword) ||
        company.id.toLowerCase().includes(normalizedKeyword) ||
        (company.memo ?? "").toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [companies, keyword, statusFilter]);

  const activeCount = companies.filter((company) => company.status === "active").length;
  const inactiveCount = companies.filter((company) => company.status === "inactive").length;
  const totalMembers = companies.reduce((sum, company) => sum + company.memberCount, 0);
  const totalUsedBytes = companies.reduce(
    (sum, company) => sum + (company.storageUsedBytes ?? 0),
    0,
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM COMPANIES
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                고객사 관리
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                시스템관리자가 고객사 목록, 활성 상태, 멤버 수, 저장공간 사용량을 read-only로 확인하는 화면입니다.
                고객사 생성, 수정, 삭제 action은 이번 버전에서 연결하지 않습니다.
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

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="전체 고객사" value={companies.length} />
          <SummaryCard label="활성 고객사" value={activeCount} />
          <SummaryCard label="비활성 고객사" value={inactiveCount} />
          <SummaryCard
            label="전체 저장공간 사용량"
            value={formatBytes(totalUsedBytes)}
            description={`${totalMembers}명 멤버 기준`}
          />
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px] lg:items-end">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">연결 상태</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
              <code className="mt-3 block rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
                GET /api/system/companies?includeInactive=true
              </code>
            </div>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              검색
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="고객사명, ID, 메모"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              상태
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </label>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            고객사 목록을 불러오는 중입니다.
          </div>
        ) : filteredCompanies.length > 0 ? (
          <section className="grid gap-4">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            표시할 고객사가 없습니다.
          </div>
        )}
      </div>
    </main>
  );
}
