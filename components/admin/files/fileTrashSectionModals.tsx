"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import type { AdminStorageWorkOrderItem } from "@/lib/admin/files/types";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  TrashItemVisual,
  WorkOrderStageInline,
  formatTrashDetailCountLabel,
  getLocalizedWorkOrderStageLabel,
} from "@/components/admin/files/fileTrashSectionPresentation";
import type { UnifiedTrashRow } from "@/components/admin/files/fileTrashSectionRows";
import type {
  WorkOrderActionIntent,
  WorkOrderActionPreview,
} from "@/components/admin/files/fileTrashSectionActions";

type AdminT = ReturnType<typeof useAdminTranslation>;

export function EmptyTrashConfirmModal({
  open,
  canEmptyTrash,
  onClose,
  onConfirm,
  t,
}: {
  open: boolean;
  canEmptyTrash: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  t: AdminT;
}) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={t("filesList.emptyTrashConfirmTitle", "휴지통 비우기")}
      maxWidthClass="md:max-w-md"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            {t("filesList.no", "아니오")}
          </button>
          <button
            type="button"
            disabled={!canEmptyTrash}
            onClick={() => {
              onClose();
              onConfirm?.();
            }}
            className="rounded-full border border-red-600 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
          >
            {t("filesList.yes", "예")}
          </button>
        </div>
      }
    >
      <p className="text-sm font-medium text-stone-700">
        {t(
          "filesList.emptyTrashConfirmDescription",
          "휴지통의 모든 항목을 삭제 요청하시겠습니까?",
        )}
      </p>
    </ModalShell>
  );
}

