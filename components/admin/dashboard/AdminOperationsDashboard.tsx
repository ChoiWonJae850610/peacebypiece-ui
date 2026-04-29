"use client";

import { useMemo, useState } from "react";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_DASHBOARD_PERIOD_OPTIONS,
  type AdminDashboardPeriod,
  type AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";

type AdminOperationsDashboardProps = {
  snapshots: AdminOperationalDashboardSnapshots;
};

export default function AdminOperationsDashboard({ snapshots }: AdminOperationsDashboardProps) {
  const t = useAdminTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<AdminDashboardPeriod>("month");
  const snapshot = snapshots[selectedPeriod];
  const maxStageValue = useMemo(() => Math.max(1, ...snapshot.statusFlow.map((item) => item.value)), [snapshot.statusFlow]);
  const totalDistributionValue = useMemo(() => snapshot.statusDistribution.reduce((sum, item) => sum + item.value, 0), [snapshot.statusDistribution]);

  return (
    <AdminCard className="flex flex-1 flex-col overflow-hidden lg:min-h-0">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">{t("operationsDashboard.title", "운영 통계")}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {snapshot.sourceState === "db" ? t("operationsDashboard.sourceDb", "DB 기준 운영 현황") : snapshot.sourceState === "not_configured" ? t("operationsDashboard.sourceNotConfigured", "DB 연결 설정이 없어 0건으로 표시됩니다.") : t("operationsDashboard.sourceError", "DB 조회 실패로 0건으로 표시됩니다.")}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2" role="tablist" aria-label={t("operationsDashboard.periodAria", "대시보드 기간 선택")}>
          {ADMIN_DASHBOARD_PERIOD_OPTIONS.map((period) => {
            const selected = selectedPeriod === period.value;
            return (
              <button
                key={period.value}
                type="button"
                onClick={() => setSelectedPeriod(period.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selected ? "bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
                aria-pressed={selected}
              >
                {t(`operationsDashboard.periods.${period.value}`, period.label)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid flex-1 gap-6 overflow-hidden py-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="flex min-h-0 flex-col rounded-[28px] border border-stone-100 bg-stone-50/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-stone-950">{t("operationsDashboard.statusFlowTitle", "상태 흐름")}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">
              {t(`operationsDashboard.periods.${selectedPeriod}`, ADMIN_DASHBOARD_PERIOD_OPTIONS.find((period) => period.value === selectedPeriod)?.label ?? "")}
            </span>
          </div>

          <div className="mt-8 flex flex-1 items-end gap-4 border-b border-l border-stone-200 px-4 pb-0 pt-6">
            {snapshot.statusFlow.map((stage) => {
              const height = Math.max(8, Math.round((stage.value / maxStageValue) * 100));
              return (
                <div key={stage.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                  <div className="flex h-full min-h-44 w-full items-end justify-center">
                    <div className="w-full max-w-16 rounded-t-3xl bg-[var(--admin-theme-surface)] shadow-sm" style={{ height: `${height}%` }} aria-label={`${stage.label} ${stage.value}건`} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-stone-950">{stage.value}</p>
                    <p className="mt-1 text-xs font-medium text-stone-500">{stage.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4 overflow-hidden">
          <div className="rounded-[28px] border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-950">{t("operationsDashboard.statusDistributionTitle", "상태 분포")}</h3>
              <span className="text-xs font-semibold text-stone-400">{totalDistributionValue}{t("operationsDashboard.countSuffix", "건")}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {snapshot.statusDistribution.map((item) => {
                const width = totalDistributionValue > 0 ? Math.round((item.value / totalDistributionValue) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                      <span>{item.label}</span>
                      <span>{item.value}{t("operationsDashboard.countSuffix", "건")}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-stone-100">
                      <div className="h-2 rounded-full bg-[var(--admin-theme-surface)]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 rounded-[28px] border border-stone-100 bg-[var(--admin-theme-surface)] p-5 text-[var(--admin-theme-text-on-surface)] transition-colors shadow-sm">
            <h3 className="text-base font-semibold">{t("operationsDashboard.todayCheckTitle", "오늘 체크")}</h3>
            <div className="mt-4 grid gap-3">
              {snapshot.insights.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminCard>
  );
}
