"use client";

import { WorkOrderEditIcon } from "@/components/workorder/common/WorkOrderIconButtons";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { WaflButton, WaflInput, WaflSurface, WaflSurfaceButton } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";
import { getTodayPbpLocalDateValue } from "@/lib/date/localDate";
import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

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
  const canAct = !disabled;
  return (
    <WaflSurfaceButton
      onClick={onClick}
      disabled={disabled}
      component="detail-summary-action"
      shape="control"
      tone={canAct ? "surface" : "muted"}
      className="pbp-detail-summary-action flex items-center gap-3 px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3.5 sm:py-3"
    >
      <span className="grid min-w-0 flex-1 gap-1.5">
        <span className="text-xs font-medium text-[var(--pbp-text-muted)]">{label}</span>
        <span className="max-w-full break-words text-sm font-medium text-[var(--pbp-text-primary)]">{value}</span>
      </span>
      {canAct ? (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center wafl-shape-icon bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-muted)]" aria-hidden="true">
          <WorkOrderEditIcon className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </WaflSurfaceButton>
  );
}

export default function WorkOrderDetailMobileHeaderSection({
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
  dueDateLocked = locked,
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
    <WaflSurface as="section" component="mobile-detail-summary-card" shape="control" className="pbp-detail-summary-card overflow-hidden p-3 sm:p-3.5">
      <div className="flex min-w-0 items-start gap-2">
        {isEditingTitle ? (
          <div className="min-w-0 flex-1">
            <WaflInput
              ref={inputRef}
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onKeyDown={handleTitleKeyDown}
              fieldSize="sm" className="pbp-workorder-editable-input text-lg font-semibold"
              aria-label={copy.titleInputAria}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <WaflButton onClick={saveTitle} variant="primary" size="sm">{copy.titleEditSave}</WaflButton>
              <WaflButton onClick={closeTitleEditor} variant="secondary" size="sm">{copy.titleEditCancel}</WaflButton>
            </div>
          </div>
        ) : (
          <>
            <h2 className="min-w-0 break-keep text-lg font-semibold leading-7 text-[var(--pbp-text-primary)]">{title}</h2>
            {canEditTitle ? (
              <WaflButton
                onClick={() => setIsEditingTitle(true)}
                variant="icon"
                size="sm"
                className="shrink-0 text-[var(--pbp-text-muted)]"
                aria-label={copy.titleEditAria}
              >
                <WorkOrderEditIcon className="h-3.5 w-3.5" />
              </WaflButton>
            ) : null}
          </>
        )}
      </div>
      <p className="mt-2 break-keep text-xs leading-5 text-[var(--pbp-text-muted)]">{summaryValue}</p>

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

      <div className="mt-3 grid gap-2">
        <PbpSingleDatePicker
          value={dueDate}
          labels={{ label: "납기일", placeholder: "날짜 선택", clear: "지우기", done: "완료", selected: "선택일 {date}", calendarAria: "납기일 선택" }}
          locale="ko"
          displayFormat="iso"
          onChange={onChangeDueDate}
          minDateValue={getTodayPbpLocalDateValue()}
          popoverMode="fixed"
          disabled={dueDateLocked}
        />
        <div className="text-right text-xs text-[var(--pbp-text-muted)]">{copy.lastUpdatedPrefix} {lastSavedAt || "-"}</div>
      </div>
    </WaflSurface>
  );
}
