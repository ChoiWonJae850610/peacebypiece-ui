"use client";

import AdminActionBar from "@/components/admin/common/AdminActionBar";
import AdminTable from "@/components/admin/common/AdminTable";
import type { AdminStorageWorkOrderItem } from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

const WORKORDER_STORAGE_TABLE_GRID = "1.36fr 0.56fr 0.66fr 0.82fr 0.82fr 0.92fr";

type WorkOrderStorageSectionProps = {
  items: AdminStorageWorkOrderItem[];
};

function getTotalCount(items: AdminStorageWorkOrderItem[], readValue: (item: AdminStorageWorkOrderItem) => number) {
  return items.reduce((total, item) => total + readValue(item), 0);
}

export default function WorkOrderStorageSection({ items }: WorkOrderStorageSectionProps) {
  const t = useAdminTranslation();
  const deletedWorkOrderCount = items.length;
  const trashAttachmentCount = getTotalCount(items, (item) => item.trashAttachmentCount);
  const trashMemoCount = getTotalCount(items, (item) => item.trashMemoCount);

  return (
    <section className="flex h-full min-h-[420px] flex-col rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm">
      <AdminActionBar
        title={t("filesWorkOrders.title", "작업지시서 저장소")}
        description={t("filesWorkOrders.description", "삭제된 작업지시서와 함께 휴지통으로 이동한 첨부파일·메모를 읽기 전용으로 확인합니다.")}
      >
        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-600">
          {t("filesWorkOrders.trashRetention", "30일 휴지통 보관")}
        </span>
        <button
          type="button"
          disabled
          className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-400"
          title={t("filesWorkOrders.restoreDisabledTitle", "작업지시서 묶음 복원은 다음 단계에서 연결합니다.")}
        >
          {t("filesWorkOrders.restorePreparing", "작업지시서 복원 준비중")}
        </button>
      </AdminActionBar>

      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-3 text-xs text-amber-800">
        <p className="font-semibold">{t("filesWorkOrders.restorePolicyNoticeTitle", "복원 정책 확인")}</p>
        <p className="mt-1 leading-5">{t("filesWorkOrders.restorePolicyNotice", "작업지시서가 삭제 상태이면 연결 첨부·메모는 개별 복구하거나 개별 영구삭제하지 않고 작업지시서 묶음 복원/삭제에서 함께 처리합니다. purge 완료 파일은 복원 대상에서 제외됩니다.")}</p>
      </div>

      <div className="mt-3 grid gap-2.5 md:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3">
          <p className="text-[10px] font-semibold text-stone-500">{t("filesWorkOrders.summary.deletedWorkOrders", "삭제된 작업지시서")}</p>
          <p className="mt-1.5 text-lg font-semibold text-stone-950">{deletedWorkOrderCount}{t("filesWorkOrders.units.count", "개")}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3">
          <p className="text-[10px] font-semibold text-stone-500">{t("filesWorkOrders.summary.trashAttachments", "묶음 휴지통 첨부")}</p>
          <p className="mt-1.5 text-lg font-semibold text-stone-950">{trashAttachmentCount}{t("filesWorkOrders.units.count", "개")}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3">
          <p className="text-[10px] font-semibold text-stone-500">{t("filesWorkOrders.summary.trashMemos", "묶음 휴지통 메모")}</p>
          <p className="mt-1.5 text-lg font-semibold text-stone-950">{trashMemoCount}{t("filesWorkOrders.units.count", "개")}</p>
        </div>
      </div>

      <AdminTable
        className="mt-3 min-h-0 flex-1"
        items={items}
        getRowKey={(item) => item.id}
        emptyLabel={t("filesWorkOrders.empty", "휴지통에 있는 작업지시서가 없습니다.")}
        gridTemplateColumns={WORKORDER_STORAGE_TABLE_GRID}
        columns={[
          {
            key: "title",
            label: t("filesWorkOrders.columns.title", "작업지시서명"),
            render: (item) => (
              <div className="min-w-0">
                <p className="text-[10px] text-stone-400 md:hidden">{t("filesWorkOrders.columns.title", "작업지시서명")}</p>
                <p className="truncate font-semibold text-stone-950">{item.title}</p>
                <p className="mt-1 truncate text-[10px] text-stone-400">{item.id}</p>
              </div>
            ),
          },
          { key: "status", label: t("filesWorkOrders.columns.status", "상태"), render: (item) => <p className="text-[11px] font-semibold text-stone-700">{item.statusLabel}</p> },
          { key: "deletedAt", label: t("filesWorkOrders.columns.deletedAt", "삭제일"), render: (item) => <p className="text-[11px] text-stone-600">{item.deletedAt || "-"}</p> },
          { key: "attachments", label: t("filesWorkOrders.columns.attachments", "첨부"), render: (item) => <p className="text-[11px] text-stone-600">{item.attachmentCount} / {item.trashAttachmentCount}</p> },
          { key: "memos", label: t("filesWorkOrders.columns.memos", "메모"), render: (item) => <p className="text-[11px] text-stone-600">{item.memoCount} / {item.trashMemoCount}</p> },
          {
            key: "policy",
            label: t("filesWorkOrders.columns.policy", "복원 정책"),
            render: (item) => (
              <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[10px] font-semibold text-stone-500">
                {item.restorePolicyLabel}
              </span>
            ),
          },
        ]}
      />
    </section>
  );
}
