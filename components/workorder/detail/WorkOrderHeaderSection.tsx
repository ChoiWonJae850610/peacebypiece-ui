import InlineInfoItem from "@/components/common/ui/InlineInfoItem";

type WorkOrderHeaderSectionProps = {
  title: string;
  summaryText: string;
  managerName: string;
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  canChangeManager: boolean;
  currentUserRole: string;
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
  currentUserRole,
  canEditInventory,
  onSave,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  locked = false,
}: WorkOrderHeaderSectionProps) {
  void onSave;
  const managerValue = managerName || "-";
  const inventoryValue = `${currentInventoryQuantity.toLocaleString()}장`;
  const summaryValue = summaryText || "-";
  const canEditSummary = !locked && (currentUserRole === "관리자" || currentUserRole === "디자이너") && typeof onOpenBasicInfoModal === "function";
  const canEditManager = !locked && canChangeManager;

  return (
    <div className="border-b border-stone-200 pb-4">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-6 md:gap-y-2">
          <div className="min-w-0">
            <h2 className="break-keep text-2xl font-semibold text-stone-950">{title}</h2>
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
          <h2 className="break-keep text-2xl font-semibold text-stone-950">{title}</h2>
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
