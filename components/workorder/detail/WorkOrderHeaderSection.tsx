import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import InlineInfoItem from "@/components/common/ui/InlineInfoItem";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      <path d="M13.9 2.6a1.5 1.5 0 0 1 2.1 0l1.4 1.4a1.5 1.5 0 0 1 0 2.1l-8.8 8.8-3.6.7.7-3.6 8.2-8.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12.5 4 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type WorkOrderHeaderSectionProps = {
  title: string;
  summaryText: string;
  managerName: string;
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  canChangeManager: boolean;
  currentUserRole: string;
  canRenameTitle?: boolean;
  canEditInventory: boolean;
  onSave: () => void;
  onOpenBasicInfoModal: () => void;
  onOpenManagerAssignModal: () => void;
  onOpenInventoryEditor: () => void;
  onRenameTitle?: (nextTitle: string) => void;
  locked?: boolean;
};

export default function WorkOrderHeaderSection({
  title,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
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
}: WorkOrderHeaderSectionProps) {
  void onSave;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const managerValue = managerName || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}장`;
  const summaryValue = summaryText || "-";
  const canEditSummary = !locked && (currentUserRole === "관리자" || currentUserRole === "디자이너") && typeof onOpenBasicInfoModal === "function";
  const canEditManager = !locked && canChangeManager;
  const canEditTitle = canRenameTitle && typeof onRenameTitle === "function";

  useEffect(() => {
    setTitleDraft(title);
  }, [title]);

  useEffect(() => {
    if (!isEditingTitle) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [isEditingTitle]);

  const closeTitleEditor = () => {
    setTitleDraft(title);
    setIsEditingTitle(false);
  };

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleDraft(title);
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
    <div className="flex min-w-0 items-start gap-2">
      {isEditingTitle ? (
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={handleTitleKeyDown}
            className="pbp-field-interaction h-11 w-full rounded-2xl border border-stone-300 bg-white px-3 text-lg font-semibold text-stone-950 outline-none focus:border-stone-400 md:text-2xl"
            aria-label="작업지시서명 입력"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={saveTitle} className="pbp-interactive-button rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-800">저장</button>
            <button type="button" onClick={closeTitleEditor} className="pbp-interactive-button rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-100">취소</button>
            <span className="text-[11px] text-stone-500">리오더 계열 전체에 같은 이름이 반영됩니다.</span>
          </div>
        </div>
      ) : (
        <>
          <h2 className="min-w-0 flex-1 break-keep text-2xl font-semibold text-stone-950">{title}</h2>
          {canEditTitle ? (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="pbp-touch-target pbp-interactive-button inline-flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
              aria-label="작업지시서명 수정"
            >
              <PencilIcon />
            </button>
          ) : null}
        </>
      )}
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
          <div className="min-w-0">{titleEditor}</div>
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
