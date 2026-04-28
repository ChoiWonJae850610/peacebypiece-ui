import { ADMIN_FILE_SORT_OPTIONS } from "@/lib/admin/adminFiles.presentation";
import type { AdminFileSortKey, AdminManagedFileItem } from "@/lib/admin/adminFiles.types";

type FileListSectionProps = {
  items: AdminManagedFileItem[];
  selectedItemIds: string[];
  sortKey: AdminFileSortKey;
  onChangeSort: (sortKey: AdminFileSortKey) => void;
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onMoveToTrash: () => void;
};

export default function FileListSection({ items, selectedItemIds, sortKey, onChangeSort, onToggleItem, onToggleAll, onMoveToTrash }: FileListSectionProps) {
  const hasSelection = selectedItemIds.length > 0;
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[28px] border border-stone-200 bg-white p-3.5 shadow-sm">
      <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-stone-950">첨부파일 목록</h2>
        <div className="flex flex-wrap gap-2">
          <select value={sortKey} onChange={(event) => onChangeSort(event.target.value as AdminFileSortKey)} className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm">
            {ADMIN_FILE_SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={onToggleAll} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50">
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
          <button type="button" onClick={onMoveToTrash} disabled={!hasSelection} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${hasSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}>
            삭제 {hasSelection ? selectedItemIds.length : ""}
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-stone-200">
        <div className="hidden grid-cols-[0.38fr_1.08fr_0.82fr_1.72fr_0.68fr_0.72fr] gap-3 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-500 md:grid">
          <span>선택</span>
          <span>작지명</span>
          <span>생성일자</span>
          <span>파일명</span>
          <span>유형</span>
          <span>용량</span>
        </div>
        <div className="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex min-h-full items-center justify-center bg-white px-4 py-10 text-center text-sm text-stone-500">표시할 첨부파일이 없습니다.</div>
          ) : null}
          {items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <button key={item.id} type="button" onClick={() => onToggleItem(item.id)} className={`grid w-full gap-3 px-4 py-2.5 text-left text-sm transition md:grid-cols-[0.38fr_1.08fr_0.82fr_1.72fr_0.68fr_0.72fr] md:items-center ${isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}>✓</span>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 md:hidden">작지명</p>
                  <p className="truncate font-semibold text-stone-950">{item.workorderTitle}</p>
                </div>
                <p className="text-stone-600">{item.uploadedAt}</p>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 md:hidden">파일명</p>
                  <p className="truncate text-stone-700">{item.fileName}</p>
                </div>
                <p className="text-stone-600">{item.fileType}</p>
                <p className="text-stone-600">{item.fileSizeLabel}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
