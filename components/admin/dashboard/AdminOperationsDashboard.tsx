"use client";

import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import type { AdminOperationalDashboardSnapshots } from "@/lib/admin/adminOperations.types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminOperationsDashboardProps = {
  snapshots: AdminOperationalDashboardSnapshots;
};

function formatAdminCount(count: number, t: ReturnType<typeof useAdminTranslation>): string {
  const unit = t("operationsDashboard.countSuffix", "건");
  return unit === "건" ? `${count}${unit}` : `${count} ${unit}`;
}

function translateInsightLabel(index: number, fallback: string, t: ReturnType<typeof useAdminTranslation>): string {
  const keys = ["reviewWaiting", "orderWaiting", "inspectionWaiting", "inboundDelayed"] as const;
  const key = keys[index];
  return key ? t(`operationsDashboard.insights.${key}`, fallback) : fallback;
}

function translateInsightDescription(index: number, fallback: string, t: ReturnType<typeof useAdminTranslation>): string {
  const keys = ["reviewWaitingDescription", "orderWaitingDescription", "inspectionWaitingDescription", "inboundDelayedDescription"] as const;
  const key = keys[index];
  return key ? t(`operationsDashboard.insights.${key}`, fallback) : fallback;
}

function translateTodayTaskStatusLabel(label: string, t: ReturnType<typeof useAdminTranslation>): string {
  const normalized = label.trim().toLowerCase();
  if (["검토대기", "검토 대기", "review waiting"].includes(normalized)) return t("operationsDashboard.todayTasks.status.reviewRequested", label);
  if (["검수대기", "검수 대기", "inspection waiting"].includes(normalized)) return t("operationsDashboard.todayTasks.status.inspection", label);
  if (["발주대기", "발주 대기", "order waiting"].includes(normalized)) return t("operationsDashboard.todayTasks.status.reviewCompleted", label);
  if (["반려", "rejected"].includes(normalized)) return t("operationsDashboard.todayTasks.status.rejected", label);
  if (["작성중", "draft"].includes(normalized)) return t("operationsDashboard.todayTasks.status.draft", label);
  return label;
}

function translateTodayTaskPriorityLabel(label: string, t: ReturnType<typeof useAdminTranslation>): string {
  const normalized = label.trim().toLowerCase();
  if (["관리자 검토", "review needed"].includes(normalized)) return t("operationsDashboard.todayTasks.priority.review", label);
  if (["검수 필요", "inspection needed"].includes(normalized)) return t("operationsDashboard.todayTasks.priority.inspection", label);
  if (["발주 확인", "order check"].includes(normalized)) return t("operationsDashboard.todayTasks.priority.order", label);
  return label;
}

export default function AdminOperationsDashboard({ snapshots }: AdminOperationsDashboardProps) {
  const t = useAdminTranslation();
  const snapshot = snapshots.today;

  return (
    <AdminCard className="shrink-0 overflow-hidden">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="flex min-h-[270px] max-h-[310px] flex-col rounded-[24px] border border-stone-100 bg-stone-50/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-stone-950">{t("operationsDashboard.actionQueueTitle", "검토·발주 대기")}</h2>
            </div>
            <AdminStatusBadge tone="neutral">
              {formatAdminCount(snapshot.todayTasks.length, t)}
            </AdminStatusBadge>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {snapshot.todayTasks.length > 0 ? (
              snapshot.todayTasks.map((task) => (
                <article key={task.id} className="grid gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm sm:grid-cols-[64px_1fr_auto] sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-[11px] font-semibold text-stone-400 ring-1 ring-stone-200">
                    {task.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={task.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{t("operationsDashboard.previewEmpty", "미리보기")}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone="neutral">{translateTodayTaskStatusLabel(task.statusLabel, t)}</AdminStatusBadge>
                      <AdminStatusBadge tone="maintenance">{translateTodayTaskPriorityLabel(task.priorityLabel, t)}</AdminStatusBadge>
                      <AdminStatusBadge tone="neutral">
                        {t("operationsDashboard.attachmentLabel", "첨부")} {formatAdminCount(task.attachmentCount, t)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-stone-950">{task.title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-stone-500">
                      <span>{t("operationsDashboard.factoryLabel", "공장")} : {task.factoryName}</span>
                      <span>{t("operationsDashboard.quantityLabel", "수량")} : {task.quantityLabel}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-left sm:items-end sm:text-right">
                    <div>
                      <p className="text-xs font-semibold text-stone-500">{t("operationsDashboard.dueLabel", "납기")}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">{task.dueLabel}</p>
                    </div>
                    <AdminLinkButton href={task.actionHref} variant="primary" size="sm" className="px-3 py-1.5 text-xs">
                      {t("operationsDashboard.openWorkorder", "작업지시서 열기")}
                    </AdminLinkButton>
                  </div>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title={t("operationsDashboard.todayTasksEmpty", "오늘 확인할 검토·발주 대기 작업지시서가 없습니다.")}
                className="flex min-h-[170px] items-center justify-center border-dashed text-center"
              />
            )}
          </div>
        </section>

        <section className="min-h-[270px] max-h-[310px] overflow-y-auto rounded-[24px] border border-stone-100 bg-[var(--admin-theme-surface)] p-4 text-[var(--admin-theme-text-on-surface)] shadow-sm transition-colors">
          <h2 className="text-base font-semibold">{t("operationsDashboard.priorityTitle", "주요 대기 현황")}</h2>
          <div className="mt-4 grid gap-3">
            {snapshot.insights.map((item, index) => (
              <div key={`${item.label}-${index}`} className="rounded-2xl bg-white/10 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{translateInsightLabel(index, item.label, t)}</span>
                  <span className="text-lg font-semibold">{item.value}</span>
                </div>
                <p className="mt-1 text-xs text-stone-300">{translateInsightDescription(index, item.description, t)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminCard>
  );
}
