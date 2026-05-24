"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { ADMIN_SURFACE_ITEM_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
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
  const activeInsight = insightsById.get(selectedQueueId);

  return (
    <section className="relative shrink-0 overflow-hidden rounded-[36px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-[var(--pbp-shadow-elevated)]">
      <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--pbp-brand-muted)] opacity-35 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[var(--pbp-surface-selected)] opacity-70 blur-3xl" aria-hidden="true" />

      <div className="relative grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:p-7">
        <header className="rounded-[30px] border border-[var(--pbp-brand-muted)] bg-[var(--pbp-brand-primary)] p-6 text-[var(--pbp-text-inverse)] shadow-[var(--pbp-shadow-card)] sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {t("operationsDashboard.eyebrow", "Work order flow")}
            </span>
            {activeInsight ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                {translateInsightLabel(selectedQueueId, activeInsight.label, t)} {activeInsight.value}
              </span>
            ) : null}
          </div>

          <div className="mt-8 max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {t("operationsDashboard.visualTitle", "오늘 처리할 흐름을 먼저 확인하세요.")}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/68 sm:text-base">
              {t(
                "operationsDashboard.visualDescription",
                "검토, 발주, 검수, 입고 지연 상태를 한 화면에서 정리하고 바로 작업지시서 업무 화면으로 이동합니다.",
              )}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <AdminLinkButton href="/workspace/workorders" variant="secondary" size="lg" className="border-white/20 bg-white text-[var(--pbp-brand-primary)] hover:bg-white/90">
              {t("operationsDashboard.actions.openWorkorderShort", "업무화면")}
            </AdminLinkButton>
            <span className="inline-flex min-h-12 items-center rounded-full border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white/75">
              {t("operationsDashboard.visualHelper", "대기 상태를 선택하면 목록이 바뀝니다.")}
            </span>
          </div>
        </header>

        <aside className="grid gap-3 sm:grid-cols-2">
          {ADMIN_DASHBOARD_QUEUE_ORDER.map((queueId, index) => {
            const item = insightsById.get(queueId);
            if (!item) return null;
            const isActive = selectedQueueId === queueId;
            return (
              <button
                key={queueId}
                type="button"
                onClick={() => setSelectedQueueId(queueId)}
                aria-pressed={isActive}
                className={`group min-h-[152px] rounded-[28px] border p-5 text-left shadow-[var(--pbp-shadow-card)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-brand-primary)] ${
                  isActive
                    ? "border-[var(--pbp-brand-primary)] bg-[var(--pbp-surface-selected)]"
                    : "border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-soft)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pbp-brand-primary)] text-xs font-semibold text-[var(--pbp-text-inverse)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-3xl font-semibold tracking-[-0.05em] pbp-text-primary">
                    {item.value}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold pbp-text-primary">
                  {translateInsightLabel(queueId, item.label, t)}
                </h3>
                <p className="mt-2 max-h-12 overflow-hidden text-sm leading-6 pbp-text-muted">
                  {translateInsightDescription(queueId, item.description, t)}
                </p>
              </button>
            );
          })}
        </aside>
      </div>

      <div className="relative border-t border-[var(--pbp-border)] bg-[var(--pbp-bg-page)] p-5 sm:p-6 xl:p-7">
        <section className="rounded-[30px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] p-4 shadow-[var(--pbp-shadow-card)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">
                {t("operationsDashboard.selectedQueueEyebrow", "Selected queue")}
              </p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight pbp-text-primary">
                {queueTitle}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminStatusBadge tone="brand">
                {formatAdminDashboardCount(selectedTasks.length, t)}
              </AdminStatusBadge>
              <Link
                href="/workspace/workorders"
                aria-label={t(
                  "operationsDashboard.actions.openWorkorderWorkspace",
                  "작업지시서 업무 화면으로 이동",
                )}
                title={t(
                  "operationsDashboard.actions.openWorkorderWorkspace",
                  "작업지시서 업무 화면으로 이동",
                )}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition pbp-action-secondary"
              >
                <WorkorderShortcutIcon />
              </Link>
            </div>
          </div>

          <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {selectedTasks.length > 0 ? (
              selectedTasks.map((task) => (
                <article
                  key={task.id}
                  className={`${ADMIN_SURFACE_ITEM_CLASS} grid gap-3 rounded-[24px] p-3.5 sm:grid-cols-[72px_1fr_auto] sm:items-center sm:p-4`}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-[var(--pbp-surface-soft)] text-[11px] font-semibold pbp-text-subtle ring-1 ring-[var(--pbp-border)]">
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
                      <AdminStatusBadge tone="info">
                        {translateTodayTaskPriorityLabel(
                          task.priorityKey,
                          task.priorityLabel,
                          t,
                        )}
                      </AdminStatusBadge>
                      <AdminStatusBadge tone="neutral">
                        {t("operationsDashboard.attachmentLabel", "첨부")} {formatAdminDashboardCount(task.attachmentCount, t)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold pbp-text-primary sm:text-base">
                      {task.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium pbp-text-muted">
                      <span>
                        {t("operationsDashboard.factoryLabel", "공장")} : {task.factoryName}
                      </span>
                      <span>
                        {t("operationsDashboard.quantityLabel", "수량")} : {formatAdminDashboardQuantity(task, t)}
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
                className="flex min-h-[260px] items-center justify-center border-dashed text-center"
              />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
