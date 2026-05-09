"use client";

import { useState } from "react";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";
import { WORKORDER_STAGE_STEPS, getWorkOrderStageIndex } from "@/components/admin/files/fileTrashSectionRows";

export const TRASH_ACTION_BUTTON_BASE =
  "rounded-full border px-3 py-1.5 text-xs font-semibold transition";
export const TRASH_ACTION_BUTTON_NEUTRAL_ENABLED =
  "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50";
export const TRASH_ACTION_BUTTON_DANGER_ENABLED =
  "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50";
export const TRASH_ACTION_BUTTON_DANGER_SOLID_ENABLED =
  "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700";
export const TRASH_ACTION_BUTTON_DISABLED =
  "border-stone-200 bg-stone-50 text-stone-400";

export function getTrashActionButtonClassName(
  isEnabled: boolean,
  tone: "neutral" | "danger" | "dangerSolid" = "neutral",
): string {
  if (!isEnabled) return `${TRASH_ACTION_BUTTON_BASE} ${TRASH_ACTION_BUTTON_DISABLED}`;
  if (tone === "dangerSolid")
    return `${TRASH_ACTION_BUTTON_BASE} ${TRASH_ACTION_BUTTON_DANGER_SOLID_ENABLED}`;
  if (tone === "danger")
    return `${TRASH_ACTION_BUTTON_BASE} ${TRASH_ACTION_BUTTON_DANGER_ENABLED}`;
  return `${TRASH_ACTION_BUTTON_BASE} ${TRASH_ACTION_BUTTON_NEUTRAL_ENABLED}`;
}

type AdminT = ReturnType<typeof useAdminTranslation>;


export function getLocalizedWorkOrderStageLabel(
  statusLabel: string,
  t: AdminT,
): string {
  const normalized = statusLabel.trim().toLowerCase();
  const matched = WORKORDER_STAGE_STEPS.find((step) =>
    step.keys.some((key) => key.toLowerCase() === normalized),
  );
  return matched ? t(`filesList.workorderStage.steps.${matched.key}`, matched.label) : statusLabel;
}

export function formatTrashDetailCountLabel(
  rawLabel: string,
  kind: "documentsDesigns" | "memos",
  t: AdminT,
): string {
  const count = Number(rawLabel.match(/\d+/)?.[0] ?? 0);
  const key = kind === "memos" ? "filesList.detail.memoCount" : "filesList.detail.documentDesignCount";
  const fallback = formatAdminTermCount(t, count, kind === "memos" ? "memo" : "documentDesign");
  return t(key, fallback, { count });
}

export function WorkOrderStageInline({
  statusLabel,
  t,
}: {
  statusLabel: string;
  t: AdminT;
}) {
  const currentIndex = getWorkOrderStageIndex(statusLabel);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
            {t("filesList.workorderStage.currentStage", "현재 단계")}
          </p>
          <p className="mt-1 text-sm font-medium text-stone-700">
            {getLocalizedWorkOrderStageLabel(statusLabel, t)}
          </p>
        </div>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">
          {t("filesList.workorderStage.deletedAtStage", "삭제 당시")}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-5 items-start gap-1.5">
        {WORKORDER_STAGE_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isPassed = index < currentIndex;
          return (
            <div key={step.label} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${
                  isActive
                    ? "bg-stone-950"
                    : isPassed
                      ? "bg-stone-400"
                      : "bg-stone-200"
                }`}
              />
              <p
                className={`mt-1 truncate text-center text-[10px] font-medium ${
                  isActive ? "text-stone-800" : "text-stone-400"
                }`}
                title={t(`filesList.workorderStage.steps.${step.key}`, step.label)}
              >
                {t(`filesList.workorderStage.steps.${step.key}`, step.label)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrashItemVisual({
  label,
  tone,
  compact = false,
  thumbnailUrl,
  previewFailedLabel,
}: {
  label: string;
  tone: "workorder" | "image" | "pdf" | "file";
  compact?: boolean;
  thumbnailUrl?: string | null;
  previewFailedLabel?: string;
}) {
  const [hasPreviewError, setHasPreviewError] = useState(false);
  const sizeClass = compact ? "h-7 w-7 text-[8px]" : "h-10 w-10 text-[9px]";
  const toneClass =
    tone === "workorder"
      ? "border-stone-300 bg-stone-900 text-white"
      : tone === "image"
        ? "border-purple-100 bg-purple-50 text-purple-700"
        : tone === "pdf"
          ? "border-red-100 bg-red-50 text-red-600"
          : "border-stone-200 bg-stone-50 text-stone-600";

  if (tone === "image" && thumbnailUrl && !hasPreviewError) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50 ${sizeClass} shadow-sm`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setHasPreviewError(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl border ${toneClass} ${sizeClass} font-medium shadow-sm`}
      aria-hidden="true"
      title={hasPreviewError ? previewFailedLabel : undefined}
    >
      {label}
    </span>
  );
}
