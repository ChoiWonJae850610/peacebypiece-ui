"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { ADMIN_SURFACE_ITEM_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import type {
  AdminDashboardQueueId,
  AdminDashboardTaskPriorityKey,
  AdminDashboardTaskStatusKey,
  AdminDashboardTodayTask,
  AdminOperationalDashboardSnapshots,
} from "@/lib/admin/adminOperations.types";
import {
  ADMIN_DASHBOARD_DEFAULT_QUEUE_ID,
  ADMIN_DASHBOARD_QUEUE_ORDER,
  formatAdminDashboardCount,
  formatAdminDashboardDue,
  formatAdminDashboardQuantity,
  selectAdminDashboardQueueTasks,
} from "@/lib/admin/adminOperations.presentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminOperationsDashboardProps = {
  snapshots: AdminOperationalDashboardSnapshots;
};

type AdminTranslation = ReturnType<typeof useAdminTranslation>;

function translateInsightLabel(
  queueId: AdminDashboardQueueId,
  fallback: string,
  t: AdminTranslation,
): string {
  return t(`operationsDashboard.insights.${queueId}`, fallback);
}

function translateInsightDescription(
  queueId: AdminDashboardQueueId,
  fallback: string,
  t: AdminTranslation,
): string {
  return t(`operationsDashboard.insights.${queueId}Description`, fallback);
}

function translateQueueTitle(
  queueId: AdminDashboardQueueId,
  t: AdminTranslation,
): string {
  return t(
    `operationsDashboard.queues.${queueId}.title`,
    t(`operationsDashboard.insights.${queueId}`, "대기 목록"),
  );
}

function translateQueueEmpty(
  queueId: AdminDashboardQueueId,
  t: AdminTranslation,
): string {
  return t(
    `operationsDashboard.queues.${queueId}.empty`,
    t("operationsDashboard.todayTasksEmpty", "표시할 작업지시서가 없습니다."),
  );
}

function translateTodayTaskStatusLabel(
  statusKey: AdminDashboardTaskStatusKey,
  fallback: string,
  t: AdminTranslation,
): string {
  return t(`operationsDashboard.todayTasks.status.${statusKey}`, fallback);
}

function translateTodayTaskPriorityLabel(
  priorityKey: AdminDashboardTaskPriorityKey,
  fallback: string,
  t: AdminTranslation,
): string {
  return t(`operationsDashboard.todayTasks.priority.${priorityKey}`, fallback);
}

function WorkorderShortcutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4.75h10A1.75 1.75 0 0 1 18.75 6.5v11A1.75 1.75 0 0 1 17 19.25H7A1.75 1.75 0 0 1 5.25 17.5v-11A1.75 1.75 0 0 1 7 4.75Z" />
      <path d="M8.5 8.25h7" />
      <path d="M8.5 12h7" />
      <path d="M8.5 15.75h4" />
    </svg>
  );
}

function AdminTaskPreview({
  task,
  label,
}: {
  task: AdminDashboardTodayTask;
  label: string;
}) {
  const previewUrls =
    (task.previewUrls ?? []).length > 0
      ? task.previewUrls
      : task.thumbnailUrl
        ? [task.thumbnailUrl]
        : [];
  const [previewIndex, setPreviewIndex] = useState(0);
  const previewUrl = previewUrls[previewIndex] ?? null;

  if (previewUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={previewUrl}
        alt=""
        className="h-full w-full object-cover"
        onError={() => {
          setPreviewIndex((current) => {
            const next = current + 1;
            return next < previewUrls.length ? next : previewUrls.length;
          });
        }}
      />
    );
  }

  return <span>{label}</span>;
}

