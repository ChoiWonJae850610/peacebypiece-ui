"use client";

import { useState } from "react";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";
import { WORKORDER_STAGE_STEPS, getWorkOrderStageIndex } from "@/lib/admin/files/trashTablePresentation";
import {
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_SUBTLE_BOX_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { getWaflActionButtonClassName, type WaflActionButtonTone } from "@/components/common/ui";

type TrashActionTone = "neutral" | "danger" | "dangerSolid";

function mapTrashActionTone(tone: TrashActionTone): WaflActionButtonTone {
  if (tone === "dangerSolid") return "danger";
  if (tone === "danger") return "dangerSoft";
  return "neutral";
}

export function getTrashActionButtonClassName(
  isEnabled: boolean,
  tone: TrashActionTone = "neutral",
): string {
  return getWaflActionButtonClassName({
    tone: mapTrashActionTone(tone),
    compact: true,
    className: isEnabled
      ? ""
      : "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-subtle)]",
  });
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
    <div className={`${ADMIN_STORAGE_SUBTLE_BOX_CLASS} px-4 py-3`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] font-medium uppercase tracking-[0.12em]`}>
            {t("filesList.workorderStage.currentStage", "현재 단계")}
          </p>
          <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} mt-1 text-sm font-medium`}>
            {getLocalizedWorkOrderStageLabel(statusLabel, t)}
          </p>
        </div>
        <span className="rounded-full bg-[var(--pbp-surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--pbp-text-muted)]">
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
                    ? "bg-[var(--pbp-action-primary-surface)]"
                    : isPassed
                      ? "bg-[var(--pbp-border-strong)]"
                      : "bg-[var(--pbp-border)]"
                }`}
              />
              <p
                className={`mt-1 truncate text-center text-[10px] font-medium ${
                  isActive ? "text-[var(--pbp-text-primary)]" : "text-[var(--pbp-text-subtle)]"
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
      ? "border-[var(--pbp-action-primary-surface)] bg-[var(--pbp-action-primary-surface)] text-[var(--pbp-action-primary-text)]"
      : tone === "image"
        ? "border-[var(--pbp-accent-border)] bg-[var(--pbp-accent-soft)] text-[var(--pbp-accent)]"
        : tone === "pdf"
          ? "border-[var(--pbp-action-danger-soft-border)] bg-[var(--pbp-action-danger-soft-surface)] text-[var(--pbp-action-danger-soft-text)]"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]";

  if (tone === "image" && thumbnailUrl && !hasPreviewError) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] ${sizeClass} shadow-sm`}
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
