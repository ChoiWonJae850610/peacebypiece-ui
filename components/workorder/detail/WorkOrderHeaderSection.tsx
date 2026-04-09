"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import InlineInfoItem from "@/components/common/ui/InlineInfoItem";
import { WORKORDER_LABELS } from "@/lib/constants/workorderLabels";
import type { WorkOrderCategoryRecommendation } from "@/lib/constants/workorderCategoryKeywords";
import { getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";

type WorkOrderHeaderSectionProps = {
  title: string;
  editableTitle: string;
  summaryText: string;
  managerName: string;
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  canChangeManager: boolean;
  currentUserRole: string;
  canEditInventory: boolean;
  onSave: () => void;
  onRenameTitle: (nextTitle: string) => boolean;
  onApplyRecommendedCategory: (recommendation: WorkOrderCategoryRecommendation) => void;
  onOpenBasicInfoModal: () => void;
  onOpenManagerAssignModal: () => void;
  onOpenInventoryEditor: () => void;
  locked?: boolean;
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M13.75 3.75a1.768 1.768 0 1 1 2.5 2.5L7.083 15.417 4.167 16.25 5 13.333 13.75 4.583Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function WorkOrderHeaderSection({
  title,
  editableTitle,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
  canChangeManager,
  currentUserRole,
  canEditInventory,
  onSave,
  onRenameTitle,
  onApplyRecommendedCategory,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  locked = false,
}: WorkOrderHeaderSectionProps) {
  void onSave;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(editableTitle);
  const managerValue = managerName || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}장`;
  const summaryValue = summaryText || "-";
  const canEditSummary = !locked && (currentUserRole === "관리자" || currentUserRole === "디자이너") && typeof onOpenBasicInfoModal === "function";
  const canEditManager = !locked && canChangeManager;
  const canEditTitle = !locked && (currentUserRole === "관리자" || currentUserRole === "디자이너");
  const recommendedCategory = useMemo(() => getRecommendedWorkOrderCategory(titleDraft.trim()), [titleDraft]);
  const hasChangedTitle = titleDraft.trim().length > 0 && titleDraft.trim() !== editableTitle.trim();

  useEffect(() => {
    setTitleDraft(editableTitle);
    setIsEditingTitle(false);
  }, [editableTitle]);

  useEffect(() => {
    if (!isEditingTitle) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isEditingTitle]);

  const handleStartEditingTitle = () => {
    if (!canEditTitle) return;
    setTitleDraft(editableTitle);
    setIsEditingTitle(true);
  };

  const handleCancelEditingTitle = () => {
    setTitleDraft(editableTitle);
    setIsEditingTitle(false);
  };

  const handleSubmitEditingTitle = () => {
    if (!hasChangedTitle) {
      handleCancelEditingTitle();
      return;
    }
    const didRename = onRenameTitle(titleDraft.trim());
    if (didRename !== false) {
      setIsEditingTitle(false);
    }
  };

  const titleEditor = isEditingTitle ? (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmitEditingTitle();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              handleCancelEditingTitle();
            }
          }}
          className="h-11 w-full rounded-2xl border border-stone-300 bg-white px-4 text-lg font-semibold text-stone-950 outline-none focus:border-stone-500 md:text-2xl"
          placeholder={WORKORDER_LABELS.workOrderTitle}
        />
        <div className="flex items-center gap-2 sm:shrink-0">
          <button type="button" onClick={handleSubmitEditingTitle} className="pbp-interactive-button rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800">저장</button>
          <button type="button" onClick={handleCancelEditingTitle} className="pbp-interactive-button rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100">취소</button>
        </div>
      </div>
      {recommendedCategory ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-emerald-900">{WORKORDER_LABELS.recommendedCategory}</div>
              <div className="mt-1 text-sm text-emerald-800">
                {recommendedCategory.category1} / {recommendedCategory.category2} / {recommendedCategory.category3}
              </div>
              <div className="mt-1 text-xs leading-5 text-emerald-700">{recommendedCategory.reason}</div>
            </div>
            <button
              type="button"
              onClick={() => onApplyRecommendedCategory(recommendedCategory)}
              className="pbp-interactive-button shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
            >
              {WORKORDER_LABELS.applyRecommendedCategory}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  ) : (
    <div className="flex items-start gap-2">
      <h2 className="break-keep text-2xl font-semibold text-stone-950">{title}</h2>
      {canEditTitle ? (
        <button
          type="button"
          onClick={handleStartEditingTitle}
          aria-label="작업지시서명 수정"
          className="pbp-interactive-button mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-600 hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
        >
          <PencilIcon />
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="border-b border-stone-200 pb-4">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-2">
          <div className="min-w-0">
            {titleEditor}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-right">
            <InlineInfoItem label="담당자" value={managerValue} onClick={canEditManager ? onOpenManagerAssignModal : undefined} />
            <InlineInfoItem label="현재 재고" value={inventoryValue} onClick={canEditInventory ? onOpenInventoryEditor : undefined} valueClassName="tabular-nums text-stone-900" />
          </div>
          <div className="min-w-0">
            <InlineInfoItem label="분류" value={summaryValue} onClick={canEditSummary ? onOpenBasicInfoModal : undefined} valueClassName="truncate text-stone-800" />
          </div>
          <div className="text-right text-xs text-stone-400">최근 변경 {lastSavedAt || "-"}</div>
        </div>

        <div className="flex flex-col gap-2 md:hidden">
          {titleEditor}
          <div className="min-w-0">
            <InlineInfoItem label="분류" value={summaryValue} onClick={canEditSummary ? onOpenBasicInfoModal : undefined} valueClassName="truncate text-stone-800" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <InlineInfoItem label="담당자" value={managerValue} onClick={canEditManager ? onOpenManagerAssignModal : undefined} />
            <InlineInfoItem label="현재 재고" value={inventoryValue} onClick={canEditInventory ? onOpenInventoryEditor : undefined} valueClassName="tabular-nums text-stone-900" />
          </div>
          <div className="text-xs text-stone-400">최근 변경 {lastSavedAt || "-"}</div>
        </div>
      </div>
    </div>
  );
}
