"use client";

import { WorkOrderEditIcon } from "@/components/workorder/common/WorkOrderIconButtons";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  WaflButton,
  WaflInput,
  WaflSummaryHeaderCard,
  WaflSummaryInfoCell,
} from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";
import { EMPTY_DISPLAY } from "@/lib/constants/display";
import { getTodayPbpLocalDateValue, normalizePbpLocalDateValue } from "@/lib/date/localDate";
import { formatPbpNumberWithUnit } from "@/lib/utils/formatters";
import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import WorkOrderSummaryInfoCell from "@/components/workorder/detail/WorkOrderSummaryInfoCell";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type HeaderProps = WorkOrderDetailViewModel["headerProps"];

export default function WorkOrderDetailMobileHeaderSection({
  title,
  editableTitle,
  summaryText,
  managerName,
  currentInventoryQuantity,
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
  const managerValue = managerName || EMPTY_DISPLAY;
  const summaryValue = summaryText || EMPTY_DISPLAY;
  const inventoryValue = formatPbpNumberWithUnit(currentInventoryQuantity, common.quantitySuffix);
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

  const titleEditor = isEditingTitle ? (
    <div className="min-w-0 flex-1">
      <WaflInput
        ref={inputRef}
        type="text"
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onKeyDown={handleTitleKeyDown}
        fieldSize="sm"
        className="pbp-workorder-editable-input text-lg font-semibold"
        aria-label={copy.titleInputAria}
      />
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <WaflButton onClick={saveTitle} variant="primary" size="sm">{copy.titleEditSave}</WaflButton>
        <WaflButton onClick={closeTitleEditor} variant="secondary" size="sm">{copy.titleEditCancel}</WaflButton>
      </div>
    </div>
  ) : (
    <div className="flex min-w-0 items-center justify-center gap-1.5">
      <h2 className="min-w-0 truncate text-lg font-semibold leading-7 pbp-text-primary" title={title}>{title}</h2>
      {canEditTitle ? (
        <WaflButton
          onClick={() => setIsEditingTitle(true)}
          variant="icon"
          size="sm"
          className="shrink-0 pbp-text-subtle"
          aria-label={copy.titleEditAria}
        >
          <WorkOrderEditIcon className="h-3.5 w-3.5" />
        </WaflButton>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-1.5">
      <WaflSummaryHeaderCard
        component="mobile-detail-summary-card"
        title={titleEditor}
        columns={2}
        responsiveColumns
        className="shadow-none"
      >
        <WorkOrderSummaryInfoCell
          label={copy.summaryLabel}
          value={summaryValue}
          onClick={onOpenBasicInfoModal}
          disabled={locked}
        />
        <WorkOrderSummaryInfoCell
          label={copy.managerLabel}
          value={managerValue}
          onClick={onOpenManagerAssignModal}
          disabled={!canChangeManager || managerLocked}
        />
        <WaflSummaryInfoCell label="납기일">
          <PbpSingleDatePicker
            value={normalizePbpLocalDateValue(dueDate)}
            labels={{
              label: undefined,
              placeholder: "날짜 선택",
              clear: "지우기",
              done: "완료",
              selected: "선택일 {date}",
              calendarAria: "납기일 선택",
            }}
            locale="ko"
            displayFormat="locale"
            onChange={onChangeDueDate}
            minDateValue={getTodayPbpLocalDateValue()}
            popoverMode="fixed"
            disabled={dueDateLocked}
            triggerVariant="subtle"
            triggerClassName="!min-h-0 !justify-center !border-0 !bg-transparent !px-1 !py-1 !text-center !text-sm !font-semibold !text-[var(--pbp-text-primary)] shadow-none"
            className="mx-auto w-full max-w-[190px]"
          />
        </WaflSummaryInfoCell>
        <WorkOrderSummaryInfoCell
          label={copy.currentInventoryLabel}
          value={inventoryValue}
          onClick={onOpenInventoryEditor}
          disabled={!canEditInventory}
          valueClassName="tabular-nums"
        />
      </WaflSummaryHeaderCard>
    </div>
  );
}
