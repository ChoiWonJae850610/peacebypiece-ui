"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { getWaflButtonClassName } from "@/components/common/ui";
import { WaflSurface, WaflSurfaceButton } from "@/components/common/ui/WaflSurface";
import type {
  AdminDashboardQueueId,
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

type Props = { snapshots: AdminOperationalDashboardSnapshots };

function queueTitle(queueId: AdminDashboardQueueId, fallback: string, t: ReturnType<typeof useAdminTranslation>) {
  return t(`operationsDashboard.queues.${queueId}.title`, fallback);
}

function taskTone(task: AdminDashboardTodayTask): "danger" | "warning" | "neutral" {
  if (task.dueKey === "overdue") return "danger";
  if (task.dueKey === "today" || task.priorityKey === "review") return "warning";
  return "neutral";
}

export default function AdminOperationsDashboard({ snapshots }: Props) {
  const t = useAdminTranslation();
  const snapshot = snapshots.today;
  const [selectedQueueId, setSelectedQueueId] = useState<AdminDashboardQueueId>(
    ADMIN_DASHBOARD_DEFAULT_QUEUE_ID,
  );
  const insights = useMemo(
    () => new Map(snapshot.insights.map((item) => [item.id, item])),
    [snapshot.insights],
  );
  const selectedTasks = useMemo(
    () => selectAdminDashboardQueueTasks(snapshot, selectedQueueId),
    [snapshot, selectedQueueId],
  );
  const selectedInsight = insights.get(selectedQueueId);

  if (snapshot.sourceState === "error") {
    return (
      <AdminEmptyState
        title="업무 현황을 불러오지 못했습니다."
        description="잠시 후 새로고침하거나 데이터베이스 연결 상태를 확인해주세요."
      />
    );
  }

  return (
    <WaflSurface as="section" component="admin-operations-dashboard" className="overflow-hidden">
      <div className="border-b border-[var(--pbp-border)] p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">오늘의 업무</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight pbp-text-primary">처리가 필요한 항목</h2>
            <p className="mt-1 text-sm pbp-text-muted">작업지시서 검토와 자재 발주 흐름을 한곳에서 확인합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={getWaflButtonClassName({ size: "sm", variant: "secondary" })} href="/workspace/workorders">작업지시서</Link>
            <Link className={getWaflButtonClassName({ size: "sm", variant: "secondary" })} href="/workspace/material-orders">원단·부자재 발주</Link>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {ADMIN_DASHBOARD_QUEUE_ORDER.map((queueId) => {
            const item = insights.get(queueId);
            if (!item) return null;
            const active = queueId === selectedQueueId;
            return (
              <WaflSurfaceButton
                key={queueId}
                component="admin-dashboard-queue-card"
                selected={active}
                type="button"
                onClick={() => setSelectedQueueId(queueId)}
                aria-pressed={active}
                className="min-h-0 p-3 text-left sm:p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold pbp-text-primary">{item.label}</span>
                  <strong className="text-2xl tracking-tight pbp-text-primary">{item.value}</strong>
                </div>
                <p className="mt-1 line-clamp-1 text-xs pbp-text-muted">{item.description}</p>
              </WaflSurfaceButton>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold pbp-text-primary">
              {queueTitle(selectedQueueId, selectedInsight?.label ?? "대기 목록", t)}
            </h3>
            <p className="mt-0.5 text-xs pbp-text-muted">{formatAdminDashboardCount(selectedTasks.length, t)}</p>
          </div>
          <Link className="text-sm font-semibold text-[var(--pbp-brand-primary)]" href="/workspace/workorders">전체 보기 →</Link>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="mt-3 rounded-[var(--pbp-radius-wafl)] border border-dashed border-[var(--pbp-border)] px-4 py-8 text-center text-sm pbp-text-muted">
            현재 처리할 항목이 없습니다.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-[var(--pbp-border)] overflow-hidden rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-base)]">
            {selectedTasks.slice(0, 8).map((task) => (
              <Link
                key={task.id}
                href={task.actionHref}
                className="grid gap-2 px-3 py-3 transition hover:bg-[var(--pbp-surface-soft)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold pbp-text-primary">{task.title}</span>
                    {task.dueKey === "overdue" || task.dueKey === "today" ? (
                      <AdminStatusBadge tone={taskTone(task)}>{formatAdminDashboardDue(task, t)}</AdminStatusBadge>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs pbp-text-muted">
                    <span>{task.statusLabel}</span>
                    <span>{task.factoryName}</span>
                    <span>{formatAdminDashboardQuantity(task, t)}</span>
                    {task.dueKey !== "overdue" && task.dueKey !== "today" ? <span>{formatAdminDashboardDue(task, t)}</span> : null}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--pbp-brand-primary)]">열기</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </WaflSurface>
  );
}
