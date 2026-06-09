"use client";

import {
  ATTACHMENT_SCOPE,
  isDesignAttachmentScope,
  type UploadableAttachmentScopeValue,
} from "@/lib/constants/workorderIdentity";
import { useEffect, useRef, useState, type DragEvent } from "react";
import WorkOrderTldrawDrawingModal from "@/components/workorder/drawing/WorkOrderTldrawDrawingModal";
import {
  SectionCountBadge,
  WaflButton,
} from "@/components/common/ui";
import { WorkOrderAddIconButton, WorkOrderMoreIconButton, WorkOrderPlusIcon } from "@/components/workorder/common/WorkOrderIconButtons";
import { DeleteButton } from "@/components/workorder/detail/shared/detailEditorShared";
import { useI18n } from "@/lib/i18n";
import { RUNTIME_VISIBILITY } from "@/lib/runtime/runtimeMode";
import { WORK_ORDER_ATTACHMENT_POLICY } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import { isGeneratedOrderRequestPdfAttachment } from "@/lib/workorder/generatedDocuments";
import type { AttachmentPanelItem } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";

type AttachmentPanelScope = UploadableAttachmentScopeValue;

function readDroppedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.files ?? []).filter(
    (file) => file.size > 0,
  );
}

function hasDroppedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function getUploadGuideLabel(
  scope: AttachmentPanelScope,
  ui: ReturnType<typeof useI18n>["i18n"]["workorder"]["ui"],
) {
  return isDesignAttachmentScope(scope)
    ? ui.attachmentPanel.designUploadGuide
    : ui.attachmentPanel.attachmentUploadGuide;
}

