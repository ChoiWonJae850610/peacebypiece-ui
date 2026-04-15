"use client";

import { useState } from "react";
import { HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { useI18n } from "@/lib/i18n";
import type { HistoryLog } from "@/types/workorder";

type AdminPanelHistoryPreviewItemProps = {
  item: HistoryLog;
};

export default function AdminPanelHistoryPreviewItem({ item }: AdminPanelHistoryPreviewItemProps) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;
  const common = ui.common;
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${HISTORY_TONE_CLASS[item.tone]}`}>
            {item.action}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>{item.time}</span>
            {hasDetails ? (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600">
                {open ? common.collapse : common.detail}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-2 break-words text-sm text-stone-700">{item.summary}</div>
      </button>

      {hasDetails && open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-700">
          {item.transition ? (
            <div className="rounded-lg bg-stone-50 px-3 py-2 font-medium text-stone-800">
              {item.transition.from} <span className="px-1 text-stone-400">→</span> {item.transition.to}
            </div>
          ) : null}
          {item.detailLines?.map((detail, index) => (
            <div key={`${item.id}-detail-${index}`} className="flex items-start gap-2 leading-5">
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
