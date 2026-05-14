"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_SELECT_INPUT_CLASS,
  ADMIN_STORAGE_CHECKBOX_CLASS,
  ADMIN_STORAGE_CHECKBOX_IDLE_CLASS,
  ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS,
  ADMIN_STORAGE_PANEL_CLASS,
  ADMIN_STORAGE_ROW_CLASS,
  ADMIN_STORAGE_SELECTED_ROW_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_VALUE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
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
    <section className={`${ADMIN_STORAGE_PANEL_CLASS} flex h-full min-h-[420px] flex-col p-2.5 md:p-4`}>
      <AdminActionBar
        title={t("filesList.title", `${t("terms.files.documentDesignGroup", "문서/디자인")} 목록`)}
        actionsClassName="w-full [&>button]:flex-1 [&>select]:min-w-0 [&>select]:flex-1 sm:w-auto sm:[&>button]:flex-none sm:[&>select]:flex-none"
      >
        <select value={sortKey} onChange={(event) => onChangeSort(event.target.value as AdminFileSortKey)} className={ADMIN_SELECT_INPUT_CLASS}>
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
        emptyDescription={t(
          "filesList.emptyDescription",
          "작업지시서에 업로드된 문서와 디자인 파일이 이곳에 표시됩니다.",
        )}
        gridTemplateColumns={FILE_TABLE_GRID}
        onRowClick={(item) => onToggleItem(item.id)}
        rowClassName={(item) => {
          const isSelected = selectedItemIds.includes(item.id);
          return `transition ${isSelected ? ADMIN_STORAGE_SELECTED_ROW_CLASS : ADMIN_STORAGE_ROW_CLASS}`;
        }}
        columns={[
          {
            key: "select",
            label: t("filesList.columns.select", "선택"),
            render: (item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return <span className={`${ADMIN_STORAGE_CHECKBOX_CLASS} ${isSelected ? ADMIN_STORAGE_CHECKBOX_SELECTED_CLASS : ADMIN_STORAGE_CHECKBOX_IDLE_CLASS}`}>✓</span>;
            },
          },
          {
            key: "workorder",
            label: t("filesList.columns.workorder", `${t("terms.workOrder.singular", "작업지시서")}명`),
            render: (item) => (
              <div className="min-w-0">
                <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] md:hidden`}>{t("filesList.columns.workorder", `${t("terms.workOrder.singular", "작업지시서")}명`)}</p>
                <p className={`${ADMIN_STORAGE_VALUE_CLASS} truncate font-semibold`}>{item.workorderTitle}</p>
              </div>
            ),
          },
          { key: "createdAt", label: t("filesList.columns.createdAt", "생성일자"), render: (item) => <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} text-[11px]`}>{item.uploadedAt}</p> },
          {
            key: "fileName",
            label: t("filesList.columns.fileName", "파일명"),
            render: (item) => (
              <div className="min-w-0">
                <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] md:hidden`}>{t("filesList.columns.fileName", "파일명")}</p>
                <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} truncate text-[11px]`}>{item.fileName}</p>
              </div>
            ),
          },
          { key: "type", label: t("filesList.columns.type", "유형"), render: (item) => <AdminStatusBadge size="xs" tone="neutral">{item.fileType}</AdminStatusBadge> },
          { key: "size", label: t("filesList.columns.size", "용량"), render: (item) => <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} text-[11px]`}>{item.fileSizeLabel}</p> },
        ]}
      />
    </section>
  );
}
