"use client";

import { useEffect, useMemo, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import AdminShell from "@/components/admin/layout/AdminShell";
import {
  runPurgeTrashItemsFlow,
  runRestoreTrashItemsFlow,
} from "@/lib/admin/files/actionFlow";
import { getAdminFileManagementSnapshot } from "@/lib/admin/files/adapter";
import {
  buildAdminSelectAllIds,
  selectAdminTrashItemsByIds,
} from "@/lib/admin/files/selectors";
import type {
  AdminFileManagementSnapshot,
  AdminFileTrendPeriod,
} from "@/lib/admin/files/types";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

const FILE_ADMIN_NAVIGATION_ITEMS = getAdminNavigationItems("/admin/files");

export default function AdminFilesPage() {
  const t = useAdminTranslation();
  const placeholderSnapshot = useMemo(
    () => getAdminFileManagementSnapshot(),
    [],
  );
  const [snapshot, setSnapshot] =
    useState<AdminFileManagementSnapshot>(placeholderSnapshot);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<AdminFileTrendPeriod>(7);
  const [selectedTrashItemIds, setSelectedTrashItemIds] = useState<string[]>(
    [],
  );
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>(
    [],
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingFileAction, setPendingFileAction] = useState<
    "restore" | "purge" | null
  >(null);
  const [pendingWorkOrderAction, setPendingWorkOrderAction] = useState<
    "restore" | "purge" | null
  >(null);

  async function refreshSnapshot() {
    setIsLoadingSnapshot(true);
    try {
      const response = await fetch(
        `/api/admin/files/snapshot?period=${trendPeriod}&t=${Date.now()}`,
        { method: "GET", cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as {
        snapshot?: AdminFileManagementSnapshot;
        message?: string;
      } | null;

      if (payload?.snapshot) {
        setSnapshot(payload.snapshot);
      }

      if (!response.ok && payload?.message) {
        setActionMessage(
          t(
            "filesPage.snapshotLoadFailedWithMessage",
            "파일 목록 DB 조회 실패: {message}",
            { message: payload.message },
          ),
        );
      }
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? t(
              "filesPage.snapshotLoadFailedWithMessage",
              "파일 목록 DB 조회 실패: {message}",
              { message: error.message },
            )
          : t("filesPage.snapshotLoadFailed", "파일 목록 DB 조회 실패"),
      );
    } finally {
      setIsLoadingSnapshot(false);
    }
  }

  useEffect(() => {
    refreshSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendPeriod]);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

  const selectedTrashItems = useMemo(
    () => selectAdminTrashItemsByIds(snapshot.trashItems, selectedTrashItemIds),
    [selectedTrashItemIds, snapshot.trashItems],
  );

  function toggleTrashItemId(itemId: string) {
    setSelectedTrashItemIds((currentIds) =>
      currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId],
    );
    setActionMessage(null);
  }

  function toggleWorkOrderId(workOrderId: string) {
    setSelectedWorkOrderIds((currentIds) =>
      currentIds.includes(workOrderId)
        ? currentIds.filter((id) => id !== workOrderId)
        : [...currentIds, workOrderId],
    );
    setActionMessage(null);
  }

  function handleToggleAllTrashItems() {
    const selectableItems = snapshot.trashItems.filter(
      (item) => item.restorePolicy !== "bundle_required",
    );
    const selectableWorkOrderIds = (snapshot.workOrders ?? []).map(
      (item) => item.id,
    );
    const allSelected =
      selectableItems.length + selectableWorkOrderIds.length > 0 &&
      selectedTrashItemIds.length === selectableItems.length &&
      selectedWorkOrderIds.length === selectableWorkOrderIds.length;

    setSelectedTrashItemIds(
      allSelected ? [] : buildAdminSelectAllIds(selectableItems, []),
    );
    setSelectedWorkOrderIds(allSelected ? [] : selectableWorkOrderIds);
    setActionMessage(null);
  }

  async function handleRestoreTrashItem(itemIds?: string[]) {
    if (pendingFileAction) return;
    const targets = itemIds
      ? selectAdminTrashItemsByIds(snapshot.trashItems, itemIds)
      : selectedTrashItems;
    setPendingFileAction("restore");
    try {
      const result = await runRestoreTrashItemsFlow(targets);
      setActionMessage(result.message);
      if (result.ok) {
        setSelectedTrashItemIds([]);
        await refreshSnapshot();
      }
    } finally {
      setPendingFileAction(null);
    }
  }

  function createRestoreSelectionMessage(input: {
    fileCount: number;
    workOrderCount: number;
    skippedCount: number;
  }) {
    const messages: string[] = [];
    if (input.workOrderCount > 0 && input.fileCount > 0) {
      messages.push(
        `작업지시서 ${input.workOrderCount}건과 파일 ${input.fileCount}개를 복구했습니다.`,
      );
    } else if (input.workOrderCount > 0) {
      messages.push(`작업지시서 ${input.workOrderCount}건을 복구했습니다.`);
    } else if (input.fileCount > 0) {
      messages.push(`파일 ${input.fileCount}개를 복구했습니다.`);
    }
    if (input.skippedCount > 0) {
      messages.push(`복구할 수 없는 항목 ${input.skippedCount}개는 제외했습니다.`);
    }
    return messages.join(" ");
  }

  function createPurgeSelectionMessage(input: {
    fileCount: number;
    blockedWorkOrderCount: number;
    skippedFileCount: number;
  }) {
    const messages: string[] = [];
    if (input.fileCount > 0) {
      messages.push(`파일 ${input.fileCount}개를 영구삭제 요청했습니다.`);
    }
    if (input.blockedWorkOrderCount > 0) {
      messages.push(
        `작업지시서 ${input.blockedWorkOrderCount}건은 아직 영구삭제할 수 없습니다.`,
      );
    }
    if (input.skippedFileCount > 0) {
      messages.push(
        `영구삭제할 수 없는 파일 ${input.skippedFileCount}개는 제외했습니다.`,
      );
    }
    return messages.join(" ");
  }

  async function restoreWorkOrderById(workOrderId: string) {
    const response = await fetch("/api/admin/files/workorders/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId, restoredBy: "admin" }),
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
      affectedCount?: number;
      requestedCount?: number;
    } | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(
        payload?.message || `WORKORDER_RESTORE_FAILED_${response.status}`,
      );
    }
    return payload;
  }

  async function handleRestoreSelection() {
    if (pendingFileAction || pendingWorkOrderAction) return;
    const fileTargets = selectedTrashItems.filter((item) => item.canRestore);
    const workOrderTargets = [...selectedWorkOrderIds];

    if (fileTargets.length === 0 && workOrderTargets.length === 0) {
      setActionMessage("복구 가능한 선택 항목이 없습니다.");
      return;
    }

    setPendingFileAction(fileTargets.length > 0 ? "restore" : null);
    setPendingWorkOrderAction(workOrderTargets.length > 0 ? "restore" : null);
    try {
      let restoredFileCount = 0;
      if (fileTargets.length > 0) {
        const result = await runRestoreTrashItemsFlow(fileTargets);
        restoredFileCount = result.ok ? fileTargets.length : 0;
      }

      let restoredWorkOrderCount = 0;
      for (const workOrderId of workOrderTargets) {
        await restoreWorkOrderById(workOrderId);
        restoredWorkOrderCount += 1;
      }

      const skippedCount = selectedTrashItems.length - fileTargets.length;
      setActionMessage(
        createRestoreSelectionMessage({
          fileCount: restoredFileCount,
          workOrderCount: restoredWorkOrderCount,
          skippedCount,
        }),
      );
      setSelectedTrashItemIds([]);
      setSelectedWorkOrderIds([]);
      await refreshSnapshot();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "선택 항목 복구 요청에 실패했습니다.",
      );
    } finally {
      setPendingFileAction(null);
      setPendingWorkOrderAction(null);
    }
  }

  async function handlePurgeSelection() {
    if (pendingFileAction || pendingWorkOrderAction) return;
    const fileTargets = selectedTrashItems.filter((item) => item.canPurge);
    const blockedWorkOrderCount = selectedWorkOrderIds.length;

    if (fileTargets.length === 0 && blockedWorkOrderCount === 0) {
      setActionMessage("영구삭제 가능한 선택 항목이 없습니다.");
      return;
    }

    setPendingFileAction(fileTargets.length > 0 ? "purge" : null);
    try {
      let purgedFileCount = 0;
      if (fileTargets.length > 0) {
        const result = await runPurgeTrashItemsFlow(fileTargets);
        purgedFileCount = result.ok ? fileTargets.length : 0;
      }
      const skippedFileCount = selectedTrashItems.length - fileTargets.length;

      setActionMessage(
        createPurgeSelectionMessage({
          fileCount: purgedFileCount,
          blockedWorkOrderCount,
          skippedFileCount,
        }),
      );
      setSelectedTrashItemIds([]);
      if (fileTargets.length > 0) await refreshSnapshot();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "선택 항목 영구삭제 요청에 실패했습니다.",
      );
    } finally {
      setPendingFileAction(null);
    }
  }

  async function handleRestoreWorkOrder(workOrderId: string) {
    if (pendingWorkOrderAction) return;
    setPendingWorkOrderAction("restore");
    try {
      const payload = await restoreWorkOrderById(workOrderId);
      setActionMessage(payload.message || "작업지시서 1건을 복구했습니다.");
      setSelectedWorkOrderIds((currentIds) =>
        currentIds.filter((id) => id !== workOrderId),
      );
      setSelectedTrashItemIds([]);
      await refreshSnapshot();
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "작업지시서 복구 요청에 실패했습니다.",
      );
    } finally {
      setPendingWorkOrderAction(null);
    }
  }

  async function handlePurgeTrashItem(itemIds?: string[]) {
    if (pendingFileAction) return;
    const targets = itemIds
      ? selectAdminTrashItemsByIds(snapshot.trashItems, itemIds)
      : selectedTrashItems;
    setPendingFileAction("purge");
    try {
      const result = await runPurgeTrashItemsFlow(targets);
      setActionMessage(result.message);
      if (result.ok) {
        setSelectedTrashItemIds([]);
        await refreshSnapshot();
      }
    } finally {
      setPendingFileAction(null);
    }
  }

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={FILE_ADMIN_NAVIGATION_ITEMS}
      title={t("filesPage.title", "저장소 관리")}
    >
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
        <FileStorageSummary
          usageCards={snapshot.usageCards}
          usageSummary={snapshot.usageSummary}
          recentUploadTrend={snapshot.recentUploadTrend}
          recentUploadTrendPeriod={trendPeriod}
          fileTypeDistribution={snapshot.fileTypeDistribution}
          isRefreshing={isLoadingSnapshot}
          onChangeTrendPeriod={setTrendPeriod}
          onRefresh={refreshSnapshot}
        />

        <ToastMessage message={actionMessage} />

        <div className="mt-4 h-[560px] min-h-[440px] flex-1 overflow-hidden">
          <FileTrashSection
            items={snapshot.trashItems}
            workOrderItems={snapshot.workOrders ?? []}
            selectedItemIds={selectedTrashItemIds}
            selectedWorkOrderIds={selectedWorkOrderIds}
            onToggleItem={toggleTrashItemId}
            onToggleWorkOrder={toggleWorkOrderId}
            onToggleAll={handleToggleAllTrashItems}
            onRestore={handleRestoreSelection}
            onPurge={handlePurgeSelection}
            onRestoreItem={(itemId) => handleRestoreTrashItem([itemId])}
            onPurgeItem={(itemId) => handlePurgeTrashItem([itemId])}
            onRestoreWorkOrder={handleRestoreWorkOrder}
            isActionPending={pendingFileAction !== null}
            isWorkOrderActionPending={pendingWorkOrderAction !== null}
          />
        </div>
      </section>
    </AdminShell>
  );
}
