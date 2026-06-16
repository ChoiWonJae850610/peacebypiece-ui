"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import {
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_PILL_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
  ADMIN_STORAGE_VALUE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { WaflInfoBox, WaflSurface } from "@/components/common/ui";
import type { AdminStorageWorkOrderItem } from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatAdminTermCount } from "@/lib/i18n/adminTermFormatters";
import {
  formatTrashDetailCountLabel,
  getLocalizedWorkOrderStageLabel,
} from "@/components/admin/files/fileTrashSectionPresentation";

const WORKORDER_STORAGE_TABLE_GRID =
  "1.36fr 0.58fr 0.78fr 1.18fr 1.18fr 0.92fr";

type WorkOrderStorageSectionProps = {
  items: AdminStorageWorkOrderItem[];
};

function getTotalCount(
  items: AdminStorageWorkOrderItem[],
  readValue: (item: AdminStorageWorkOrderItem) => number,
) {
  return items.reduce((total, item) => total + readValue(item), 0);
}

function formatCount(count: number, t: ReturnType<typeof useAdminTranslation>) {
  return formatAdminTermCount(t, count, "item");
}

export default function WorkOrderStorageSection({
  items,
}: WorkOrderStorageSectionProps) {
  const t = useAdminTranslation();
  const deletedWorkOrderCount = items.length;
  const trashAttachmentCount = getTotalCount(
    items,
    (item) => item.trashAttachmentCount,
  );

  return (
    <WaflSurface as="section" component="storage-workorder-panel" tone="surface" className="flex h-full min-h-[420px] flex-col p-2.5 md:p-4">
      <AdminActionBar
        title={t("filesWorkOrders.title", "작업지시서 저장소")}
        description={t(
          "filesWorkOrders.description",
          "삭제한 작업지시서와 함께 휴지통으로 이동한 문서·디자인를 확인합니다.",
        )}
        actionsClassName="w-full [&>button]:w-full sm:w-auto sm:[&>button]:w-auto"
      >
        <span className={ADMIN_STORAGE_PILL_CLASS}>
          {t("filesWorkOrders.trashRetention", "30일 휴지통 보관")}
        </span>
        <AdminButton
          disabled
          title={t(
            "filesWorkOrders.restoreDisabledTitle",
            "작업지시서 묶음 복원은 다음 단계에서 연결합니다.",
          )}
        >
          {t("filesWorkOrders.restorePreparing", "작업지시서 복원 준비중")}
        </AdminButton>
      </AdminActionBar>

      <WaflInfoBox component="storage-workorder-restore-policy" tone="warning" shape="control" className="mt-3">
        <p className="font-semibold">
          {t("filesWorkOrders.restorePolicyNoticeTitle", "복원 정책 확인")}
        </p>
        <p className="mt-1 leading-5">
          {t(
            "filesWorkOrders.restorePolicyNotice",
            "작업지시서가 삭제 상태이면 문서·디자인는 개별 복원하거나 개별 삭제하지 않고 작업지시서 묶음 복원/삭제에서 함께 처리합니다. 삭제 완료 파일은 복원 대상에서 제외됩니다.",
          )}
        </p>
      </WaflInfoBox>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        <WaflSurface component="storage-workorder-summary-card" shape="control" tone="muted" className="px-3 py-3">
          <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] font-semibold`}>
            {t(
              "filesWorkOrders.summary.deletedWorkOrders",
              "삭제한 작업지시서",
            )}
          </p>
          <p className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1.5 text-lg font-semibold`}>
            {formatCount(deletedWorkOrderCount, t)}
          </p>
        </WaflSurface>
        <WaflSurface component="storage-workorder-summary-card" shape="control" tone="muted" className="px-3 py-3">
          <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] font-semibold`}>
            {t("filesWorkOrders.summary.trashAttachments", "묶음 문서/디자인")}
          </p>
          <p className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1.5 text-lg font-semibold`}>
            {formatCount(trashAttachmentCount, t)}
          </p>
        </WaflSurface>
      </div>

      <AdminTable
        className="mt-3 min-h-0 flex-1"
        items={items}
        getRowKey={(item) => item.id}
        emptyLabel={t(
          "filesWorkOrders.empty",
          "휴지통에 있는 작업지시서가 없습니다.",
        )}
        emptyDescription={t(
          "filesWorkOrders.emptyDescription",
          "작업지시서를 삭제하면 함께 이동한 문서와 디자인 묶음이 이 목록에 표시됩니다.",
        )}
        gridTemplateColumns={WORKORDER_STORAGE_TABLE_GRID}
        columns={[
          {
            key: "title",
            label: t(
              "filesWorkOrders.columns.title",
              `${t("terms.workOrder.singular", "작업지시서")}명`,
            ),
            render: (item) => (
              <div className="min-w-0">
                <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] md:hidden`}>
                  {t("filesWorkOrders.columns.title", "작업지시서명")}
                </p>
                <p className={`${ADMIN_STORAGE_VALUE_CLASS} truncate font-semibold`}>
                  {item.title}
                </p>
                <p className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} mt-1 truncate text-[10px]`}>
                  {item.id}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            label: t("filesWorkOrders.columns.status", "상태"),
            render: (item) => (
              <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} text-[11px] font-semibold`}>
                {getLocalizedWorkOrderStageLabel(item.statusLabel, t)}
              </p>
            ),
          },
          {
            key: "deletedAt",
            label: t("filesWorkOrders.columns.deletedAt", "삭제일시"),
            render: (item) => (
              <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} text-[11px]`}>
                {item.deletedAt || "-"}
              </p>
            ),
          },
          {
            key: "attachments",
            label: t(
              "filesWorkOrders.columns.attachments",
              t("terms.files.documentDesignGroup", "문서/디자인"),
            ),
            render: (item) => (
              <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} text-[11px] leading-4`}>
                {formatTrashDetailCountLabel(
                  item.attachmentSummaryLabel,
                  "documentsDesigns",
                  t,
                )}
              </p>
            ),
          },
          {
            key: "policy",
            label: t("filesWorkOrders.columns.policy", "복원 정책"),
            render: (item) => (
              <span className={`${ADMIN_STORAGE_PILL_CLASS} inline-flex px-2.5 py-1 text-[10px]`}>
                {t(
                  "filesList.restorePolicies.workorderBundle",
                  item.restorePolicyLabel,
                )}
              </span>
            ),
          },
        ]}
      />
    </WaflSurface>
  );
}
