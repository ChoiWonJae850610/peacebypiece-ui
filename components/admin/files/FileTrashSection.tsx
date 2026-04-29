"use client";

import type { AdminTrashFileItem } from "@/lib/admin/adminFiles.types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onRestore: () => void;
  onPurge: () => void;
};

function getTrashFileType(item: AdminTrashFileItem, t: ReturnType<typeof useAdminTranslation>) {
  if (item.fileIcon === "PDF") return t("filesList.fileTypes.document", "문서");
  if (item.fileIcon === "IMG") return t("filesList.fileTypes.design", "디자인");
  return t("filesList.fileTypes.other", "기타");
}

export default function FileTrashSection({ items, selectedItemIds, onToggleItem, onToggleAll, onRestore, onPurge }: FileTrashSectionProps) {
  const hasSelection = selectedItemIds.length > 0;
  const t = useAdminTranslation();
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[28px] border border-stone-200 bg-white p-3.5 shadow-sm">
      <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-base font-semibold tracking-tight text-stone-950">{t("trashPage.title", "휴지통")}</h2>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={onToggleAll} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50">
            {allSelected ? t("filesList.clearAll", "전체 해제") : t("filesList.selectAll", "전체 선택")}
          </button>
          <button type="button" onClick={onRestore} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${hasSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
            {t("filesList.restore", "복구")} {hasSelection ? selectedItemIds.length : ""}
          </button>
          <button type="button" onClick={onPurge} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${hasSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
            {t("filesList.purge", "영구 삭제")} {hasSelection ? selectedItemIds.length : ""}
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-stone-200">
        <div className="hidden grid-cols-[0.38fr_1.08fr_0.82fr_1.72fr_0.68fr_0.72fr] gap-3 bg-stone-50 px-4 py-1.5 text-[10px] font-semibold text-stone-500 md:grid">
          <span>{t("filesList.columns.select", "선택")}</span>
          <span>{t("filesList.columns.workorder", "작지명")}</span>
          <span>{t("filesList.columns.deletedAt", "삭제일자")}</span>
          <span>{t("filesList.columns.fileName", "파일명")}</span>
          <span>{t("filesList.columns.type", "유형")}</span>
          <span>{t("filesList.columns.size", "용량")}</span>
        </div>
        <div className="min-h-0 flex-1 divide-y divide-stone-200 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex min-h-full items-center justify-center bg-white px-4 py-10 text-center text-sm text-stone-500">{t("filesList.trashEmpty", "휴지통에 보관 중인 파일이 없습니다.")}</div>
          ) : null}
          {items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <button key={item.id} type="button" onClick={() => onToggleItem(item.id)} className={`grid w-full gap-3 px-4 py-1.5 text-left text-[11px] transition md:grid-cols-[0.38fr_1.08fr_0.82fr_1.72fr_0.68fr_0.72fr] md:items-center ${isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}>✓</span>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.workorder", "작지명")}</p>
                  <p className="truncate font-semibold text-stone-950">{item.workorderTitle}</p>
                </div>
                <p className="text-[11px] text-stone-600">{item.deletedAt}</p>
                <div className="min-w-0">
                  <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.fileName", "파일명")}</p>
                  <p className="truncate text-[11px] text-stone-700">{item.fileName}</p>
                </div>
                <p className="text-[11px] text-stone-600">{getTrashFileType(item, t)}</p>
                <p className="text-[11px] text-stone-600">{item.fileSizeLabel}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
