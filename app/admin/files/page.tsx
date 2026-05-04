"use client";

import { useEffect, useMemo, useState } from "react";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import AdminShell from "@/components/admin/layout/AdminShell";
import { runPurgeTrashItemsFlow, runRestoreTrashItemsFlow } from "@/lib/admin/files/actionFlow";
import { getAdminFileManagementSnapshot } from "@/lib/admin/files/adapter";
import { buildAdminSelectAllIds, selectAdminTrashItemsByIds } from "@/lib/admin/files/selectors";
import type { AdminFileManagementSnapshot, AdminFileTrendPeriod } from "@/lib/admin/files/types";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

const FILE_ADMIN_NAVIGATION_ITEMS = getAdminNavigationItems("/admin/files");

export default function AdminFilesPage() {
  const t = useAdminTranslation();
  const placeholderSnapshot = useMemo(() => getAdminFileManagementSnapshot(), []);
  const [snapshot, setSnapshot] = useState<AdminFileManagementSnapshot>(placeholderSnapshot);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<AdminFileTrendPeriod>(7);
  const [selectedTrashItemIds, setSelectedTrashItemIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [pendingFileAction, setPendingFileAction] = useState<"restore" | "purge" | null>(null);

  async function refreshSnapshot() {
    setIsLoadingSnapshot(true);
    try {
      const response = await fetch(`/api/admin/files/snapshot?period=${trendPeriod}&t=${Date.now()}`, { method: "GET", cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { snapshot?: AdminFileManagementSnapshot; message?: string } | null;

      if (payload?.snapshot) {
        setSnapshot(payload.snapshot);
      }

      if (!response.ok && payload?.message) {
        setActionMessage(t("filesPage.snapshotLoadFailedWithMessage", "파일 목록 DB 조회 실패: {message}", { message: payload.message }));
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? t("filesPage.snapshotLoadFailedWithMessage", "파일 목록 DB 조회 실패: {message}", { message: error.message }) : t("filesPage.snapshotLoadFailed", "파일 목록 DB 조회 실패"));
    } finally {
      setIsLoadingSnapshot(false);
    }
  }

  useEffect(() => {
    refreshSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendPeriod]);

  const selectedTrashItems = useMemo(() => selectAdminTrashItemsByIds(snapshot.trashItems, selectedTrashItemIds), [selectedTrashItemIds, snapshot.trashItems]);


  function toggleTrashItemId(itemId: string) {
    setSelectedTrashItemIds((currentIds) => (currentIds.includes(itemId) ? currentIds.filter((id) => id !== itemId) : [...currentIds, itemId]));
    setActionMessage(null);
  }

  function handleToggleAllTrashItems() {
    setSelectedTrashItemIds(buildAdminSelectAllIds(snapshot.trashItems, selectedTrashItemIds));
    setActionMessage(null);
  }

  async function handleRestoreTrashItem(itemIds?: string[]) {
    if (pendingFileAction) return;
    const targets = itemIds ? selectAdminTrashItemsByIds(snapshot.trashItems, itemIds) : selectedTrashItems;
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

  async function handlePurgeTrashItem(itemIds?: string[]) {
    if (pendingFileAction) return;
    const targets = itemIds ? selectAdminTrashItemsByIds(snapshot.trashItems, itemIds) : selectedTrashItems;
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

        {actionMessage ? (
          <section className="pointer-events-none absolute bottom-5 right-5 z-10 max-w-md rounded-2xl bg-[var(--admin-theme-surface)] px-4 py-3 text-sm font-semibold text-[var(--admin-theme-text-on-surface)] shadow-xl">
            {actionMessage}
          </section>
        ) : null}

        <div className="mt-4 h-[560px] min-h-[440px] flex-1 overflow-hidden">
          <FileTrashSection
            items={snapshot.trashItems}
            workOrderItems={snapshot.workOrders ?? []}
            selectedItemIds={selectedTrashItemIds}
            onToggleItem={toggleTrashItemId}
            onToggleAll={handleToggleAllTrashItems}
            onRestore={() => handleRestoreTrashItem()}
            onPurge={() => handlePurgeTrashItem()}
            onRestoreItem={(itemId) => handleRestoreTrashItem([itemId])}
            onPurgeItem={(itemId) => handlePurgeTrashItem([itemId])}
            isActionPending={pendingFileAction !== null}
          />
        </div>
      </section>
    </AdminShell>
  );
}
