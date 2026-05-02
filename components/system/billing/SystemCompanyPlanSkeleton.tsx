"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import type {
  SystemBillingCompanySummary,
  SystemBillingOverview,
} from "@/lib/billing/systemBillingTypes";

interface BillingApiSuccess {
  ok: true;
  overview: SystemBillingOverview;
}

interface BillingApiError {
  ok: false;
  error: string;
  message?: string;
}

type BillingApiResponse = BillingApiSuccess | BillingApiError;

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

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "미지정";
  }

  if (price <= 0) {
    return "무료";
  }

  return `${price.toLocaleString("ko-KR")}원`;
}

function formatRatio(ratio?: number | null): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) {
    return "0%";
  }

  return `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
}

function getStorageTone(company: SystemBillingCompanySummary): string {
  if (company.storageUsageRatio >= 0.9) {
    return "bg-red-100 text-red-700";
  }

  if (company.storageUsageRatio >= 0.75) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-emerald-100 text-emerald-700";
}

function PlanCard({ plan }: { plan: SystemBillingOverview["plans"][number] }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-stone-950">{plan.name}</h2>
          <p className="mt-1 text-xs text-stone-500">{plan.code}</p>
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
          {plan.status}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-stone-500">가격</dt>
          <dd className="font-semibold text-stone-950">{formatPrice(plan.priceKrw)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-stone-500">저장용량</dt>
          <dd className="font-semibold text-stone-950">
            {formatBytes(plan.storage.includedStorageBytes)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-stone-500">멤버</dt>
          <dd className="font-semibold text-stone-950">
            {plan.members.includedMembers}명
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {plan.features.invitationEnabled ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
            초대
          </span>
        ) : null}
        {plan.features.storageManagementEnabled ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            용량관리
          </span>
        ) : null}
        {plan.features.advancedStatsEnabled ? (
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
            고급통계
          </span>
        ) : null}
      </div>
    </article>
  );
}

function CompanyBillingCard({ company }: { company: SystemBillingCompanySummary }) {
  const storageUsedBytes = company.storageUsage?.usedBytes ?? 0;
  const storageLimitBytes = company.effectiveStorageLimitBytes ?? 0;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-stone-950">
            {company.name}
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            {company.billingStatus || "billing status 없음"} / {company.isActive ? "활성" : "비활성"}
          </p>
        </div>
        <span className="w-fit rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
          {company.plan?.name ?? "미지정"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-stone-500">저장공간</p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            {formatBytes(storageUsedBytes)} / {formatBytes(storageLimitBytes)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-stone-500">사용률</p>
          <span
            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStorageTone(
              company,
            )}`}
          >
            {formatRatio(company.storageUsageRatio)}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-stone-500">멤버</p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            {company.memberCount} / {company.effectiveMemberLimit ?? "미지정"}명
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-stone-500">가격</p>
          <p className="mt-1 text-sm font-semibold text-stone-950">
            {formatPrice(company.effectivePriceKrw)}
          </p>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-stone-100">
        <div
          className="h-full rounded-full bg-stone-900"
          style={{ width: formatRatio(company.storageUsageRatio) }}
        />
      </div>

      {company.assignedPlan?.override?.memo ? (
        <p className="mt-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-500">
          {company.assignedPlan.override.memo}
        </p>
      ) : null}
    </article>
  );
}

export default function SystemCompanyPlanSkeleton() {
  const [overview, setOverview] = useState<SystemBillingOverview | null>(null);
  const [message, setMessage] = useState("요금제/용량 정보를 불러오는 중입니다.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadBillingOverview() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/system/billing", {
          method: "GET",
        });
        const data = (await response.json()) as BillingApiResponse;

        if (!mounted) {
          return;
        }

        if (!response.ok || !data.ok) {
          setOverview(null);
          setMessage(
            data.ok ? "요금제 정보를 불러오지 못했습니다." : data.message || data.error,
          );
          return;
        }

        setOverview(data.overview);
        setMessage("DB 기준 요금제/용량 정보를 불러왔습니다.");
      } catch (error) {
        if (!mounted) {
          return;
        }

        setOverview(null);
        setMessage(
          error instanceof Error
            ? error.message
            : "요금제 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadBillingOverview();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM BILLING
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                요금제·용량
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                고객사별 plan, 저장용량, 멤버 수, 저장공간 사용량을 확인하는 시스템관리자 화면입니다.
                저장 action과 결제 자동화는 이번 버전에서 연결하지 않습니다.
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
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">연결 상태</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
              {overview ? (
                <p className="mt-1 text-xs text-stone-500">
                  generatedAt: {overview.generatedAt}
                </p>
              ) : null}
            </div>
            <code className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
              GET /api/system/billing
            </code>
          </div>
        </section>

        {overview ? (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              {overview.plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </section>

            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">
                    고객사별 적용 현황
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    active plan assignment와 latest storage usage snapshot 기준으로 표시합니다.
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {overview.companies.length}개 고객사
                </span>
              </div>

              <div className="grid gap-4">
                {overview.companies.map((company) => (
                  <CompanyBillingCard key={company.id} company={company} />
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {isLoading
              ? "요금제/용량 정보를 불러오는 중입니다."
              : "요금제/용량 정보를 표시할 수 없습니다."}
          </div>
        )}
      </div>
    </main>
  );
}
