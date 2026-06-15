"use client";

import { WorkOrderEditIcon } from "@/components/workorder/common/WorkOrderIconButtons";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import {
  WaflButton,
  WaflInput,
  WaflSummaryHeaderCard,
  WaflSummaryInfoCell,
} from "@/components/common/ui";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

function TabletSummaryValue({
  label,
  value,
  disabled,
  onClick,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  valueClassName?: string;
}) {
  const valueNode = (
    <span className={`block truncate text-sm font-semibold text-[var(--pbp-text-primary)] ${valueClassName}`}>
      {value}
    </span>
  );

  if (disabled) {
    return <WaflSummaryInfoCell label={label}>{valueNode}</WaflSummaryInfoCell>;
  }

  return (
    <WaflSummaryInfoCell label={label}>
      <WaflButton
        type="button"
        variant="ghost"
        size="sm"
        width="full"
        onClick={onClick}
        className="min-w-0 px-1.5 py-1 text-center"
      >
        {valueNode}
      </WaflButton>
    </WaflSummaryInfoCell>
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
  dueDateLocked = locked,
}: HeaderProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.header;
  const common = i18n.workorder.ui.common;
  const managerValue = managerName || "-";
  const summaryValue = summaryText || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}${common.quantitySuffix}`;
  void lastSavedAt;
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

  const titleEditor = (
    <div className="flex min-w-0 items-start justify-center gap-2 text-center">
      {isEditingTitle ? (
        <div className="min-w-0 flex-1">
          <WaflInput
            ref={inputRef}
            type="text"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={handleTitleKeyDown}
            fieldSize="md"
            className="pbp-workorder-editable-input text-xl font-semibold"
            aria-label={copy.titleInputAria}
          />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <WaflButton type="button" onClick={saveTitle} variant="primary" size="sm">
              {copy.titleEditSave}
            </WaflButton>
            <WaflButton type="button" onClick={closeTitleEditor} variant="secondary" size="sm">
              {copy.titleEditCancel}
            </WaflButton>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 items-center justify-center gap-1.5">
          <h2 className="min-w-0 truncate text-xl font-semibold text-[var(--pbp-text-primary)]">
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
              <WorkOrderEditIcon className="h-3.5 w-3.5" />
            </WaflButton>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <WaflSummaryHeaderCard
      component="tablet-detail-summary-card"
      title={titleEditor}
      columns={2}
      className="shadow-none"
    >
      <TabletSummaryValue
        label={copy.summaryLabel}
        value={summaryValue}
        onClick={onOpenBasicInfoModal}
        disabled={dueDateLocked}
      />
      <TabletSummaryValue
        label={copy.managerLabel}
        value={managerValue}
        onClick={onOpenManagerAssignModal}
        disabled={!canChangeManager || managerLocked}
      />
      <WaflSummaryInfoCell label="납기일">
        <PbpSingleDatePicker
          value={dueDate}
          labels={{
            label: undefined,
            placeholder: "날짜 선택",
            clear: "지우기",
            done: "완료",
            selected: "선택일 {date}",
            calendarAria: "납기일 선택",
          }}
          locale="ko"
          displayFormat="iso"
          onChange={onChangeDueDate}
          popoverMode="fixed"
          disabled={locked}
          triggerVariant="subtle"
          triggerClassName="!min-h-0 !justify-center !border-0 !bg-transparent !px-1 !py-1 !text-center !text-sm !font-semibold !text-[var(--pbp-text-primary)] shadow-none"
          className="mx-auto w-full max-w-[190px]"
        />
      </WaflSummaryInfoCell>
      <TabletSummaryValue
        label={copy.currentInventoryLabel}
        value={inventoryValue}
        onClick={onOpenInventoryEditor}
        disabled={!canEditInventory}
        valueClassName="tabular-nums"
      />
    </WaflSummaryHeaderCard>
  );
}
