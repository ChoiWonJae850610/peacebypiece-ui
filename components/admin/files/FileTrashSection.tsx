"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import AdminTable from "@/components/admin/common/AdminTable";
import type { AdminTrashFileItem } from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type FileTrashSectionProps = {
  items: AdminTrashFileItem[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onRestore: () => void;
  onPurge: () => void;
};

const TRASH_TABLE_GRID = "0.38fr 1.08fr 0.82fr 1.72fr 0.68fr 0.72fr";

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
      <AdminActionBar title={t("trashPage.title", "휴지통")}>
        <button type="button" onClick={onToggleAll} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50">
          {allSelected ? t("filesList.clearAll", "전체 해제") : t("filesList.selectAll", "전체 선택")}
        </button>
        <button type="button" onClick={onRestore} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${hasSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
          {t("filesList.restore", "복구")} {hasSelection ? selectedItemIds.length : ""}
        </button>
        <button type="button" onClick={onPurge} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${hasSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`} disabled={!hasSelection}>
          {t("filesList.purge", "영구 삭제")} {hasSelection ? selectedItemIds.length : ""}
        </button>
      </AdminActionBar>

      <AdminTable
        className="mt-2.5"
        items={items}
        getRowKey={(item) => item.id}
        emptyLabel={t("filesList.trashEmpty", "휴지통에 보관 중인 파일이 없습니다.")}
        gridTemplateColumns={TRASH_TABLE_GRID}
        onRowClick={(item) => onToggleItem(item.id)}
        rowClassName={(item) => {
          const isSelected = selectedItemIds.includes(item.id);
          return `transition ${isSelected ? "bg-stone-100" : "bg-white hover:bg-stone-50"}`;
        }}
        columns={[
          {
            key: "select",
            label: t("filesList.columns.select", "선택"),
            render: (item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return <span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${isSelected ? "border-stone-950 bg-stone-950 text-white" : "border-stone-300 bg-white text-transparent"}`}>✓</span>;
            },
          },
          {
            key: "workorder",
            label: t("filesList.columns.workorder", "작업지시서명"),
            render: (item) => (
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.workorder", "작업지시서명")}</p>
                <p className="truncate font-semibold text-stone-950">{item.workorderTitle}</p>
              </div>
            ),
          },
          { key: "deletedAt", label: t("filesList.columns.deletedAt", "삭제일자"), render: (item) => <p className="text-[11px] text-stone-600">{item.deletedAt}</p> },
          {
            key: "fileName",
            label: t("filesList.columns.fileName", "파일명"),
            render: (item) => (
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.fileName", "파일명")}</p>
                <p className="truncate text-[11px] text-stone-700">{item.fileName}</p>
              </div>
            ),
          },
          { key: "type", label: t("filesList.columns.type", "유형"), render: (item) => <p className="text-[11px] text-stone-600">{getTrashFileType(item, t)}</p> },
          { key: "size", label: t("filesList.columns.size", "용량"), render: (item) => <p className="text-[11px] text-stone-600">{item.fileSizeLabel}</p> },
        ]}
      />
    </section>
  );
}