export default function AdminOperationsDashboard({
  snapshots,
}: AdminOperationsDashboardProps) {
  const t = useAdminTranslation();
  const snapshot = snapshots.today;
  const [selectedQueueId, setSelectedQueueId] = useState<AdminDashboardQueueId>(
    ADMIN_DASHBOARD_DEFAULT_QUEUE_ID,
  );
  const selectedTasks = useMemo(
    () => selectAdminDashboardQueueTasks(snapshot, selectedQueueId),
    [snapshot, selectedQueueId],
  );
  const insightsById = useMemo(
    () => new Map(snapshot.insights.map((item) => [item.id, item])),
    [snapshot.insights],
  );
  const queueTitle = translateQueueTitle(selectedQueueId, t);

  return (
    <AdminCard variant="base" className="shrink-0 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">
            {t("operationsDashboard.eyebrow", "Work order flow")}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold tracking-tight pbp-text-primary">
            {t("operationsDashboard.workorderStatusTitle", "작업지시서 현황")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 pbp-text-muted">
            {t(
              "operationsDashboard.description",
              "검토, 발주, 검수, 입고 지연 상태를 한 화면에서 확인합니다.",
            )}
          </p>
        </div>
        <AdminLinkButton href="/worker" variant="primary" size="md">
          {t("operationsDashboard.actions.openWorkorderShort", "업무화면")}
        </AdminLinkButton>
      </div>

      <div className="mt-5 grid gap-4 xl:h-[360px] xl:grid-cols-[1.35fr_0.65fr]">
        <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[var(--pbp-radius-card)] border p-4 pbp-card-muted xl:h-full xl:min-h-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-base font-semibold pbp-text-primary">
                {queueTitle}
              </h2>
              <Link
                href="/worker"
                aria-label={t(
                  "operationsDashboard.actions.openWorkorderWorkspace",
                  "작업지시서 업무 화면으로 이동",
                )}
                title={t(
                  "operationsDashboard.actions.openWorkorderWorkspace",
                  "작업지시서 업무 화면으로 이동",
                )}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition pbp-action-secondary"
              >
                <WorkorderShortcutIcon />
              </Link>
            </div>
            <AdminStatusBadge tone="neutral">
              {formatAdminDashboardCount(selectedTasks.length, t)}
            </AdminStatusBadge>
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {selectedTasks.length > 0 ? (
              selectedTasks.map((task) => (
                <article
                  key={task.id}
                  className={`${ADMIN_SURFACE_ITEM_CLASS} grid gap-3 rounded-2xl p-3 sm:grid-cols-[64px_1fr_auto] sm:items-center`}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--pbp-surface-soft)] text-[11px] font-semibold pbp-text-subtle ring-1 ring-[var(--pbp-border)]">
                    <AdminTaskPreview
                      task={task}
                      label={t("operationsDashboard.previewEmpty", "미리보기")}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone="neutral">
                        {translateTodayTaskStatusLabel(
                          task.statusKey,
                          task.statusLabel,
                          t,
                        )}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="maintenance">
                        {translateTodayTaskPriorityLabel(
                          task.priorityKey,
                          task.priorityLabel,
                          t,
                        )}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="neutral">
                        {t("operationsDashboard.attachmentLabel", "첨부")}{" "}
                        {formatAdminDashboardCount(task.attachmentCount, t)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold pbp-text-primary">
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium pbp-text-muted">
                      <span>
                        {t("operationsDashboard.factoryLabel", "공장")} :{" "}
                        {task.factoryName}
                      </span>
                      <span>
                        {t("operationsDashboard.quantityLabel", "수량")} :{" "}
                        {formatAdminDashboardQuantity(task, t)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-left sm:items-end sm:text-right">
                    <div>
                      <p className="text-xs font-semibold pbp-text-muted">
                        {t("operationsDashboard.dueLabel", "납기")}
                      </p>
                      <p className="mt-1 text-sm font-semibold pbp-text-primary">
                        {formatAdminDashboardDue(task, t)}
                      </p>
                    </div>
                    <AdminLinkButton
                      href={task.actionHref}
                      variant="primary"
                      size="sm"
                      className="px-3 py-1.5 text-xs"
                    >
                      {t("operationsDashboard.openWorkorder", "열기")}
                    </AdminLinkButton>
                  </div>
                </article>
              ))
            ) : (
              <AdminEmptyState
                title={translateQueueEmpty(selectedQueueId, t)}
                className="flex min-h-[250px] items-center justify-center border-dashed text-center"
              />
            )}
          </div>
        </section>

        <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[var(--pbp-radius-card)] border border-[var(--pbp-brand-muted)] bg-[var(--pbp-brand-primary)] p-4 text-[var(--pbp-text-inverse)] shadow-sm transition-colors xl:h-full xl:min-h-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                {t("operationsDashboard.priorityEyebrow", "Queue")}
              </p>
              <h2 className="mt-1 text-base font-semibold">
                {t("operationsDashboard.priorityTitle", "주요 대기 현황")}
              </h2>
            </div>
            <AdminStatusBadge tone="inverse">{formatAdminDashboardCount(snapshot.insights.length, t)}</AdminStatusBadge>
          </div>
          <div className="mt-4 grid min-h-0 flex-1 grid-rows-4 gap-3">
            {ADMIN_DASHBOARD_QUEUE_ORDER.map((queueId) => {
              const item = insightsById.get(queueId);
              if (!item) return null;
              const isActive = selectedQueueId === queueId;
              return (
                <button
                  key={queueId}
                  type="button"
                  onClick={() => setSelectedQueueId(queueId)}
                  aria-pressed={isActive}
                  className={`min-h-0 overflow-hidden rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${isActive ? "border-white/40 bg-white/20 shadow-sm" : "border-transparent bg-white/10 hover:bg-white/15"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">
                      {translateInsightLabel(queueId, item.label, t)}
                    </span>
                    <span className="text-lg font-semibold">{item.value}</span>
                  </div>
                  <p className="mt-1 max-h-8 overflow-hidden text-xs text-white/65">
                    {translateInsightDescription(queueId, item.description, t)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AdminCard>
  );
}
