"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_COMPANY_PLAN_POLICY_NOTES,
} from "@/lib/system/systemCompanyPlanSkeleton";
import type { SystemBillingOverview } from "@/lib/billing/systemBillingTypes";

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
  if (!bytes) {
    return "0B";
  }

  const gb = bytes / 1024 / 1024 / 1024;

  if (gb >= 1) {
    return `${gb.toFixed(1)}GB`;
  }

  const mb = bytes / 1024 / 1024;

  return `${mb.toFixed(1)}MB`;
}

function formatPrice(price?: number | null): string {
  if (price === null || price === undefined) {
    return "미지정";
  }

  return `${price.toLocaleString("ko-KR")}원`;
}

function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export default function SystemCompanyPlanSkeleton() {
  const [overview, setOverview] = useState<SystemBillingOverview | null>(null);
  const [message, setMessage] = useState("요금제/용량 정보를 불러오는 중입니다.");

  useEffect(() => {
    let mounted = true;

    async function loadBillingOverview() {
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
          setMessage(data.ok ? "요금제 정보를 불러오지 못했습니다." : data.message || data.error);
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
      }
    }

    loadBillingOverview();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            SYSTEM BILLING
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-stone-950">
            고객별 요금제 / 용량 관리
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            시스템관리자가 고객사별 plan, 저장용량, 멤버 수, 저장공간 사용량을 확인하는 화면입니다. v{APP_VERSION}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/system"
              className="inline-flex rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              시스템 콘솔
            </Link>
            <code className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-500">
              /api/system/billing
            </code>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">연결 상태</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{message}</p>
          {overview ? (
            <p className="mt-2 text-xs text-stone-500">
              generatedAt: {overview.generatedAt}
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {(overview?.plans ?? []).map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-stone-950">
                  {plan.name}
                </h2>
                <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
                  {plan.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">{plan.code}</p>
              <dl className="mt-4 grid gap-2 text-xs text-stone-600">
                <div className="flex justify-between gap-3">
                  <dt>가격</dt>
                  <dd className="font-semibold text-stone-900">
                    {formatPrice(plan.priceKrw)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>저장용량</dt>
                  <dd className="font-semibold text-stone-900">
                    {formatBytes(plan.storage.includedStorageBytes)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>멤버</dt>
                  <dd className="font-semibold text-stone-900">
                    {plan.members.includedMembers}명
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">고객사별 적용 현황</h2>
          <div className="mt-4 grid gap-3">
            {(overview?.companies ?? []).map((company) => (
              <article
                key={company.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-950">
                      {company.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">
                      {company.billingStatus || "billing status 없음"} / {company.isActive ? "활성" : "비활성"}
                    </p>
                  </div>
                  <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600">
                    {company.plan?.name ?? "미지정"}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2 text-xs text-stone-600 md:grid-cols-4">
                  <div>
                    <dt>저장공간</dt>
                    <dd className="mt-1 font-semibold text-stone-900">
                      {formatBytes(company.storageUsage?.usedBytes)} / {formatBytes(company.effectiveStorageLimitBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt>사용률</dt>
                    <dd className="mt-1 font-semibold text-stone-900">
                      {formatRatio(company.storageUsageRatio)}
                    </dd>
                  </div>
                  <div>
                    <dt>멤버</dt>
                    <dd className="mt-1 font-semibold text-stone-900">
                      {company.memberCount} / {company.effectiveMemberLimit ?? "미지정"}명
                    </dd>
                  </div>
                  <div>
                    <dt>가격</dt>
                    <dd className="mt-1 font-semibold text-stone-900">
                      {formatPrice(company.effectivePriceKrw)}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">운영 정책 메모</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-4">
            {SYSTEM_COMPANY_PLAN_POLICY_NOTES.map((note) => (
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
