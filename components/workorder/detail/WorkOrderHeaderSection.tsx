import InlineInfoItem from "@/components/common/ui/InlineInfoItem";

type WorkOrderHeaderSectionProps = {
  title: string;
  summaryText: string;
  managerName: string;
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  canChangeManager: boolean;
  canEditInventory: boolean;
  onSave: () => void;
  onOpenBasicInfoModal: () => void;
  onOpenManagerAssignModal: () => void;
  onOpenInventoryEditor: () => void;
  locked?: boolean;
};

export default function WorkOrderHeaderSection({
  title,
  summaryText,
  managerName,
  currentInventoryQuantity,
  lastSavedAt,
  canChangeManager,
  canEditInventory,
  onSave,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  locked = false,
}: WorkOrderHeaderSectionProps) {
  const managerValue = managerName || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}장`;

  return (
    <div className="border-b border-stone-200 pb-4">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-start justify-between gap-3 md:block">
              <h2 className="mt-1 break-keep text-2xl font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onSave}
                disabled={locked}
                className="shrink-0 pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 active:bg-black md:hidden"
              >
                저장
              </button>
            </div>
            <div className="mt-3 text-xs text-stone-400">최근 변경 {lastSavedAt || "-"}</div>
            <button
              type="button"
              onClick={onOpenBasicInfoModal}
              disabled={locked}
              className="pbp-interactive-button mt-3 inline-flex max-w-full items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-left text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-100 active:bg-stone-200 md:text-sm"
            >
              <span className="truncate">{summaryText}</span>
            </button>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 pr-2 text-sm text-stone-600 md:hidden">
              <InlineInfoItem label="담당자" value={managerValue} onClick={!locked && canChangeManager ? onOpenManagerAssignModal : undefined} />
              <InlineInfoItem label="현재 재고" value={inventoryValue} onClick={canEditInventory ? onOpenInventoryEditor : undefined} valueClassName="tabular-nums text-stone-900" />
            </div>
          </div>
          <div className="hidden shrink-0 md:flex md:min-w-[220px] md:flex-col md:items-end md:gap-3 md:text-right">
            <button
              type="button"
              onClick={onSave}
              disabled={locked}
              className="pbp-interactive-button rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 active:bg-black"
            >
              저장
            </button>
            <div className="flex flex-col items-end gap-3 text-right">
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-stone-600">
                <InlineInfoItem label="담당자" value={managerValue} onClick={!locked && canChangeManager ? onOpenManagerAssignModal : undefined} />
                <InlineInfoItem label="현재 재고" value={inventoryValue} onClick={!locked && canEditInventory ? onOpenInventoryEditor : undefined} valueClassName="tabular-nums text-stone-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
