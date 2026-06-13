"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import {
  WaflButton,
  WaflInput,
  WaflSurface,
  WaflSurfaceButton,
} from "@/components/common/ui";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="h-3.5 w-3.5"
    >
      <path
        d="M13.9 2.6a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1l-8.8 8.8-3.6.7.7-3.6 8.2-8.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m12.5 4 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TabletSummaryAction({
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
  const canAct = !disabled;
  return (
    <WaflSurfaceButton
      onClick={onClick}
      disabled={disabled}
      component="detail-summary-action"
      shape="control"
      className="flex items-center justify-between gap-3 px-3.5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="grid min-w-0 gap-1">
        <span className="text-xs font-medium text-[var(--pbp-text-muted)]">
          {label}
        </span>
        <span className="break-words text-sm font-semibold text-[var(--pbp-text-primary)]">
          {value}
        </span>
      </span>
      {canAct ? (
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center wafl-shape-icon bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-muted)]"
          aria-hidden="true"
        >
          <PencilIcon />
        </span>
      ) : null}
    </WaflSurfaceButton>
  );
}

export default function WorkOrderDetailTabletHeaderSection({
  title,
  editableTitle,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
  dueDate,
  onChangeDueDate,
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
  const canEditTitle =
    !locked && canRenameTitle && typeof onRenameTitle === "function";
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
    <WaflSurface as="section" component="tablet-detail-summary-card" shape="control" className="p-4">
      <div className="grid gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-start gap-2">
            {isEditingTitle ? (
              <div className="min-w-0 flex-1">
                <WaflInput
                  ref={inputRef}
                  type="text"
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  fieldSize="md" className="pbp-workorder-editable-input text-xl font-semibold"
                  aria-label={copy.titleInputAria}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <WaflButton
                    type="button"
                    onClick={saveTitle}
                    variant="primary"
                    size="sm"
                  >
                    {copy.titleEditSave}
                  </WaflButton>
                  <WaflButton
                    type="button"
                    onClick={closeTitleEditor}
                    variant="secondary"
                    size="sm"
                  >
                    {copy.titleEditCancel}
                  </WaflButton>
                </div>
              </div>
            ) : (
              <>
                <h2 className="min-w-0 break-keep text-xl font-semibold text-[var(--pbp-text-primary)]">
                  {title}
                </h2>
                {canEditTitle ? (
                  <WaflButton
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    variant="icon"
                    size="sm"
                    aria-label={copy.titleEditAria}
                  >
                    <PencilIcon />
                  </WaflButton>
                ) : null}
              </>
            )}
          </div>
          <div className="mt-3 grid gap-2">
            <TabletSummaryAction
              label={copy.summaryLabel}
              value={summaryValue}
              onClick={onOpenBasicInfoModal}
              disabled={locked}
            />
            <TabletSummaryAction
              label={copy.managerLabel}
              value={managerValue}
              onClick={onOpenManagerAssignModal}
              disabled={!canChangeManager || managerLocked}
            />
            <TabletSummaryAction
              label={copy.currentInventoryLabel}
              value={inventoryValue}
              onClick={onOpenInventoryEditor}
              disabled={!canEditInventory}
            />
            <PbpSingleDatePicker
              value={dueDate}
              labels={{ label: "납기일", placeholder: "날짜 선택", clear: "지우기", done: "완료", selected: "선택일 {date}", calendarAria: "납기일 선택" }}
              locale="ko"
              onChange={onChangeDueDate}
              popoverMode="fixed"
              disabled={locked}
            />
            <div className="text-right text-[11px] text-[var(--pbp-text-subtle)]">
              {copy.lastUpdatedPrefix} {lastSavedAt || "-"}
            </div>
          </div>
        </div>
      </div>
    </WaflSurface>
  );
}
