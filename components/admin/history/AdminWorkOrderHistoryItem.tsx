"use client";

import { useState } from "react";
import { buildAdminHistoryItemViewModel } from "@/lib/admin/history/presentation";
import type { AdminHistoryEvent } from "@/lib/admin/history/types";

type AdminWorkOrderHistoryItemProps = {
  item: AdminHistoryEvent;
};

export default function AdminWorkOrderHistoryItem({ item }: AdminWorkOrderHistoryItemProps) {
  const [open, setOpen] = useState(false);
  const viewModel = buildAdminHistoryItemViewModel(item, open);

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <button
        type="button"
        onClick={() => viewModel.hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${viewModel.hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${viewModel.actionToneClass}`}>
            {viewModel.action}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{viewModel.time}</span>
            {viewModel.detailToggleLabel ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">
                {viewModel.detailToggleLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-2 break-words text-sm text-stone-700">{viewModel.summary}</div>
      </button>

      {viewModel.hasDetails && open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {viewModel.transition ? (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {viewModel.transition.from} <span className="px-1 text-stone-400">→</span> {viewModel.transition.to}
            </div>
          ) : null}
          {viewModel.detailLines.map((detail) => (
            <div key={detail.key} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
              <span>
                {detail.label ? <span className="font-medium text-stone-900">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
