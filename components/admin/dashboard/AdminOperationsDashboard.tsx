"use client";

import { useMemo, useState } from "react";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_DASHBOARD_PERIOD_OPTIONS,
  type AdminDashboardPeriod,
  type AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminOperationsDashboardProps = {
  snapshots: AdminOperationalDashboardSnapshots;
};

export default function AdminOperationsDashboard({ snapshots }: AdminOperationsDashboardProps) {
  const t = useAdminTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState<AdminDashboardPeriod>("today");
  const snapshot = snapshots[selectedPeriod];
  const maxStageValue = useMemo(() => Math.max(1, ...snapshot.statusFlow.map((item) => item.value)), [snapshot.statusFlow]);
  const totalDistributionValue = useMemo(() => snapshot.statusDistribution.reduce((sum, item) => sum + item.value, 0), [snapshot.statusDistribution]);

  return (
    <AdminCard className="flex min-h-[560px] shrink-0 flex-col overflow-hidden lg:min-h-[620px]">
      <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">{t("operationsDashboard.title", "운영 대시보드")}</h2>
          <p className="mt-1 text-xs text-stone-500">
            {snapshot.sourceState === "db" ? t("operationsDashboard.sourceDb", "DB 기준 오늘의 작업과 대기 항목을 표시합니다.") : snapshot.sourceState === "not_configured" ? t("operationsDashboard.sourceNotConfigured", "DB 연결 설정이 없어 0건으로 표시됩니다.") : t("operationsDashboard.sourceError", "DB 조회 실패로 0건으로 표시됩니다.")}
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

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto overflow-x-hidden py-6 pr-1 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="flex min-h-[360px] flex-col rounded-[24px] border border-stone-100 bg-stone-50/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-stone-950">{t("operationsDashboard.todayWorkTitle", "오늘의 작업")}</h3>
              <p className="mt-1 text-xs text-stone-500">{t("operationsDashboard.todayWorkDescription", "검토대기와 검수대기 작업을 우선 확인합니다.")}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">
              {snapshot.todayTasks.length}{t("operationsDashboard.countSuffix", "건")}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {snapshot.todayTasks.length > 0 ? (
              snapshot.todayTasks.map((task) => (
                <div key={task.id} className="grid gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">{task.statusLabel}</span>
                      <span className="rounded-full bg-[var(--admin-theme-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--admin-theme-text-on-surface)]">{task.priorityLabel}</span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-stone-950">{task.title}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-stone-500">{t("operationsDashboard.dueLabel", "납기")}</p>
                    <p className="mt-1 text-sm font-semibold text-stone-900">{task.dueLabel}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-center text-sm font-medium text-stone-500">
                {t("operationsDashboard.todayTasksEmpty", "오늘 확인할 검토대기/검수대기 작업이 없습니다.")}
              </div>
            )}
          </div>
        </section>

        <section className="grid min-h-[360px] grid-rows-[auto_auto_1fr] gap-4 overflow-y-auto overflow-x-hidden pr-1">
          <div className="rounded-[24px] border border-stone-100 bg-[var(--admin-theme-surface)] p-5 text-[var(--admin-theme-text-on-surface)] shadow-sm transition-colors">
            <h3 className="text-base font-semibold">{t("operationsDashboard.priorityTitle", "우선 처리")}</h3>
            <div className="mt-4 grid gap-3">
              {snapshot.insights.map((item, index) => (
                <div key={`${item.label}-${index}`} className="rounded-2xl bg-white/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-lg font-semibold">{item.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-950">{t("operationsDashboard.statusDistributionTitle", "상태 분포")}</h3>
              <span className="text-xs font-semibold text-stone-400">{totalDistributionValue}{t("operationsDashboard.countSuffix", "건")}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {snapshot.statusDistribution.map((item) => {
                const width = totalDistributionValue > 0 ? Math.round((item.value / totalDistributionValue) * 100) : 0;
                return (
                  <div key={item.id}>
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

          <div className="rounded-[24px] border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-950">{t("operationsDashboard.statusFlowTitle", "상태 흐름")}</h3>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
                {t(`operationsDashboard.periods.${selectedPeriod}`, ADMIN_DASHBOARD_PERIOD_OPTIONS.find((period) => period.value === selectedPeriod)?.label ?? "")}
              </span>
            </div>
            <div className="mt-5 flex h-36 items-end gap-3 border-b border-l border-stone-200 px-3 pb-0 pt-4">
              {snapshot.statusFlow.map((stage) => {
                const height = Math.max(8, Math.round((stage.value / maxStageValue) * 100));
                return (
                  <div key={stage.id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex h-full w-full items-end justify-center">
                      <div className="w-full max-w-10 rounded-t-2xl bg-[var(--admin-theme-surface)] shadow-sm" style={{ height: `${height}%` }} aria-label={`${stage.label} ${stage.value}건`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-stone-950">{stage.value}</p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-stone-500">{stage.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </AdminCard>
  );
}
