"use client";

import { useEffect, useMemo, useState } from "react";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import {
  runPurgeAllTrashItemsFlow,
  runTrashSelectionActionFlow,
} from "@/lib/admin/files/actionFlow";
import { getAdminFileManagementSnapshot } from "@/lib/admin/files/adapter";
import type {
  AdminFileManagementSnapshot,
  AdminTrashActionType,
} from "@/lib/admin/files/types";
import type { WorkspaceNavigationItem } from "@/lib/navigation/workspaceNavigation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { APP_VERSION } from "@/lib/constants/app";
import { waflLegacyApiRequest } from "@/lib/api/waflApiClient";

type AdminFilesWorkspaceClientProps = {
  navigationItems: WorkspaceNavigationItem[];
};

export default function AdminFilesWorkspaceClient({ navigationItems }: AdminFilesWorkspaceClientProps) {
  const t = useAdminTranslation();
  const initialSnapshot = useMemo(
    () => getAdminFileManagementSnapshot(),
    [],
  );
  const [snapshot, setSnapshot] =
    useState<AdminFileManagementSnapshot>(initialSnapshot);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [selectedTrashItemIds, setSelectedTrashItemIds] = useState<string[]>(
    [],
  );
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>(
    [],
  );
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionToastTone, setActionToastTone] = useState<ToastTone>("info");
  const [actionToastEventKey, setActionToastEventKey] = useState(0);
  const [pendingFileAction, setPendingFileAction] = useState<
    "restore" | "purge" | null
  >(null);
  const [pendingWorkOrderAction, setPendingWorkOrderAction] = useState<
    "restore" | "purge" | null
  >(null);

  function showActionToast(message: string, tone: ToastTone = "info") {
    setActionMessage(message);
    setActionToastTone(tone);
    setActionToastEventKey((currentKey) => currentKey + 1);
  }

  async function refreshSnapshot(options: { notify?: boolean } = {}) {
    const shouldNotify = options.notify === true;
    if (shouldNotify) {
      showActionToast(t("filesPage.refreshing", "새로고침 중입니다."), "info");
    }
    setIsLoadingSnapshot(true);
    try {
      const payload = await waflLegacyApiRequest<{
        snapshot?: AdminFileManagementSnapshot;
        message?: string;
      }>(
        `/api/admin/files/snapshot?period=30&t=${Date.now()}`,
        { method: "GET", cache: "no-store" },
        t("filesPage.snapshotLoadFailed", "파일 목록 DB 조회 실패"),
      );

      if (payload.snapshot) {
        setSnapshot(payload.snapshot);
      }

    } catch (error) {
      showActionToast(
        error instanceof Error
          ? t(
              "filesPage.snapshotLoadFailedWithMessage",
              "파일 목록 DB 조회 실패: {message}",
              { message: error.message },
            )
          : t("filesPage.snapshotLoadFailed", "파일 목록 DB 조회 실패"),
        "danger",
      );
    } finally {
      setIsLoadingSnapshot(false);
    }
  }

  useEffect(() => {
    refreshSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!actionMessage) return;
    const timer = window.setTimeout(() => setActionMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [actionMessage]);

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

  async function executeTrashSelectionAction(
    action: AdminTrashActionType,
    input: { itemIds?: string[]; workOrderIds?: string[] },
  ) {
    if (pendingFileAction || pendingWorkOrderAction) return;
    const itemIds = input.itemIds ?? [];
    const workOrderIds = input.workOrderIds ?? [];

    setPendingFileAction(itemIds.length > 0 ? action : null);
    setPendingWorkOrderAction(workOrderIds.length > 0 ? action : null);
    try {
      const result = await runTrashSelectionActionFlow(action, {
        items: snapshot.trashItems,
        selectedItemIds: itemIds,
        workOrderIds,
      });
      showActionToast(result.message, result.ok ? "success" : "danger");
      if (result.ok) {
        setSelectedTrashItemIds([]);
        setSelectedWorkOrderIds([]);
        await refreshSnapshot();
      }
    } finally {
      setPendingFileAction(null);
      setPendingWorkOrderAction(null);
    }
  }

  async function handleRestoreTrashItem(itemIds?: string[]) {
    await executeTrashSelectionAction("restore", { itemIds, workOrderIds: [] });
  }

  async function handleRestoreSelection() {
    await executeTrashSelectionAction("restore", {
      itemIds: selectedTrashItemIds,
      workOrderIds: selectedWorkOrderIds,
    });
  }

  async function handlePurgeSelection() {
    await executeTrashSelectionAction("purge", {
      itemIds: selectedTrashItemIds,
      workOrderIds: selectedWorkOrderIds,
    });
  }

  async function handlePurgeAllTrashItems() {
    if (pendingFileAction || pendingWorkOrderAction) return;
    setPendingFileAction("purge");
    setPendingWorkOrderAction("purge");
    try {
      const result = await runPurgeAllTrashItemsFlow({
        items: snapshot.trashItems,
        workOrderItems: snapshot.workOrders ?? [],
      });
      showActionToast(result.message, result.ok ? "success" : "danger");
      if (result.ok) {
        setSelectedTrashItemIds([]);
        setSelectedWorkOrderIds([]);
        await refreshSnapshot();
      }
    } finally {
      setPendingFileAction(null);
      setPendingWorkOrderAction(null);
    }
  }

  async function handleRestoreWorkOrder(workOrderId: string) {
    await executeTrashSelectionAction("restore", { itemIds: [], workOrderIds: [workOrderId] });
  }

  async function handlePurgeWorkOrder(workOrderId: string) {
    await executeTrashSelectionAction("purge", { itemIds: [], workOrderIds: [workOrderId] });
  }

  async function handlePurgeTrashItem(itemIds?: string[]) {
    await executeTrashSelectionAction("purge", { itemIds, workOrderIds: [] });
  }

  return (
    <WorkspaceShell
      companyName={snapshot.companyName ?? t("common.companyNameFallback", "회사")}
      appVersion={APP_VERSION}
      navigationItems={navigationItems}
      title={t("filesPage.title", "저장소 관리")}
      contentMode="scroll"
    >
      <section className="relative flex min-h-fit w-full touch-pan-y flex-col gap-4 overflow-visible pb-8 md:pb-10">
        <FileStorageSummary
          usageCards={snapshot.usageCards}
          usageSummary={snapshot.usageSummary}
          fileTypeDistribution={snapshot.fileTypeDistribution}
        />

        <ToastMessage message={actionMessage} tone={actionToastTone} eventKey={actionToastEventKey} />

        <div className="min-h-fit touch-pan-y overflow-visible overscroll-auto">
          <FileTrashSection
            items={snapshot.trashItems}
            workOrderItems={snapshot.workOrders ?? []}
            selectedItemIds={selectedTrashItemIds}
            selectedWorkOrderIds={selectedWorkOrderIds}
            onToggleItem={toggleTrashItemId}
            onToggleWorkOrder={toggleWorkOrderId}
            onRestore={handleRestoreSelection}
            onPurgeAll={handlePurgeAllTrashItems}
            onPurge={handlePurgeSelection}
            onRestoreItem={(itemId) => handleRestoreTrashItem([itemId])}
            onPurgeItem={(itemId) => handlePurgeTrashItem([itemId])}
            onRestoreWorkOrder={handleRestoreWorkOrder}
            onPurgeWorkOrder={handlePurgeWorkOrder}
            onRefresh={() => refreshSnapshot({ notify: true })}
            isRefreshing={isLoadingSnapshot}
            isActionPending={pendingFileAction !== null}
            isWorkOrderActionPending={pendingWorkOrderAction !== null}
          />
        </div>
      </section>
    </WorkspaceShell>
  );
}
