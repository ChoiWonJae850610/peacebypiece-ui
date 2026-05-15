"use client";

import { useState, type DragEvent } from "react";
import WorkOrderTldrawDrawingModal from "@/components/workorder/drawing/WorkOrderTldrawDrawingModal";
import WorkOrderPanelCard from "@/components/common/ui/WorkOrderPanelCard";
import { DeleteButton } from "@/components/workorder/detail/shared/detailEditorShared";
import { useI18n } from "@/lib/i18n";
import { RUNTIME_VISIBILITY } from "@/lib/runtime/runtimeMode";
import { WORK_ORDER_ATTACHMENT_POLICY } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import type { AttachmentPanelItem } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";

type AttachmentPanelScope = "design" | "attachment";

function readDroppedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.files ?? []).filter((file) => file.size > 0);
}

function hasDroppedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function getUploadGuideLabel(scope: AttachmentPanelScope, ui: ReturnType<typeof useI18n>["i18n"]["workorder"]["ui"]) {
  return scope === "design" ? ui.attachmentPanel.designUploadGuide : ui.attachmentPanel.attachmentUploadGuide;
}

function getUploadGuideDescription(scope: AttachmentPanelScope, ui: ReturnType<typeof useI18n>["i18n"]["workorder"]["ui"]) {
  return scope === "design" ? ui.attachmentPanel.designUploadGuideDescription : ui.attachmentPanel.attachmentUploadGuideDescription;
}

