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
  isActionPending?: boolean;
};

const TRASH_TABLE_GRID = "0.36fr 1.02fr 0.72fr 1.45fr 0.62fr 0.62fr 0.9fr";

function getTrashFileType(item: AdminTrashFileItem, t: ReturnType<typeof useAdminTranslation>) {
  if (item.fileIcon === "PDF") return t("filesList.fileTypes.document", "문서");
  if (item.fileIcon === "IMG") return t("filesList.fileTypes.design", "디자인");
  return t("filesList.fileTypes.other", "기타");
}

export default function FileTrashSection({ items, selectedItemIds, onToggleItem, onToggleAll, onRestore, onPurge, isActionPending = false }: FileTrashSectionProps) {
  const hasSelection = selectedItemIds.length > 0;
  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const hasRestoreBlockedSelection = selectedItems.some((item) => !item.canRestore);
  const hasPurgeBlockedSelection = selectedItems.some((item) => !item.canPurge);
  const canAct = hasSelection && !isActionPending;
  const canRestoreSelection = canAct && !hasRestoreBlockedSelection;
  const canPurgeSelection = canAct && !hasPurgeBlockedSelection;
  const t = useAdminTranslation();
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar title={t("trashPage.title", "휴지통")}>
        <button type="button" onClick={onToggleAll} disabled={isActionPending || items.length === 0} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400">
          {allSelected ? t("filesList.clearAll", "전체 해제") : t("filesList.selectAll", "전체 선택")}
        </button>
        <button
          type="button"
          onClick={onRestore}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canRestoreSelection ? "border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
          disabled={!canRestoreSelection}
          title={hasRestoreBlockedSelection ? t("filesList.restoreBlockedByWorkOrder", "삭제된 작업지시서의 연결 파일은 작업지시서 묶음 복원에서 처리해야 합니다.") : undefined}
        >
          {isActionPending ? t("filesList.processing", "처리 중") : t("filesList.restore", "복구")} {hasSelection ? selectedItemIds.length : ""}
        </button>
        <button
          type="button"
          onClick={onPurge}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${canPurgeSelection ? "border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50" : "border-stone-200 bg-stone-50 text-stone-400"}`}
          disabled={!canPurgeSelection}
          title={hasPurgeBlockedSelection ? t("filesList.purgeBlockedByWorkOrder", "삭제된 작업지시서의 연결 파일은 작업지시서 묶음 삭제/purge에서 처리해야 합니다.") : undefined}
        >
          {isActionPending ? t("filesList.processing", "처리 중") : t("filesList.purge", "영구 삭제")} {hasSelection ? selectedItemIds.length : ""}
        </button>
      </AdminActionBar>

      <AdminTable
        className="mt-3 min-h-0 flex-1"
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
          {
            key: "restorePolicy",
            label: t("filesList.columns.restorePolicy", "복구 정책"),
            render: (item) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${item.canRestore ? "border-stone-200 bg-stone-50 text-stone-600" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                title={item.restoreDisabledReason ?? undefined}
              >
                {item.canRestore && item.canPurge ? t("filesList.restoreAvailable", "개별 처리 가능") : t("filesList.restoreWithWorkOrder", "묶음 처리 필요")}
              </span>
            ),
          },
        ]}
      />
    </section>
  );
}
