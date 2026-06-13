"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { WaflButton, WaflInput, WaflSurface } from "@/components/common/ui";
import { WorkOrderEditIcon } from "@/components/workorder/common/WorkOrderIconButtons";
import { getTodayPbpLocalDateValue } from "@/lib/date/localDate";
import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import { useI18n } from "@/lib/i18n";
import { WORKORDER_CATEGORY_RECOMMENDATION_ENABLED } from "@/lib/runtime/runtimeMode";
import { getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";
import type { RoleType } from "@/types/workorder";

type WorkOrderHeaderSectionProps = {
  title: string;
  editableTitle?: string;
  summaryText: string;
  managerName: string;
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  dueDate: string;
  onChangeDueDate: (value: string) => void;
  canChangeManager: boolean;
  currentUserRole: RoleType;
  canRenameTitle?: boolean;
  canEditInventory: boolean;
  onSave: () => void;
  onOpenBasicInfoModal: () => void;
  onOpenManagerAssignModal: () => void;
  onOpenInventoryEditor: () => void;
  onRenameTitle?: (nextTitle: string) => void;
  locked?: boolean;
  managerLocked?: boolean;
};

export default function WorkOrderHeaderSection({
  title,
  editableTitle,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
  dueDate,
  onChangeDueDate,
  canChangeManager,
  currentUserRole,
  canRenameTitle = false,
  canEditInventory,
  onSave,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  onRenameTitle,
  locked = false,
  managerLocked = locked,
}: WorkOrderHeaderSectionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.header;
  const common = i18n.workorder.ui.common;
  void onSave;
  void currentUserRole;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(editableTitle ?? title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const managerValue = managerName || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}${common.quantitySuffix}`;
  const summaryValue = summaryText || "-";
  const canEditSummary = !locked && canRenameTitle && typeof onOpenBasicInfoModal === "function";
  const recommendedCategory = WORKORDER_CATEGORY_RECOMMENDATION_ENABLED ? getRecommendedWorkOrderCategory(titleDraft.trim()) : null;
  const canEditManager = !managerLocked && canChangeManager;
  const canEditTitle = !locked && canRenameTitle && typeof onRenameTitle === "function";

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
      setTitleDraft(editableTitle ?? title);
      setIsEditingTitle(false);
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
            fieldSize="md"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={handleTitleKeyDown}
            className="w-full text-lg font-semibold md:text-2xl"
            aria-label={copy.titleInputAria}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <WaflButton type="button" onClick={saveTitle} variant="primary" size="sm">{copy.titleEditSave}</WaflButton>
            <WaflButton type="button" onClick={closeTitleEditor} variant="secondary" size="sm">{copy.titleEditCancel}</WaflButton>
            <span className="text-[11px] text-stone-500">{copy.titleEditHint}</span>
          </div>
          {recommendedCategory ? (
            <div data-wafl-component="card" className="pbp-detail-summary-readonly mt-2 rounded-[var(--pbp-radius-wafl)] border px-3 py-2 text-[11px] leading-5">
              {i18n.workorder.ui.modals.createWorkOrder.recommendedCategory}: {recommendedCategory.category1} / {recommendedCategory.category2} / {recommendedCategory.category3}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex min-w-0 items-center justify-center gap-1.5">
          <h2 className="min-w-0 flex-1 truncate text-2xl font-semibold text-stone-950" title={title}>{title}</h2>
          {canEditTitle ? (
            <WaflButton
              type="button"
              variant="icon"
              size="sm"
              onClick={() => setIsEditingTitle(true)}
              className="self-start pbp-text-subtle"
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
    <WaflSurface
      as="section"
      component="workorder-header-summary"
      className="shrink-0 p-3.5 sm:p-4"
    >
      <div className="min-w-0 text-center">{titleEditor}</div>

      <div className="mt-3 grid min-w-0 grid-cols-2 gap-3 border-t border-[var(--pbp-border)] pt-3 text-center sm:grid-cols-3">
        <WorkOrderHeaderInfoCell
          label={copy.summaryLabel}
          value={summaryValue}
          onClick={canEditSummary ? onOpenBasicInfoModal : undefined}
        />
        <WorkOrderHeaderInfoCell
          label={copy.managerLabel}
          value={managerValue}
          onClick={canEditManager ? onOpenManagerAssignModal : undefined}
        />
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <WorkOrderHeaderInfoCell
            label={copy.currentInventoryLabel}
            value={inventoryValue}
            onClick={canEditInventory ? onOpenInventoryEditor : undefined}
            valueClassName="tabular-nums"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PbpSingleDatePicker
          value={dueDate}
          labels={{
            label: "납기일",
            placeholder: "날짜 선택",
            clear: "지우기",
            done: "완료",
            selected: "선택일 {date}",
            calendarAria: "납기일 선택",
          }}
          locale="ko"
          onChange={onChangeDueDate}
          minDateValue={getTodayPbpLocalDateValue()}
          popoverMode="fixed"
          disabled={locked}
          triggerVariant="subtle"
          className="w-full sm:w-[190px]"
        />
        <p className="truncate text-right text-xs pbp-text-subtle">
          {copy.lastUpdatedPrefix} {lastSavedAt || "-"}
        </p>
      </div>
    </WaflSurface>
  );
}

function WorkOrderHeaderInfoCell({
  label,
  value,
  onClick,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  valueClassName?: string;
}) {
  const content = (
    <>
      <span className="block truncate text-[11px] font-medium pbp-text-subtle">
        {label}
      </span>
      <span className={`mt-1 block truncate text-sm font-semibold pbp-text-primary ${valueClassName}`}>
        {value}
      </span>
    </>
  );

  if (!onClick) {
    return <div className="min-w-0 text-center">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="pbp-interactive-button min-w-0 rounded-[var(--pbp-radius-wafl)] px-1.5 py-1 text-center transition hover:bg-[var(--pbp-surface-muted)] focus-visible:bg-[var(--pbp-surface-muted)]"
    >
      {content}
    </button>
  );
}