function logAttachmentDropDebug(scope: AttachmentPanelScope, message: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[attachment-dnd:${scope}] ${message}`, payload ?? {});
}


function AttachmentActionMenu({
  scope,
  addButtonLabel,
  onOpenAttachmentPicker,
  onOpenDrawingPlaceholder,
  onOpenAdvancedDrawing,
  isMobile,
  disabled = false,
  disabledReason,
}: {
  scope: AttachmentPanelScope;
  addButtonLabel: string;
  onOpenAttachmentPicker: () => void;
  onOpenDrawingPlaceholder: () => void;
  onOpenAdvancedDrawing: () => void;
  isMobile: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const [open, setOpen] = useState(false);
  const canShowDrawingAction = scope === "design";
  const canShowAdvancedDrawingAction = canShowDrawingAction && RUNTIME_VISIBILITY.showAdvancedDrawingTools;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen((value) => !value); }}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className="pbp-interactive-button pbp-action-secondary inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={ui.attachmentPanel.actionMenuAria}
        aria-expanded={open}
      >
        ···
      </button>
      {open ? (
        <div className={`pbp-card absolute right-0 z-30 mt-2 min-w-[160px] overflow-hidden rounded-2xl p-1.5 text-sm shadow-lg ${isMobile ? "top-8" : "top-8"}`}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (!disabled) onOpenAttachmentPicker();
            }}
            className="pbp-interactive-button flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-surface-muted)] active:bg-[var(--pbp-surface-soft)]"
          >
            <span aria-hidden="true">＋</span>
            <span>{addButtonLabel}</span>
          </button>
          {canShowDrawingAction ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenDrawingPlaceholder();
              }}
              className="pbp-interactive-button flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-surface-muted)] active:bg-[var(--pbp-surface-soft)]"
              title={ui.attachmentPanel.drawingActionPending}
            >
              <span aria-hidden="true">✎</span>
              <span>{ui.attachmentPanel.drawingAction}</span>
            </button>
          ) : null}
          {canShowAdvancedDrawingAction ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenAdvancedDrawing();
              }}
              className="pbp-interactive-button flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-surface-muted)] active:bg-[var(--pbp-surface-soft)]"
              title={ui.attachmentPanel.advancedDrawingActionPending}
            >
              <span aria-hidden="true">✦</span>
              <span>{ui.attachmentPanel.advancedDrawingAction}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function AttachmentUploadHint({
  scope,
  canManageAttachments,
  onOpenAttachmentPicker,
  onOpenDesignDrawingModal,
  onUploadFiles,
  compact,
  disabled = false,
  disabledReason,
}: {
  scope: AttachmentPanelScope;
  canManageAttachments: boolean;
  onOpenAttachmentPicker: () => void;
  onOpenDesignDrawingModal?: () => void;
  onUploadFiles: (files: File[]) => void;
  compact: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const [dragActive, setDragActive] = useState(false);
  const title = dragActive ? ui.attachmentPanel.dropUploadGuide : getUploadGuideLabel(scope, ui);
  const description = dragActive ? ui.attachmentPanel.dropUploadGuideDescription : getUploadGuideDescription(scope, ui);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (disabled || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const files = readDroppedFiles(event);
    logAttachmentDropDebug(scope, "drop on hint", { fileCount: files.length, fileNames: files.map((file) => file.name) });
    if (files.length === 0) return;
    onUploadFiles(files);
  };

  if (!canManageAttachments) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (!disabled) onOpenAttachmentPicker(); }}
      title={disabled ? disabledReason : undefined}
      aria-disabled={disabled}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!disabled) onOpenAttachmentPicker();
        }
      }}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`pbp-sidepanel-upload-zone pbp-interactive-button mt-3 w-full min-w-0 rounded-2xl border border-dashed text-left active:bg-[var(--pbp-surface-soft)] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
        dragActive ? "pbp-sidepanel-upload-zone-active shadow-sm" : ""
      } ${compact ? "px-3 py-3" : "px-4 py-3.5"}`}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className={`pbp-sidepanel-preview-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base text-[var(--pbp-text-muted)] shadow-sm ${dragActive ? "ring-2 ring-[var(--pbp-sidepanel-upload-active-border)]" : ""}`}>＋</span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-[13px] font-semibold pbp-text-primary">{title}</span>
          <span className="mt-0.5 block break-words text-xs leading-4 pbp-text-muted">{description}</span>
        </span>
      </div>
    </div>
  );
}

export default function WorkOrderAttachmentPanel({
  title,
  addButtonLabel,
  emptyText,
  canSeeAttachments,
  canManageAttachments,
  attachments,
  uploadScope,
  onOpenAttachmentPicker,
  onOpenDesignDrawingModal,
  onUploadFiles,
  onPreviewAttachment,
  onDeleteAttachment,
  onSetPrimaryDesignAttachment,
  writeLocked = false,
  writeLockMessage,
  variant = "desktop",
}: {
  title: string;
  addButtonLabel: string;
  emptyText: string;
  canSeeAttachments: boolean;
  canManageAttachments: boolean;
  attachments: AttachmentPanelItem[];
  uploadScope: AttachmentPanelScope;
  onOpenAttachmentPicker: () => void;
  onOpenDesignDrawingModal?: () => void;
  onUploadFiles: (files: File[]) => void;
  onPreviewAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onSetPrimaryDesignAttachment?: (attachmentId: string) => void;
  writeLocked?: boolean;
  writeLockMessage?: string;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const attachmentPolicyText = WORK_ORDER_ATTACHMENT_POLICY.messages;
  const handleSetPrimaryDesignAttachment = (attachmentId: string) => {
    if (writeLocked || typeof onSetPrimaryDesignAttachment !== "function") return;
    onSetPrimaryDesignAttachment(attachmentId);
  };

  const [panelDragActive, setPanelDragActive] = useState(false);
  const [advancedDrawingModalOpen, setAdvancedDrawingModalOpen] = useState(false);
  const openDesignDrawingModal = () => {
    onOpenDesignDrawingModal?.();
  };

  const handlePanelDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (writeLocked || !canManageAttachments || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setPanelDragActive(true);
  };

  const handlePanelDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setPanelDragActive(false);
  };

  const handlePanelDrop = (event: DragEvent<HTMLDivElement>) => {
    if (writeLocked || !canManageAttachments || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setPanelDragActive(false);
    const files = readDroppedFiles(event);
    logAttachmentDropDebug(uploadScope, "drop on panel", { fileCount: files.length, fileNames: files.map((file) => file.name) });
    if (files.length === 0) return;
    onUploadFiles(files);
  };

  if (!canSeeAttachments) return null;

  const isMobile = variant === "mobile";
  const isTablet = variant === "tablet";

  return (
    <>
    <div
      onDragEnter={handlePanelDragOver}
      onDragOver={handlePanelDragOver}
      onDragLeave={handlePanelDragLeave}
      onDrop={handlePanelDrop}
      className={panelDragActive ? "rounded-[1.75rem] ring-2 ring-[var(--pbp-sidepanel-upload-active-border)]" : undefined}
    >
      <WorkOrderPanelCard className={isMobile ? "min-w-0 p-3" : "min-w-0"}>
      <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div>
          <h3 className="text-sm font-semibold pbp-text-primary">{title}</h3>
        </div>
        {canManageAttachments ? (
          <AttachmentActionMenu
            scope={uploadScope}
            addButtonLabel={addButtonLabel}
            onOpenAttachmentPicker={onOpenAttachmentPicker}
            onOpenDrawingPlaceholder={openDesignDrawingModal}
            onOpenAdvancedDrawing={() => setAdvancedDrawingModalOpen(true)}
            isMobile={isMobile}
            disabled={writeLocked}
            disabledReason={writeLockMessage}
          />
        ) : null}
      </div>
      {attachments.length > 0 ? (
        <div className={isMobile ? "mt-2.5 min-w-0 space-y-1.5" : "mt-2.5 min-w-0 space-y-2"}>
          {attachments.map((attachment) => (
            <div key={attachment.id} className={isMobile ? "pbp-sidepanel-item pbp-interactive-card relative min-w-0 rounded-2xl border p-2.5 pr-9" : isTablet ? "pbp-sidepanel-item pbp-interactive-card relative min-w-0 rounded-2xl border p-3 pr-11" : "pbp-sidepanel-item pbp-interactive-card relative min-w-0 rounded-2xl border p-3 pr-12"}>
              {attachment.canSetPrimary ? (
                <button
                  type="button"
                  onClick={() => handleSetPrimaryDesignAttachment(attachment.id)}
                  disabled={writeLocked}
                  className={`${isMobile ? "left-9 top-9 h-5 w-5 text-[11px]" : "left-11 top-11 h-6 w-6 text-xs"} absolute z-10 flex items-center justify-center rounded-full border font-bold shadow-sm ${attachment.isPrimary ? "border-[var(--pbp-warning)] bg-[var(--pbp-warning-soft)] text-[var(--pbp-warning)]" : "pbp-action-secondary"}`}
                  title={writeLocked ? writeLockMessage : attachment.isPrimary ? attachmentPolicyText.primaryTitle : attachmentPolicyText.primaryActionTitle}
                  aria-label={attachment.isPrimary ? `${attachment.name} ${attachmentPolicyText.primaryTitle}` : `${attachment.name} ${attachmentPolicyText.primaryActionTitle}`}
                >
                  {attachment.isPrimary ? attachmentPolicyText.primaryBadge : attachmentPolicyText.primaryAction}
                </button>
              ) : null}
              {attachment.canDelete ? (
                <div className="absolute right-3 top-3">
                  <DeleteButton
                    onClick={() => { if (!writeLocked) onDeleteAttachment(attachment.id); }}
                    srLabel={`${attachment.name} ${ui.attachmentPanel.deleteAriaSuffix}`}
                    disabled={writeLocked}
                    title={writeLocked ? writeLockMessage : ui.attachmentPanel.deleteTitle}
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onPreviewAttachment(attachment.id)}
                disabled={!attachment.canPreview}
                className="flex w-full min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3"
              >
                <div className={isMobile ? "pbp-sidepanel-preview-surface flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl" : "pbp-sidepanel-preview-surface flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"}>
                  {attachment.type === "image" ? (
                    <img src={attachment.thumbnailUrl} alt={attachment.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-rose-700">{attachment.previewLabel}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={isMobile ? "break-words pr-1 text-[13px] font-medium leading-4 pbp-text-primary" : "truncate pr-2 text-sm font-medium pbp-text-primary"}>{attachment.name}</div>
                  <div className={isMobile ? "mt-0.5 break-words text-[11px] leading-4 pbp-text-muted" : "mt-1 text-xs pbp-text-muted"}>{attachment.ownerLabel}</div>
                </div>
              </button>
            </div>
          ))}
          <AttachmentUploadHint
            scope={uploadScope}
            canManageAttachments={canManageAttachments}
            onOpenAttachmentPicker={onOpenAttachmentPicker}
            onUploadFiles={onUploadFiles}
            compact={isMobile || isTablet}
            disabled={writeLocked}
            disabledReason={writeLockMessage}
          />
        </div>
      ) : (
        <div>
          <div className="pbp-empty-state mt-3 min-w-0 rounded-2xl border border-dashed px-3 py-5 text-center text-sm sm:px-4 sm:py-6">{emptyText}</div>
          <AttachmentUploadHint
            scope={uploadScope}
            canManageAttachments={canManageAttachments}
            onOpenAttachmentPicker={onOpenAttachmentPicker}
            onUploadFiles={onUploadFiles}
            compact={isMobile || isTablet}
            disabled={writeLocked}
            disabledReason={writeLockMessage}
          />
        </div>
      )}
      </WorkOrderPanelCard>
    </div>
    {uploadScope === "design" ? (
      <>
        {RUNTIME_VISIBILITY.showAdvancedDrawingTools ? (
          <WorkOrderTldrawDrawingModal
            open={advancedDrawingModalOpen}
            onClose={() => setAdvancedDrawingModalOpen(false)}
            onSaveDrawing={(file) => onUploadFiles([file])}
            variant={variant}
          />
        ) : null}
      </>
    ) : null}
    </>
  );
}
