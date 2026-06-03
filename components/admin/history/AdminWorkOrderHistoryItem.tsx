"use client";

import { useState } from "react";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import type { AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { useI18n } from "@/lib/i18n";
import { buildAdminHistoryItemViewModel } from "@/lib/admin/history/presentation";
import type { AdminHistoryEvent } from "@/lib/admin/history/types";

type AdminWorkOrderHistoryItemProps = {
  item: AdminHistoryEvent;
};

function getHistoryTone(tone: AdminHistoryEvent["tone"]): AdminStatusBadgeTone {
  if (tone === "emerald") return "success";
  if (tone === "rose") return "danger";
  if (tone === "amber") return "warning";
  if (tone === "blue") return "info";
  if (tone === "violet") return "primary";
  return "neutral";
}

export default function AdminWorkOrderHistoryItem({ item }: AdminWorkOrderHistoryItemProps) {
  const [open, setOpen] = useState(false);
  const { i18n } = useI18n();
  const viewModel = buildAdminHistoryItemViewModel(item, open, i18n.admin);

  return (
    <div className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
      <button
        type="button"
        onClick={() => viewModel.hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${viewModel.hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <AdminStatusBadge tone={getHistoryTone(item.tone)}>
            {viewModel.action}
          </AdminStatusBadge>
          <div className="flex items-center gap-2 text-[11px] text-[var(--pbp-text-muted)]">
            <span>{viewModel.time}</span>
            {viewModel.detailToggleLabel ? (
              <AdminStatusBadge tone="neutral" size="xs">
                {viewModel.detailToggleLabel}
              </AdminStatusBadge>
            ) : null}
          </div>
        </div>
        <div className="mt-2 break-words text-sm text-[var(--pbp-text-secondary)]">{viewModel.summary}</div>
      </button>

      {viewModel.hasDetails && open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 text-xs text-[var(--pbp-text-secondary)]">
          {viewModel.transition ? (
            <div className="rounded-lg bg-[var(--pbp-surface-muted)] px-3 py-2 font-medium text-[var(--pbp-text-primary)]">
              <AdminStatusBadge tone="neutral" size="xs">{viewModel.transition.from}</AdminStatusBadge>
              <span className="px-2 text-[var(--pbp-text-subtle)]">→</span>
              <AdminStatusBadge tone="info" size="xs">{viewModel.transition.to}</AdminStatusBadge>
            </div>
          ) : null}
          {viewModel.detailLines.map((detail) => (
            <div key={detail.key} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pbp-text-subtle)]" />
              <span>
                {detail.label ? <span className="font-medium text-[var(--pbp-text-primary)]">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