export function WorkOrderActionPreviewModal({
  actionPreview,
  previewWorkOrder,
  bundleCount,
  blockedCount,
  totalSizeLabel,
  isPending,
  onClose,
  onRestoreWorkOrder,
  onPurgeWorkOrder,
  t,
}: {
  actionPreview: WorkOrderActionPreview | null;
  previewWorkOrder: AdminStorageWorkOrderItem | null;
  bundleCount: number;
  blockedCount: number;
  totalSizeLabel: string;
  isPending: boolean;
  onClose: () => void;
  onRestoreWorkOrder?: (workOrderId: string) => void;
  onPurgeWorkOrder?: (workOrderId: string) => void;
  t: AdminT;
}) {
  const intent: WorkOrderActionIntent | null = actionPreview?.intent ?? null;

  return (
    <ModalShell
      open={Boolean(actionPreview && previewWorkOrder)}
      onClose={onClose}
      title={
        intent === "purge"
          ? t("filesList.workorderPurgePreview", "선택 삭제 범위 확인")
          : t("filesList.workorderRestorePreview", "복원 범위 확인")
      }
      description={
        previewWorkOrder
          ? `${previewWorkOrder.title} · ${getLocalizedWorkOrderStageLabel(previewWorkOrder.statusLabel, t)}`
          : undefined
      }
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            {t("filesList.close", "닫기")}
          </button>
          <button
            type="button"
            disabled={isPending || !previewWorkOrder}
            onClick={() => {
              if (!previewWorkOrder) return;
              if (intent === "restore") {
                onRestoreWorkOrder?.(previewWorkOrder.id);
                onClose();
                return;
              }
              if (intent === "purge") {
                onPurgeWorkOrder?.(previewWorkOrder.id);
                onClose();
              }
            }}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${intent === "purge" ? "border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400" : "border-stone-900 bg-stone-900 text-white shadow-sm hover:bg-stone-800 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"}`}
          >
            {isPending
              ? t("filesList.processing", "처리 중")
              : intent === "purge"
                ? t("filesList.purge", "선택 삭제")
                : t("filesList.restore", "복원")}
          </button>
        </div>
      }
    >
      {actionPreview && previewWorkOrder ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-xs font-semibold text-stone-900">
              {previewWorkOrder.title}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {getLocalizedWorkOrderStageLabel(previewWorkOrder.statusLabel, t)} ·{" "}
              {t("filesList.columns.deletedAt", "삭제일시")} {previewWorkOrder.deletedAt || "-"}
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            <PreviewStatCard
              label={t("filesList.selectedScope.workorder", "작업지시서")}
              value={t("filesList.selectedScope.workorderValue", "대표 row 1건")}
            />
            <PreviewStatCard
              label={t("filesList.selectedScope.bundleAttachments", "문서/디자인/메모")}
              value={`${bundleCount}${t("filesList.countSuffix", "개")}`}
            />
            <PreviewStatCard
              label={t("filesList.selectedScope.restoreBlocked", "복원 제외 항목")}
              value={`${blockedCount}${t("filesList.countSuffix", "개")}`}
            />
            <PreviewStatCard
              label={t("filesList.selectedScope.totalSize", "파일 용량")}
              value={totalSizeLabel}
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
            <p className="font-semibold">
              {t(
                "filesList.workorderActionGuardTitle",
                "작업지시서 단위로 처리 범위를 확인합니다.",
              )}
            </p>
            <p className="text-[11px] text-amber-700">
              {intent === "restore"
                ? t(
                    "filesList.workorderRestoreConnectedNotice",
                    "작업지시서와 문서/디자인/메모가 함께 복원됩니다.",
                  )
                : t(
                    "filesList.workorderActionSkeletonNotice",
                    "선택 삭제는 고객관리자 삭제 요청으로 처리하고 휴지통 기본 목록에서 제외합니다. R2 파일 삭제는 시스템관리자 Worker 기반 purge 흐름에서만 처리됩니다.",
                  )}
            </p>
            <p>
              {intent === "restore"
                ? t(
                    "filesList.workorderRestoreGuardDescription",
                    "복원 시 작업지시서와 함께 삭제된 문서/디자인/메모를 함께 복원합니다.",
                  )
                : t(
                    "filesList.workorderPurgeGuardDescription",
                    "선택 삭제 시 고객관리자 삭제 요청 상태로 전환합니다. 실제 파일 삭제는 시스템관리자 처리 단계에서 진행합니다.",
                  )}
            </p>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}

function PreviewStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
      <p className="text-[10px] font-semibold text-stone-400">{label}</p>
      <p className="mt-1 text-[11px] font-medium text-stone-700">{value}</p>
    </div>
  );
}

export function TrashDetailModal({
  row,
  isActionPending,
  isWorkOrderActionPending,
  onClose,
  onRestoreItem,
  onPurgeItem,
  onRestoreWorkOrder,
  onPurgeWorkOrder,
  t,
}: {
  row: UnifiedTrashRow | null;
  isActionPending: boolean;
  isWorkOrderActionPending: boolean;
  onClose: () => void;
  onRestoreItem?: (itemId: string) => void;
  onPurgeItem?: (itemId: string) => void;
  onRestoreWorkOrder?: (workOrderId: string) => void;
  onPurgeWorkOrder?: (workOrderId: string) => void;
  t: AdminT;
}) {
  return (
    <ModalShell
      open={Boolean(row)}
      onClose={onClose}
      title={
        row?.kind === "workorder"
          ? t("filesList.detailTitles.workorder", "작업지시서 휴지통 상세")
          : t("filesList.detailTitles.file", "파일 휴지통 상세")
      }
      description={row?.targetLabel}
      maxWidthClass="md:max-w-xl"
      footer={
        row ? (
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              {t("filesList.close", "닫기")}
            </button>
            <button
              type="button"
              disabled={
                row.kind === "attachment"
                  ? isActionPending || !row.canRestore
                  : isWorkOrderActionPending
              }
              onClick={() => {
                if (row.kind === "workorder") {
                  onRestoreWorkOrder?.(row.id);
                } else {
                  onRestoreItem?.(row.id);
                }
                onClose();
              }}
              className="rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
              title={
                row.kind === "attachment"
                  ? (row.restoreDisabledReason ?? undefined)
                  : row.restoreDisabledReason
              }
            >
              {t("filesList.restore", "복원")}
            </button>
            <button
              type="button"
              disabled={
                row.kind === "attachment"
                  ? isActionPending || !row.canPurge
                  : isWorkOrderActionPending
              }
              onClick={() => {
                if (row.kind === "workorder") {
                  onPurgeWorkOrder?.(row.id);
                } else {
                  onPurgeItem?.(row.id);
                }
                onClose();
              }}
              className="rounded-full border border-red-600 bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400"
              title={
                row.kind === "attachment"
                  ? (row.purgeDisabledReason ?? undefined)
                  : row.purgeDisabledReason
              }
            >
              {t("filesList.purge", "선택 삭제")}
            </button>
          </div>
        ) : null
      }
    >
      {row ? <TrashDetailContent row={row} t={t} /> : null}
    </ModalShell>
  );
}

function TrashDetailContent({ row, t }: { row: UnifiedTrashRow; t: AdminT }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
        <TrashItemVisual
          label={row.visualLabel}
          tone={row.visualTone}
          thumbnailUrl={row.thumbnailUrl || row.previewUrl}
        />
        <div className="min-w-0">
          <p
            className="truncate text-[13px] font-medium text-stone-700"
            title={row.targetLabel}
          >
            {row.targetLabel}
          </p>
          <p
            className="mt-1 truncate text-xs text-stone-500"
            title={row.workorderTitle}
          >
            {row.workorderTitle}
          </p>
        </div>
      </div>

      {row.kind === "attachment" && row.previewUrl ? (
        <a
          href={row.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-medium text-stone-600 shadow-sm transition hover:bg-stone-50"
        >
          {t("filesList.detail.openPreview", "파일 미리보기 열기")}
        </a>
      ) : null}
      {row.kind === "workorder" ? (
        <WorkOrderStageInline statusLabel={row.sourceItem.statusLabel} t={t} />
      ) : null}

      <div className="grid gap-2 md:grid-cols-2">
        {getTrashDetailFields(row, t).map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-stone-400">
              {label}
            </p>
            <p
              className="mt-1 truncate text-sm font-normal text-stone-600"
              title={value}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
      <p className="rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-500">
        {row.kind === "workorder"
          ? t(
              "filesList.detail.workorderActionHint",
              "작업지시서와 문서/디자인/메모가 함께 복원됩니다.",
            )
          : row.restoreDisabledReason ||
            row.purgeDisabledReason ||
            t(
              "filesList.detail.fileActionHint",
              "이 파일만 복원하거나 삭제 요청할 수 있습니다.",
            )}
      </p>
    </div>
  );
}

function getTrashDetailFields(
  row: UnifiedTrashRow,
  t: AdminT,
): [string, string][] {
  if (row.kind === "workorder") {
    return [
      [t("filesList.columns.type", "유형"), row.typeLabel],
      [
        t("filesList.detail.documentsDesigns", "문서/디자인"),
        formatTrashDetailCountLabel(row.sourceItem.attachmentSummaryLabel, "documentsDesigns", t),
      ],
      [t("filesList.detail.memos", "메모"), formatTrashDetailCountLabel(row.sourceItem.memoSummaryLabel, "memos", t)],
      [t("filesList.columns.deletedAt", "삭제일시"), row.deletedAt],
    ];
  }

  return [
    [t("filesList.columns.type", "유형"), row.typeLabel],
    [t("filesList.columns.size", "용량"), row.sizeLabel],
    [t("filesList.columns.workorder", "작업지시서"), row.workorderTitle],
    [t("filesList.columns.deletedAt", "삭제일시"), row.deletedAt],
  ];
}
