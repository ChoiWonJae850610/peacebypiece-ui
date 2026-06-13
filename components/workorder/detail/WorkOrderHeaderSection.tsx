"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AppSelect, WaflButton, WaflInput, WaflSummaryHeaderCard, WaflSummaryInfoCell } from "@/components/common/ui";
import { WorkOrderEditIcon } from "@/components/workorder/common/WorkOrderIconButtons";
import { getTodayPbpLocalDateValue } from "@/lib/date/localDate";
import { PbpSingleDatePicker } from "@/components/common/date/PbpSingleDatePicker";
import { useI18n } from "@/lib/i18n";
import { WORKORDER_CATEGORY_RECOMMENDATION_ENABLED } from "@/lib/runtime/runtimeMode";
import { getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";
import type { RoleType, WorkOrder } from "@/types/workorder";

type WorkOrderHeaderSectionProps = {
  title: string;
  editableTitle?: string;
  summaryText: string;
  managerName: string;
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  dueDate: string;
  workOrderKind: WorkOrder["workOrderKind"];
  onChangeDueDate: (value: string) => void;
  onChangeWorkOrderKind: (value: NonNullable<WorkOrder["workOrderKind"]>) => void;
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
  workOrderKind,
  onChangeDueDate,
  onChangeWorkOrderKind,
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
    <WaflSummaryHeaderCard
      component="workorder-header-summary"
      title={titleEditor}
      columns={3}
      footerColumns={3}
      footerLeft={(
        <WaflSummaryInfoCell label="작업구분">
          <AppSelect
            value={workOrderKind || "sample"}
            options={[
              { value: "sample", label: "샘플" },
              { value: "main", label: "메인작업" },
              { value: "rework", label: "재작업" },
            ]}
            onValueChange={(value) => onChangeWorkOrderKind(value as NonNullable<WorkOrder["workOrderKind"]>)}
            ariaLabel="작업구분 선택"
            disabled={locked}
            triggerClassName="!h-auto !min-h-0 justify-center !border-0 !bg-transparent !px-1.5 !py-1 text-center text-sm font-semibold shadow-none"
          />
        </WaflSummaryInfoCell>
      )}
      footerCenter={(
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
          onChange={onChangeDueDate}
          minDateValue={getTodayPbpLocalDateValue()}
          popoverMode="fixed"
          disabled={locked}
          triggerVariant="subtle"
          className="mx-auto w-full max-w-[190px]"
        />
        </WaflSummaryInfoCell>
      )}
      footerRight={(
        <WaflSummaryInfoCell label={copy.lastUpdatedPrefix}>
          <span className="block truncate text-sm font-semibold pbp-text-primary">
            {lastSavedAt || "-"}
          </span>
        </WaflSummaryInfoCell>
      )}
    >
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
    </WaflSummaryHeaderCard>
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
  const valueNode = (
    <span className={`block truncate text-sm font-semibold pbp-text-primary ${valueClassName}`}>
      {value}
    </span>
  );

  if (!onClick) {
    return <WaflSummaryInfoCell label={label}>{valueNode}</WaflSummaryInfoCell>;
  }

  return (
    <WaflSummaryInfoCell label={label}>
      <button
        type="button"
        onClick={onClick}
        className="pbp-interactive-button w-full min-w-0 rounded-[var(--pbp-radius-wafl)] px-1.5 py-1 text-center transition hover:bg-[var(--pbp-surface-muted)] focus-visible:bg-[var(--pbp-surface-muted)]"
      >
        {valueNode}
      </button>
    </WaflSummaryInfoCell>
  );
}
