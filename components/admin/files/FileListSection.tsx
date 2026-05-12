"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
import { ADMIN_FILE_SORT_OPTIONS } from "@/lib/admin/files/presentation";
import type { AdminFileSortKey, AdminManagedFileItem } from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type FileListSectionProps = {
  items: AdminManagedFileItem[];
  selectedItemIds: string[];
  sortKey: AdminFileSortKey;
  onChangeSort: (sortKey: AdminFileSortKey) => void;
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onMoveToTrash: () => void;
  isActionPending?: boolean;
};

const FILE_TABLE_GRID = "0.38fr 1.08fr 0.82fr 1.72fr 0.68fr 0.72fr";

export default function FileListSection({ items, selectedItemIds, sortKey, onChangeSort, onToggleItem, onToggleAll, onMoveToTrash, isActionPending = false }: FileListSectionProps) {
  const hasSelection = selectedItemIds.length > 0;
  const canAct = hasSelection && !isActionPending;
  const t = useAdminTranslation();
  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar title={t("filesList.title", `${t("terms.files.documentDesignGroup", "문서/디자인")} 목록`)}>
        <select value={sortKey} onChange={(event) => onChangeSort(event.target.value as AdminFileSortKey)} className="rounded-full border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-sm">
          {ADMIN_FILE_SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>{t(`filesList.sort.${option.key}`, option.label)}</option>
          ))}
        </select>
        <AdminButton onClick={onToggleAll} disabled={isActionPending || items.length === 0}>
          {allSelected ? t("filesList.clearAll", "전체 해제") : t("filesList.selectAll", "전체 선택")}
        </AdminButton>
        <AdminButton variant="danger" onClick={onMoveToTrash} disabled={!canAct}>
          {isActionPending ? t("filesList.processing", "처리 중") : t("filesList.delete", "삭제")} {hasSelection ? selectedItemIds.length : ""}
        </AdminButton>
      </AdminActionBar>

      <AdminTable
        className="mt-3 min-h-0 flex-1"
        items={items}
        getRowKey={(item) => item.id}
        emptyLabel={t("filesList.empty", `${t("terms.files.documentDesignGroup", "문서/디자인")}이 없습니다.`)}
        gridTemplateColumns={FILE_TABLE_GRID}
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
            label: t("filesList.columns.workorder", `${t("terms.workOrder.singular", "작업지시서")}명`),
            render: (item) => (
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 md:hidden">{t("filesList.columns.workorder", `${t("terms.workOrder.singular", "작업지시서")}명`)}</p>
                <p className="truncate font-semibold text-stone-950">{item.workorderTitle}</p>
              </div>
            ),
          },
          { key: "createdAt", label: t("filesList.columns.createdAt", "생성일자"), render: (item) => <p className="text-[11px] text-stone-600">{item.uploadedAt}</p> },
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
          { key: "type", label: t("filesList.columns.type", "유형"), render: (item) => <AdminStatusBadge size="xs" tone="neutral">{item.fileType}</AdminStatusBadge> },
          { key: "size", label: t("filesList.columns.size", "용량"), render: (item) => <p className="text-[11px] text-stone-600">{item.fileSizeLabel}</p> },
        ]}
      />
    </section>
  );
}
