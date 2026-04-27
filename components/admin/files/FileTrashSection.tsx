import type { AdminTrashFileItem } from "@/lib/admin/adminFiles.types";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onRestore: () => void;
  onPurge: () => void;
};

export default function FileTrashSection({ items, selectedItemIds, onToggleItem, onToggleAll, onRestore, onPurge }: FileTrashSectionProps) {
  const hasSelection = selectedItemIds.length > 0;
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">휴지통</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">삭제 요청된 첨부파일은 실제 삭제 전까지 복구 가능한 상태로 보관합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onToggleAll} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
          <button type="button" onClick={onRestore} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${hasSelection ? "border-stone-300 bg-white text-stone-700 hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
            복구 {hasSelection ? selectedItemIds.length : ""}
          </button>
          <button type="button" onClick={onPurge} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${hasSelection ? "border-red-200 bg-white text-red-600 hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
            영구 삭제 {hasSelection ? selectedItemIds.length : ""}
          </button>
        </div>
      </div>

      <div className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200">
        {items.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          return (
            <button key={item.id} type="button" onClick={() => onToggleItem(item.id)} className={`grid w-full gap-3 p-4 text-left transition md:grid-cols-[0.4fr_1.1fr_1.2fr_0.7fr_0.8fr_0.8fr_0.7fr] md:items-center ${isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-transparent"}`}>✓</span>
              <div>
                <p className="text-xs text-stone-400">작지명</p>
                <p className="mt-1 text-sm font-medium text-stone-900">{item.workorderTitle}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-stone-400">파일명</p>
                <p className="mt-1 truncate text-sm text-stone-700"><span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">{item.fileIcon}</span>{item.fileName}</p>
                <p className="mt-1 text-xs text-stone-400">{item.deleteReason}</p>
              </div>
              <div><p className="text-xs text-stone-400">용량</p><p className="mt-1 text-sm text-stone-700">{item.fileSizeLabel}</p></div>
              <div><p className="text-xs text-stone-400">삭제자</p><p className="mt-1 text-sm text-stone-700">{item.deletedBy}</p></div>
              <div><p className="text-xs text-stone-400">삭제일</p><p className="mt-1 text-sm text-stone-700">{item.deletedAt}</p></div>
              <div><p className="text-xs text-stone-400">복구 가능</p><p className="mt-1 text-sm font-medium text-stone-900">{item.restoreLabel}</p></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
