"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M13.9 2.6a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1l-8.8 8.8-3.6.7.7-3.6 8.2-8.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12.5 4 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="m7.5 4.5 5 5.5-5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MobileSummaryAction({
  label,
  value,
  disabled,
  onClick,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const { i18n } = useI18n();
  const canAct = !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pbp-interactive-button pbp-detail-summary-action flex min-w-0 items-center gap-3 rounded-2xl border px-3.5 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${
        canAct ? "shadow-sm" : ""
      }`}
    >
      <span className="grid min-w-0 flex-1 gap-1.5">
        <span className="text-xs font-medium text-stone-500">{label}</span>
        <span className="max-w-full break-words text-sm font-medium text-stone-900">{value}</span>
      </span>
      {canAct ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--pbp-surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pbp-text-muted)]">
          {i18n.workorder.ui.header.editAction}
          <ChevronIcon />
        </span>
      ) : null}
    </button>
  );
}

export default function WorkOrderDetailMobileHeaderSection({
  title,
  editableTitle,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
  canChangeManager,
  canRenameTitle = false,
  canEditInventory,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  onRenameTitle,
  locked = false,
  managerLocked = locked,
}: HeaderProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.header;
  const common = i18n.workorder.ui.common;
  const managerValue = managerName || "-";
  const summaryValue = summaryText || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}${common.quantitySuffix}`;
  const canEditTitle = !locked && canRenameTitle && typeof onRenameTitle === "function";
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(editableTitle ?? title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitleDraft(editableTitle ?? title);
  }, [editableTitle, title]);

  useEffect(() => {
    if (!isEditingTitle) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [isEditingTitle]);

  const closeTitleEditor = () => {
    setTitleDraft(editableTitle ?? title);
    setIsEditingTitle(false);
  };

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      closeTitleEditor();
      return;
    }
    onRenameTitle?.(trimmed);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTitle();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeTitleEditor();
    }
  };

  return (
    <section className="pbp-detail-summary-card min-w-0 overflow-hidden rounded-2xl border p-3.5 sm:p-4">
      <div className="flex min-w-0 items-start gap-2">
        {isEditingTitle ? (
          <div className="min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={handleTitleKeyDown}
              className="pbp-field-interaction pbp-workorder-editable-input h-11 w-full rounded-2xl border px-3 text-lg font-semibold outline-none"
              aria-label={copy.titleInputAria}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={saveTitle} className="pbp-interactive-button pbp-action-primary rounded-xl px-3 py-1.5 text-xs font-semibold">{copy.titleEditSave}</button>
              <button type="button" onClick={closeTitleEditor} className="pbp-interactive-button pbp-action-secondary rounded-xl border px-3 py-1.5 text-xs font-medium">{copy.titleEditCancel}</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="min-w-0 flex-1 break-keep text-lg font-semibold leading-7 text-stone-950 sm:text-xl">{title}</h2>
            {canEditTitle ? (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)] shadow-sm"
                aria-label={copy.titleEditAria}
              >
                <PencilIcon />
              </button>
            ) : null}
          </>
        )}
      </div>
      <p className="mt-2 break-keep text-sm leading-6 text-stone-600">{summaryValue}</p>

      <div className="mt-4 grid gap-2">
        <MobileSummaryAction
          label={copy.summaryLabel}
          value={summaryValue}
          onClick={onOpenBasicInfoModal}
          disabled={locked}
        />
        <MobileSummaryAction
          label={copy.managerLabel}
          value={managerValue}
          onClick={onOpenManagerAssignModal}
          disabled={!canChangeManager || managerLocked}
        />
        <MobileSummaryAction
          label={copy.currentInventoryLabel}
          value={inventoryValue}
          onClick={onOpenInventoryEditor}
          disabled={!canEditInventory}
        />
      </div>

      <div className="mt-3 text-right text-xs text-stone-400">{copy.lastUpdatedPrefix} {lastSavedAt || "-"}</div>
    </section>
  );
}