function logAttachmentDropDebug(
  scope: AttachmentPanelScope,
  message: string,
  payload?: Record<string, unknown>,
) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[attachment-dnd:${scope}] ${message}`, payload ?? {});
}

function formatAttachmentCount(count: number, suffix: string) {
  return `${count}${suffix}`;
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
  trigger = "more",
}: {
  scope: AttachmentPanelScope;
  addButtonLabel: string;
  onOpenAttachmentPicker: () => void;
  onOpenDrawingPlaceholder: () => void;
  onOpenAdvancedDrawing: () => void;
  isMobile: boolean;
  disabled?: boolean;
  disabledReason?: string;
  trigger?: "more" | "plus";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canShowDrawingAction = isDesignAttachmentScope(scope);
  const canShowAdvancedDrawingAction =
    canShowDrawingAction && RUNTIME_VISIBILITY.showAdvancedDrawingTools;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      {trigger === "plus" ? (
        <WorkOrderAddIconButton
          label={addButtonLabel}
          size="md"
          onClick={() => {
            if (!disabled) setOpen((value) => !value);
          }}
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          aria-expanded={open}
        />
      ) : (
        <WorkOrderMoreIconButton
          label={ui.attachmentPanel.actionMenuAria}
          size={isMobile ? "lg" : "md"}
          onClick={() => {
            if (!disabled) setOpen((value) => !value);
          }}
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          aria-expanded={open}
        />
      )}
      {open ? (
        <div
          className={
            trigger === "plus"
              ? "pbp-card absolute bottom-full right-1/2 z-30 mb-2 min-w-[160px] translate-x-1/2 overflow-hidden rounded-[var(--pbp-radius-content-card)] p-1.5 text-sm"
              : "pbp-card absolute right-0 top-8 z-30 mt-2 min-w-[160px] overflow-hidden rounded-[var(--pbp-radius-content-card)] p-1.5 text-sm"
          }
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (!disabled) onOpenAttachmentPicker();
            }}
            className="pbp-interactive-button flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-surface-muted)] active:bg-[var(--pbp-surface-soft)]"
          >
            <WorkOrderPlusIcon className="h-3.5 w-3.5" />
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
  addButtonLabel,
  canManageAttachments,
  onOpenAttachmentPicker,
  onOpenDrawingPlaceholder,
  onOpenAdvancedDrawing,
  onUploadFiles,
  compact,
  isMobile,
  disabled = false,
  disabledReason,
}: {
  scope: AttachmentPanelScope;
  addButtonLabel: string;
  canManageAttachments: boolean;
  onOpenAttachmentPicker: () => void;
  onOpenDrawingPlaceholder: () => void;
  onOpenAdvancedDrawing: () => void;
  onUploadFiles: (files: File[]) => void;
  compact: boolean;
  isMobile: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const [dragActive, setDragActive] = useState(false);
  const title = dragActive
    ? ui.attachmentPanel.dropUploadGuide
    : getUploadGuideLabel(scope, ui);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (disabled || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (disabled || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const files = readDroppedFiles(event);
    logAttachmentDropDebug(scope, "drop on hint", {
      fileCount: files.length,
      fileNames: files.map((file) => file.name),
    });
    if (files.length === 0) return;
    onUploadFiles(files);
  };

  if (!canManageAttachments) return null;
  const isDesign = isDesignAttachmentScope(scope);

  return (
    <div
      title={disabled ? disabledReason : undefined}
      aria-disabled={disabled}
      onDragEnter={handleDragOver}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={title}
      className={`pbp-sidepanel-upload-zone pbp-interactive-button mt-3 flex w-full min-w-0 items-center justify-center rounded-[var(--pbp-radius-content-card)] border border-dashed active:bg-[var(--pbp-surface-soft)] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
        dragActive ? "pbp-sidepanel-upload-zone-active" : ""
      } ${compact ? "px-3 py-4" : "px-4 py-5"}`}
    >
      {isDesign ? (
        <AttachmentActionMenu
          scope={scope}
          addButtonLabel={addButtonLabel}
          onOpenAttachmentPicker={onOpenAttachmentPicker}
          onOpenDrawingPlaceholder={onOpenDrawingPlaceholder}
          onOpenAdvancedDrawing={onOpenAdvancedDrawing}
          isMobile={isMobile}
          disabled={disabled}
          disabledReason={disabledReason}
          trigger="plus"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!disabled) onOpenAttachmentPicker();
          }}
          disabled={disabled}
          title={disabled ? disabledReason : addButtonLabel}
          aria-label={addButtonLabel}
          className={`pbp-interactive-button pbp-sidepanel-preview-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45 ${dragActive ? "ring-2 ring-[var(--pbp-sidepanel-upload-active-border)]" : ""}`}
        >
          <WorkOrderPlusIcon />
        </button>
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}

function AttachmentFlatAddHint({
  scope,
  addButtonLabel,
  canManageAttachments,
  onOpenAttachmentPicker,
  onOpenDrawingPlaceholder,
  onOpenAdvancedDrawing,
  isMobile,
  disabled = false,
  disabledReason,
}: {
  scope: AttachmentPanelScope;
  addButtonLabel: string;
  canManageAttachments: boolean;
  onOpenAttachmentPicker: () => void;
  onOpenDrawingPlaceholder: () => void;
  onOpenAdvancedDrawing: () => void;
  isMobile: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  if (!canManageAttachments) return null;
  const isDesign = isDesignAttachmentScope(scope);

  return (
    <div className="flex min-h-[72px] w-full items-center justify-center rounded-[var(--pbp-radius-content-card)] border border-dashed border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)] px-4 py-4">
      {isDesign ? (
        <AttachmentActionMenu
          scope={scope}
          addButtonLabel={addButtonLabel}
          onOpenAttachmentPicker={onOpenAttachmentPicker}
          onOpenDrawingPlaceholder={onOpenDrawingPlaceholder}
          onOpenAdvancedDrawing={onOpenAdvancedDrawing}
          isMobile={isMobile}
          disabled={disabled}
          disabledReason={disabledReason}
          trigger="plus"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!disabled) onOpenAttachmentPicker();
          }}
          disabled={disabled}
          title={disabled ? disabledReason : addButtonLabel}
          aria-label={addButtonLabel}
          className="pbp-interactive-button pbp-sidepanel-preview-surface inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--pbp-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <WorkOrderPlusIcon />
        </button>
      )}
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
  canGenerateOrderRequestPdf = false,
  onGenerateOrderRequestPdf,
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
  canGenerateOrderRequestPdf?: boolean;
  onGenerateOrderRequestPdf?: () => void;
  writeLocked?: boolean;
  writeLockMessage?: string;
  variant?: "desktop" | "tablet" | "mobile";
}) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui;
  const attachmentPolicyText = WORK_ORDER_ATTACHMENT_POLICY.messages;
  const handleSetPrimaryDesignAttachment = (attachmentId: string) => {
    if (writeLocked || typeof onSetPrimaryDesignAttachment !== "function")
      return;
    onSetPrimaryDesignAttachment(attachmentId);
  };

  const [panelDragActive, setPanelDragActive] = useState(false);
  const [advancedDrawingModalOpen, setAdvancedDrawingModalOpen] =
    useState(false);
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
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    setPanelDragActive(false);
  };

  const handlePanelDrop = (event: DragEvent<HTMLDivElement>) => {
    if (writeLocked || !canManageAttachments || !hasDroppedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    setPanelDragActive(false);
    const files = readDroppedFiles(event);
    logAttachmentDropDebug(uploadScope, "drop on panel", {
      fileCount: files.length,
      fileNames: files.map((file) => file.name),
    });
    if (files.length === 0) return;
    onUploadFiles(files);
  };

  if (!canSeeAttachments) return null;

  const isMobile = variant === "mobile";
  const isTablet = variant === "tablet";
  const isFlatDevice = isMobile || isTablet;
  const isOfficialAttachmentScope = !isDesignAttachmentScope(uploadScope);
  const hasGeneratedOrderRequestPdf = attachments.some((attachment) =>
    isGeneratedOrderRequestPdfAttachment(attachment),
  );
  const showOrderRequestPdfStatus =
    isOfficialAttachmentScope && canGenerateOrderRequestPdf;
  const showGenerateOrderRequestPdfAction =
    showOrderRequestPdfStatus && !hasGeneratedOrderRequestPdf;

  return (
    <>
      <div
        onDragEnter={handlePanelDragOver}
        onDragOver={handlePanelDragOver}
        onDragLeave={handlePanelDragLeave}
        onDrop={handlePanelDrop}
        className={
          panelDragActive
            ? "rounded-[1.75rem] ring-2 ring-[var(--pbp-sidepanel-upload-active-border)]"
            : undefined
        }
      >
        <div className={isFlatDevice ? "min-w-0 space-y-2.5" : "rounded-[24px] p-4 pbp-card min-w-0"}>
          {!isFlatDevice ? (
          <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate text-sm font-semibold pbp-text-primary">
                {title}
              </h3>
              <SectionCountBadge>
                {formatAttachmentCount(
                  attachments.length,
                  ui.attachmentPanel.countSuffix,
                )}
              </SectionCountBadge>
            </div>

          </div>
          ) : null}
          {showOrderRequestPdfStatus ? (
            <div className="mt-3 rounded-[var(--pbp-radius-content-card)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-3 text-left">
              <div className="flex min-w-0 items-start gap-2">
                <span
                  className={`mt-0.5 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                    hasGeneratedOrderRequestPdf
                      ? "bg-[var(--pbp-status-success)]"
                      : "bg-[var(--pbp-warning)]"
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold pbp-text-primary">
                    {hasGeneratedOrderRequestPdf
                      ? ui.attachmentPanel.orderRequestPdfSavedTitle
                      : ui.attachmentPanel.orderRequestPdfMissingTitle}
                  </div>
                  <p className="mt-1 text-xs leading-5 pbp-text-muted">
                    {hasGeneratedOrderRequestPdf
                      ? ui.attachmentPanel.orderRequestPdfSavedDescription
                      : ui.attachmentPanel.orderRequestPdfMissingDescription}
                  </p>
                </div>
              </div>
              {showGenerateOrderRequestPdfAction ? (
                <WaflButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (!writeLocked) onGenerateOrderRequestPdf?.();
                  }}
                  disabled={
                    writeLocked ||
                    typeof onGenerateOrderRequestPdf !== "function"
                  }
                  title={
                    writeLocked
                      ? writeLockMessage
                      : ui.attachmentPanel.generateOrderRequestPdfButtonTitle
                  }
                  aria-label={
                    ui.attachmentPanel.generateOrderRequestPdfButtonAria
                  }
                  className="mt-3"
                >
                  {writeLocked ? (
                    <span
                      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>
                    {writeLocked && writeLockMessage
                      ? writeLockMessage
                      : ui.attachmentPanel.generateOrderRequestPdfButton}
                  </span>
                </WaflButton>
              ) : null}
            </div>
          ) : null}
          {attachments.length > 0 ? (
            <div
              className={
                isMobile
                  ? "mt-2.5 min-w-0 space-y-1.5"
                  : "mt-2.5 min-w-0 space-y-2"
              }
            >
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={
                    isMobile
                      ? "pbp-sidepanel-item pbp-interactive-card relative min-w-0 rounded-[var(--pbp-radius-content-card)] border p-2.5 pr-9"
                      : isTablet
                        ? "pbp-sidepanel-item pbp-interactive-card relative min-w-0 rounded-[var(--pbp-radius-content-card)] border p-3 pr-11"
                        : "pbp-sidepanel-item pbp-interactive-card relative min-w-0 rounded-[var(--pbp-radius-content-card)] border p-3 pr-12"
                  }
                >
                  {attachment.canSetPrimary ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleSetPrimaryDesignAttachment(attachment.id)
                      }
                      disabled={writeLocked}
                      className={`${isMobile ? "left-9 top-9 h-5 w-5 text-[11px]" : "left-11 top-11 h-6 w-6 text-xs"} absolute z-10 flex items-center justify-center rounded-full border font-bold ${attachment.isPrimary ? "border-[var(--pbp-warning)] bg-[var(--pbp-warning-soft)] text-[var(--pbp-warning)]" : "pbp-action-secondary"}`}
                      title={
                        writeLocked
                          ? writeLockMessage
                          : attachment.isPrimary
                            ? attachmentPolicyText.primaryTitle
                            : attachmentPolicyText.primaryActionTitle
                      }
                      aria-label={
                        attachment.isPrimary
                          ? `${attachment.name} ${attachmentPolicyText.primaryTitle}`
                          : `${attachment.name} ${attachmentPolicyText.primaryActionTitle}`
                      }
                    >
                      {attachment.isPrimary
                        ? attachmentPolicyText.primaryBadge
                        : attachmentPolicyText.primaryAction}
                    </button>
                  ) : null}
                  {attachment.canDelete ? (
                    <div className="absolute right-3 top-3">
                      <DeleteButton
                        onClick={() => {
                          if (!writeLocked) onDeleteAttachment(attachment.id);
                        }}
                        srLabel={`${attachment.name} ${ui.attachmentPanel.deleteAriaSuffix}`}
                        disabled={writeLocked}
                        title={
                          writeLocked
                            ? writeLockMessage
                            : ui.attachmentPanel.deleteTitle
                        }
                      />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onPreviewAttachment(attachment.id)}
                    disabled={!attachment.canPreview}
                    title={
                      attachment.canPreview
                        ? ui.attachmentPanel.previewTitle
                        : ui.attachmentPanel.previewUnavailableTitle
                    }
                    aria-label={`${attachment.name} ${attachment.canPreview ? ui.attachmentPanel.previewAriaSuffix : ui.attachmentPanel.previewUnavailableAriaSuffix}`}
                    className="flex w-full min-w-0 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3"
                  >
                    <div
                      className={
                        isMobile
                          ? "pbp-sidepanel-preview-surface flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                          : "pbp-sidepanel-preview-surface flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                      }
                    >
                      {attachment.type === "image" ? (
                        <img
                          src={attachment.thumbnailUrl}
                          alt={attachment.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-rose-700">
                          {attachment.previewLabel}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={
                          isMobile
                            ? "break-words pr-1 text-[13px] font-medium leading-4 pbp-text-primary"
                            : "truncate pr-2 text-sm font-medium pbp-text-primary"
                        }
                      >
                        {attachment.name}
                      </div>
                      <div
                        className={
                          isMobile
                            ? "mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 break-words text-[11px] leading-4 pbp-text-muted"
                            : "mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs pbp-text-muted"
                        }
                      >
                        <span>{attachment.ownerLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{attachment.previewLabel}</span>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
              {isFlatDevice ? (
                <AttachmentFlatAddHint
                  scope={uploadScope}
                  addButtonLabel={addButtonLabel}
                  canManageAttachments={canManageAttachments}
                  onOpenAttachmentPicker={onOpenAttachmentPicker}
                  onOpenDrawingPlaceholder={openDesignDrawingModal}
                  onOpenAdvancedDrawing={() => setAdvancedDrawingModalOpen(true)}
                  isMobile={isMobile}
                  disabled={writeLocked}
                  disabledReason={writeLockMessage}
                />
              ) : (
                <AttachmentUploadHint
                  scope={uploadScope}
                  addButtonLabel={addButtonLabel}
                  canManageAttachments={canManageAttachments}
                  onOpenAttachmentPicker={onOpenAttachmentPicker}
                  onOpenDrawingPlaceholder={openDesignDrawingModal}
                  onOpenAdvancedDrawing={() => setAdvancedDrawingModalOpen(true)}
                  onUploadFiles={onUploadFiles}
                  compact={isMobile || isTablet}
                  isMobile={isMobile}
                  disabled={writeLocked}
                  disabledReason={writeLockMessage}
                />
              )}
            </div>
          ) : (
            <div className={isFlatDevice ? "space-y-2.5" : undefined}>
              <div
                className={`pbp-empty-state min-w-0 whitespace-pre-line rounded-[var(--pbp-radius-content-card)] border border-dashed px-3 py-4 text-center text-xs leading-5 sm:px-4 sm:py-5 ${isFlatDevice ? "" : "mt-3"}`}
              >
                {emptyText}
              </div>
              {isFlatDevice ? (
                <AttachmentFlatAddHint
                  scope={uploadScope}
                  addButtonLabel={addButtonLabel}
                  canManageAttachments={canManageAttachments}
                  onOpenAttachmentPicker={onOpenAttachmentPicker}
                  onOpenDrawingPlaceholder={openDesignDrawingModal}
                  onOpenAdvancedDrawing={() => setAdvancedDrawingModalOpen(true)}
                  isMobile={isMobile}
                  disabled={writeLocked}
                  disabledReason={writeLockMessage}
                />
              ) : (
                <AttachmentUploadHint
                  scope={uploadScope}
                  addButtonLabel={addButtonLabel}
                  canManageAttachments={canManageAttachments}
                  onOpenAttachmentPicker={onOpenAttachmentPicker}
                  onOpenDrawingPlaceholder={openDesignDrawingModal}
                  onOpenAdvancedDrawing={() => setAdvancedDrawingModalOpen(true)}
                  onUploadFiles={onUploadFiles}
                  compact={isMobile || isTablet}
                  isMobile={isMobile}
                  disabled={writeLocked}
                  disabledReason={writeLockMessage}
                />
              )}
            </div>
          )}
        </div>
      </div>
      {isDesignAttachmentScope(uploadScope) ? (
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
