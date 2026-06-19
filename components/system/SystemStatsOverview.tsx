"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  SYSTEM_CARD_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_PROGRESS_TRACK_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTLE_TEXT_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import type { SystemDashboardStats } from "@/lib/system/systemDashboardStats";

type ApiResponse = { ok: true; dashboard: SystemDashboardStats } | { ok: false; message?: string };

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index >= 3 ? 1 : 0)} ${units[index]}`;
}

function formatDate(value: string | null) {
  if (!value) return "활동 없음";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function SystemStatsOverview() {
  const [data, setData] = useState<SystemDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/system/stats", { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.ok ? "통계를 불러오지 못했습니다." : payload.message ?? "통계를 불러오지 못했습니다.");
      setData(payload.dashboard);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "통계를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const summaryCards = useMemo(() => data ? [
    { id: "companies", label: "전체 고객사", value: `${data.totals.companies}곳`, helper: `활성 ${data.totals.activeCompanies} · 비활성 ${data.totals.inactiveCompanies}` },
    { id: "members", label: "승인 멤버", value: `${data.totals.members}명`, helper: "company_members 승인 상태 기준" },
    { id: "workorders", label: "작업지시서", value: `${data.totals.workOrders}건`, helper: "활성·복원 상태 기준" },
    { id: "storage", label: "저장용량", value: formatBytes(data.totals.storageUsedBytes), helper: `한도 ${formatBytes(data.totals.storageLimitBytes)}` },
  ] : [], [data]);

  return (
    <AdminSection
      title="운영 통계"
      description="고정 예시값이 아닌 현재 DB 집계입니다. 고객사·멤버·작업지시서·저장용량을 한 영역에서 확인합니다."
      className="p-5 sm:p-6"
      bodyClassName="mt-5"
      headerClassName={SYSTEM_SECTION_HEADER_CLASS}
      actions={<button type="button" onClick={() => void load()} disabled={loading} className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-xs font-semibold text-[var(--pbp-text-muted)] disabled:opacity-50">{loading ? "갱신 중" : "새로고침"}</button>}
    >
      {loading && !data ? <div className={SYSTEM_MUTED_CARD_CLASS}><p className={SYSTEM_SMALL_TEXT_CLASS}>실제 운영 통계를 불러오는 중입니다.</p></div> : null}
      {error ? <div className="rounded-2xl border border-[var(--pbp-status-danger)] bg-[var(--pbp-status-danger-soft)] p-4"><p className="text-sm font-semibold text-[var(--pbp-status-danger)]">통계 조회 실패</p><p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">{error}</p></div> : null}
      {data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => <article key={card.id} className={SYSTEM_CARD_CLASS}><p className={`text-xs font-semibold ${SYSTEM_SUBTLE_TEXT_CLASS}`}>{card.label}</p><p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{card.value}</p><p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>{card.helper}</p></article>)}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
            <article className={SYSTEM_CARD_CLASS}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>고객사별 운영 현황</h3><p className={`mt-1 ${SYSTEM_SMALL_TEXT_CLASS}`}>저장용량 비율이 높은 순서로 최대 12곳을 표시합니다.</p></div><Link href="/system/companies" className="text-xs font-semibold text-[var(--pbp-brand-primary)]">고객사 관리</Link></div>
              <div className="mt-4 space-y-3">
                {data.companies.length === 0 ? <div className={SYSTEM_MUTED_CARD_CLASS}><p className={SYSTEM_SMALL_TEXT_CLASS}>등록된 고객사가 없습니다.</p></div> : data.companies.map((company) => (
                  <div key={company.id} className={SYSTEM_MUTED_CARD_CLASS}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{company.name}</p><p className={`mt-1 text-xs ${SYSTEM_SUBTLE_TEXT_CLASS}`}>{company.planCode} · 멤버 {company.memberCount}명 · 작업지시서 {company.workOrderCount}건</p><p className={`mt-1 text-[11px] ${SYSTEM_SUBTLE_TEXT_CLASS}`}>최근 활동 {formatDate(company.lastActivityAt)}</p></div>{company.storagePercent >= 100 ? <AdminStatusBadge tone="danger">용량 초과</AdminStatusBadge> : company.storagePercent >= 70 ? <AdminStatusBadge tone="warning">용량 주의</AdminStatusBadge> : null}</div>
                    <div className="mt-3"><div className="flex justify-between gap-3 text-xs text-[var(--pbp-text-muted)]"><span>저장용량</span><span>{formatBytes(company.storageUsedBytes)} / {formatBytes(company.storageLimitBytes)} · {company.storagePercent}%</span></div><div className={`mt-2 h-2 rounded-full ${SYSTEM_PROGRESS_TRACK_CLASS}`}><div className={`h-2 rounded-full ${company.storagePercent >= 100 ? "bg-[var(--pbp-status-danger)]" : company.storagePercent >= 70 ? "bg-[var(--pbp-status-warning)]" : "bg-[var(--pbp-brand-primary)]"}`} style={{ width: `${Math.min(company.storagePercent, 100)}%` }} /></div></div>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-4">
              <article className={SYSTEM_CARD_CLASS}><h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>요금제 분포</h3><div className="mt-4 space-y-2">{data.planDistribution.map((plan) => <div key={plan.planCode} className={`${SYSTEM_MUTED_CARD_CLASS} flex items-center justify-between gap-3`}><span className="text-sm text-[var(--pbp-text-muted)]">{plan.planCode}</span><strong className={SYSTEM_VALUE_TEXT_CLASS}>{plan.companyCount}곳</strong></div>)}</div></article>
              <article className={SYSTEM_CARD_CLASS}><h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>확인 필요</h3><div className="mt-4 space-y-2"><div className={`${SYSTEM_MUTED_CARD_CLASS} flex items-center justify-between gap-3`}><span className="text-sm text-[var(--pbp-text-muted)]">용량 70% 이상</span><strong className={SYSTEM_VALUE_TEXT_CLASS}>{data.totals.storageRiskCompanies}곳</strong></div><div className={`${SYSTEM_MUTED_CARD_CLASS} flex items-center justify-between gap-3`}><span className="text-sm text-[var(--pbp-text-muted)]">대기 중 초대</span><strong className={SYSTEM_VALUE_TEXT_CLASS}>{data.totals.pendingInvitations}건</strong></div></div><p className={`mt-4 ${SYSTEM_SMALL_TEXT_CLASS}`}>집계 시각 {formatDate(data.generatedAt)}</p></article>
            </div>
          </div>
        </>
      ) : null}
    </AdminSection>
  );
}
