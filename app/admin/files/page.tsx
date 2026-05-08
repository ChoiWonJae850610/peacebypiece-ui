"use client";

import { useEffect, useMemo, useState } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import AdminShell from "@/components/admin/layout/AdminShell";
import {
  runPurgeTrashSelectionFlow,
  runRestoreTrashSelectionFlow,
} from "@/lib/admin/files/actionFlow";
import { getAdminFileManagementSnapshot } from "@/lib/admin/files/adapter";
import { selectAdminTrashItemsByIds } from "@/lib/admin/files/selectors";
import type { AdminFileManagementSnapshot } from "@/lib/admin/files/types";
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
        `/api/admin/files/snapshot?period=30&t=${Date.now()}`,
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
  }, []);

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

  async function executeRestoreTrashSelection(input: {
    itemIds?: string[];
    workOrderIds?: string[];
  }) {
    if (pendingFileAction || pendingWorkOrderAction) return;
    const targets = input.itemIds
      ? selectAdminTrashItemsByIds(snapshot.trashItems, input.itemIds)
      : selectedTrashItems;
    const workOrderTargets = input.workOrderIds ?? [];

    setPendingFileAction(targets.length > 0 ? "restore" : null);
    setPendingWorkOrderAction(workOrderTargets.length > 0 ? "restore" : null);
    try {
      const result = await runRestoreTrashSelectionFlow({
        items: targets,
        workOrderIds: workOrderTargets,
      });
      setActionMessage(result.message);
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

  async function executePurgeTrashSelection(input: {
    itemIds?: string[];
    workOrderIds?: string[];
  }) {
    if (pendingFileAction || pendingWorkOrderAction) return;
    const targets = input.itemIds
      ? selectAdminTrashItemsByIds(snapshot.trashItems, input.itemIds)
      : selectedTrashItems;
    const workOrderTargets = input.workOrderIds ?? [];

    setPendingFileAction(targets.length > 0 ? "purge" : null);
    setPendingWorkOrderAction(workOrderTargets.length > 0 ? "purge" : null);
    try {
      const result = await runPurgeTrashSelectionFlow({
        items: targets,
        workOrderIds: workOrderTargets,
      });
      setActionMessage(result.message);
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
    await executeRestoreTrashSelection({ itemIds });
  }

  async function handleRestoreSelection() {
    await executeRestoreTrashSelection({
      workOrderIds: selectedWorkOrderIds,
    });
  }

  async function handlePurgeSelection() {
    await executePurgeTrashSelection({
      workOrderIds: selectedWorkOrderIds,
    });
  }

  async function handlePurgeAllTrashItems() {
    await executePurgeTrashSelection({
      itemIds: snapshot.trashItems.map((item) => item.id),
      workOrderIds: (snapshot.workOrders ?? []).map((item) => item.id),
    });
  }

  async function handleRestoreWorkOrder(workOrderId: string) {
    await executeRestoreTrashSelection({ itemIds: [], workOrderIds: [workOrderId] });
  }

  async function handlePurgeWorkOrder(workOrderId: string) {
    await executePurgeTrashSelection({ itemIds: [], workOrderIds: [workOrderId] });
  }

  async function handlePurgeTrashItem(itemIds?: string[]) {
    await executePurgeTrashSelection({ itemIds });
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
          fileTypeDistribution={snapshot.fileTypeDistribution}
          isRefreshing={isLoadingSnapshot}
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
            onRestore={handleRestoreSelection}
            onPurgeAll={handlePurgeAllTrashItems}
            onPurge={handlePurgeSelection}
            onRestoreItem={(itemId) => handleRestoreTrashItem([itemId])}
            onPurgeItem={(itemId) => handlePurgeTrashItem([itemId])}
            onRestoreWorkOrder={handleRestoreWorkOrder}
            onPurgeWorkOrder={handlePurgeWorkOrder}
            isActionPending={pendingFileAction !== null}
            isWorkOrderActionPending={pendingWorkOrderAction !== null}
          />
        </div>
      </section>
    </AdminShell>
  );
}
