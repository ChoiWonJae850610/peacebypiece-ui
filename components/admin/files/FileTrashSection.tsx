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
    <section className="flex h-full min-h-0 flex-col rounded-[28px] border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">TRASH</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-950">휴지통</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onToggleAll} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50">
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
          <button type="button" onClick={onRestore} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${hasSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
            복구 {hasSelection ? selectedItemIds.length : ""}
          </button>
          <button type="button" onClick={onPurge} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${hasSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
            영구 삭제 {hasSelection ? selectedItemIds.length : ""}
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto rounded-[24px] border border-stone-200">
        {items.length === 0 ? (
          <div className="bg-white px-4 py-10 text-center text-sm text-stone-500">휴지통에 보관 중인 파일이 없습니다.</div>
        ) : null}
        {items.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);
          return (
            <button key={item.id} type="button" onClick={() => onToggleItem(item.id)} className={`grid w-full gap-3 p-4 text-left transition md:grid-cols-[0.4fr_1.0fr_1.1fr_0.6fr_0.8fr_0.7fr_0.7fr_0.8fr] md:items-center ${isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}>✓</span>
              <div>
                <p className="text-xs text-stone-400">작지명</p>
                <p className="mt-1 text-sm font-semibold text-stone-950">{item.workorderTitle}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-stone-400">파일명</p>
                <p className="mt-1 truncate text-sm text-stone-700"><span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">{item.fileIcon}</span>{item.fileName}</p>
                <p className="mt-1 text-xs text-stone-400">{item.deleteReason}</p>
              </div>
              <div><p className="text-xs text-stone-400">용량</p><p className="mt-1 text-sm text-stone-700">{item.fileSizeLabel}</p></div>
              <div><p className="text-xs text-stone-400">삭제자</p><p className="mt-1 text-sm text-stone-700">{item.deletedBy}</p></div>
              <div><p className="text-xs text-stone-400">삭제일</p><p className="mt-1 text-sm text-stone-700">{item.deletedAt}</p></div>
              <div><p className="text-xs text-stone-400">복구 가능</p><p className="mt-1 text-sm font-semibold text-stone-950">{item.restoreLabel}</p></div>
              <div><p className="text-xs text-stone-400">삭제 상태</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.purgeStatus === "failed" ? "bg-red-50 text-red-600" : item.purgeStatus === "purge_requested" ? "bg-amber-50 text-amber-700" : item.isPurgeReady ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-500"}`}>{item.purgeStatusLabel}</span>{item.lastPurgeError ? <p className="mt-1 line-clamp-2 text-xs text-red-500">{item.lastPurgeError}</p> : null}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
