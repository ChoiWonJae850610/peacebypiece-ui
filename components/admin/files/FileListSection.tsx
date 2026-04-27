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
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">첨부파일 목록</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">작지명, 파일명, 유형, 용량, 등록자를 기준으로 확인합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={sortKey} onChange={(event) => onChangeSort(event.target.value as AdminFileSortKey)} className="rounded-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700">
            {ADMIN_FILE_SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={onToggleAll} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
            {allSelected ? "전체 해제" : "전체 선택"}
          </button>
          <button
            type="button"
            onClick={onMoveToTrash}
            disabled={!hasSelection}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              hasSelection ? "border-red-200 bg-white text-red-600 hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"
            }`}
          >
            삭제(휴지통 이동) {hasSelection ? selectedItemIds.length : ""}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
        <div className="hidden grid-cols-[0.4fr_1.2fr_1.4fr_0.7fr_0.7fr_0.8fr_0.8fr] gap-3 bg-stone-50 px-4 py-3 text-xs font-semibold text-stone-500 md:grid">
          <span>선택</span>
          <span>작지명</span>
          <span>파일명</span>
          <span>유형</span>
          <span>용량</span>
          <span>등록자</span>
          <span>상태</span>
        </div>
        <div className="divide-y divide-stone-200">
          {items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleItem(item.id)}
                className={`grid w-full gap-3 px-4 py-4 text-left text-sm transition md:grid-cols-[0.4fr_1.2fr_1.4fr_0.7fr_0.7fr_0.8fr_0.8fr] md:items-center ${
                  isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-transparent"}`}>✓</span>
                <div>
                  <p className="text-xs text-stone-400 md:hidden">작지명</p>
                  <p className="font-medium text-stone-900">{item.workorderTitle}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-stone-400 md:hidden">파일명</p>
                  <p className="truncate text-stone-700"><span className="mr-2 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">{item.fileIcon}</span>{item.fileName}</p>
                  <p className="mt-1 text-xs text-stone-400">{item.uploadedAt}</p>
                </div>
                <p className="text-stone-600">{item.fileType}</p>
                <p className="text-stone-600">{item.fileSizeLabel}</p>
                <p className="text-stone-600">{item.uploadedBy}</p>
                <span className="w-fit rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">{item.statusLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
