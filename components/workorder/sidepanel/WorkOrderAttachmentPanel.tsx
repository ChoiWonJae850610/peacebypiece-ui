"use client";

import { useState, type DragEvent } from "react";
import WorkOrderPanelCard from "@/components/common/ui/WorkOrderPanelCard";
import { DeleteButton } from "@/components/workorder/detail/shared/detailEditorShared";
import { useI18n } from "@/lib/i18n";
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
  isMobile,
  disabled = false,
  disabledReason,
}: {
  scope: AttachmentPanelScope;
  addButtonLabel: string;
  onOpenAttachmentPicker: () => void;
  onOpenDrawingPlaceholder: () => void;
  isMobile: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const [open, setOpen] = useState(false);
  const canShowDrawingAction = scope === "design";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen((value) => !value); }}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className="pbp-interactive-button inline-flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 bg-white text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={ui.attachmentPanel.actionMenuAria}
        aria-expanded={open}
      >
        ···
      </button>
      {open ? (
        <div className={`absolute right-0 z-30 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 text-sm shadow-lg ${isMobile ? "top-8" : "top-8"}`}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (!disabled) onOpenAttachmentPicker();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-stone-800 hover:bg-stone-50 active:bg-stone-100"
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
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-stone-800 hover:bg-stone-50 active:bg-stone-100"
              title={ui.attachmentPanel.drawingActionPending}
            >
              <span aria-hidden="true">✎</span>
              <span>{ui.attachmentPanel.drawingAction}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DrawingPlaceholderModal({ onClose }: { onClose: () => void }) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui.attachmentPanel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4" role="dialog" aria-modal="true" aria-labelledby="workorder-drawing-placeholder-title">
      <div className="w-full max-w-md rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id="workorder-drawing-placeholder-title" className="text-base font-semibold text-stone-950">{ui.drawingPlaceholderTitle}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{ui.drawingPlaceholderDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pbp-interactive-button inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-700 hover:bg-stone-50"
            aria-label={ui.drawingPlaceholderClose}
          >
            ×
          </button>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-6 text-stone-600">
          {ui.drawingPlaceholderPlan}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="pbp-interactive-button rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
          >
            {ui.drawingPlaceholderConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentUploadHint({
  scope,
  canManageAttachments,
  onOpenAttachmentPicker,
  onUploadFiles,
  compact,
  disabled = false,
  disabledReason,
}: {
  scope: AttachmentPanelScope;
  canManageAttachments: boolean;
  onOpenAttachmentPicker: () => void;
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
      className={`mt-3 w-full rounded-2xl border border-dashed text-left transition-colors active:bg-stone-100 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
        dragActive
          ? "border-stone-500 bg-white shadow-sm"
          : "border-stone-300 bg-stone-50 hover:border-stone-400 hover:bg-white"
      } ${compact ? "px-3 py-3" : "px-4 py-3.5"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base text-stone-700 shadow-sm ${dragActive ? "ring-2 ring-stone-300" : ""}`}>＋</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-stone-900">{title}</span>
          <span className="mt-0.5 block text-xs leading-4 text-stone-500">{description}</span>
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
  const [drawingPlaceholderOpen, setDrawingPlaceholderOpen] = useState(false);

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
      className={panelDragActive ? "rounded-[1.75rem] ring-2 ring-stone-300" : undefined}
    >
      <WorkOrderPanelCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        </div>
        {canManageAttachments ? (
          <AttachmentActionMenu
            scope={uploadScope}
            addButtonLabel={addButtonLabel}
            onOpenAttachmentPicker={onOpenAttachmentPicker}
            onOpenDrawingPlaceholder={() => setDrawingPlaceholderOpen(true)}
            isMobile={isMobile}
            disabled={writeLocked}
            disabledReason={writeLockMessage}
          />
        ) : null}
      </div>
      {attachments.length > 0 ? (
        <div className={isMobile ? "mt-2.5 space-y-1.5" : "mt-2.5 space-y-2"}>
          {attachments.map((attachment) => (
            <div key={attachment.id} className={isMobile ? "relative rounded-2xl border border-stone-200 bg-stone-50 p-2.5 pr-10" : isTablet ? "relative rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-11" : "relative rounded-2xl border border-stone-200 bg-stone-50 p-3 pr-12"}>
              {attachment.canSetPrimary ? (
                <button
                  type="button"
                  onClick={() => handleSetPrimaryDesignAttachment(attachment.id)}
                  disabled={writeLocked}
                  className={`${isMobile ? "left-9 top-9 h-5 w-5 text-[11px]" : "left-11 top-11 h-6 w-6 text-xs"} absolute z-10 flex items-center justify-center rounded-full border font-bold shadow-sm ${attachment.isPrimary ? "border-amber-500 bg-amber-100 text-amber-900" : "border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-50"}`}
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
                className="flex w-full items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className={isMobile ? "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white" : "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white"}>
                  {attachment.type === "image" ? (
                    <img src={attachment.thumbnailUrl} alt={attachment.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-rose-700">{attachment.previewLabel}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={isMobile ? "truncate pr-1 text-[13px] font-medium text-stone-900" : "truncate pr-2 text-sm font-medium text-stone-900"}>{attachment.name}</div>
                  <div className={isMobile ? "mt-0.5 text-[11px] text-stone-500" : "mt-1 text-xs text-stone-500"}>{attachment.ownerLabel}</div>
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
          <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">{emptyText}</div>
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
    {drawingPlaceholderOpen ? <DrawingPlaceholderModal onClose={() => setDrawingPlaceholderOpen(false)} /> : null}
    </>
  );
}
