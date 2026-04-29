"use client";

import { useEffect, useMemo, useState } from "react";
import FileListSection from "@/components/admin/files/FileListSection";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import AdminShell from "@/components/admin/layout/AdminShell";
import { runMoveAttachmentsToTrashFlow, runPurgeTrashItemsFlow, runRestoreTrashItemsFlow } from "@/lib/admin/adminFiles.actionFlow";
import { getAdminFileManagementSnapshot } from "@/lib/admin/adminFiles.adapter";
import {
  buildAdminSelectAllIds,
  selectAdminManagedFilesByIds,
  selectAdminTrashItemsByIds,
  sortAdminManagedFiles,
  toggleAdminSelectedId,
} from "@/lib/admin/adminFiles.presentation";
import type { AdminFileManagementSnapshot, AdminFileSortKey, AdminFileTabKey, AdminFileTrendPeriod } from "@/lib/admin/adminFiles.types";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

const FILE_ADMIN_NAVIGATION_ITEMS = getAdminNavigationItems("/admin/files");

export default function AdminFilesPage() {
  const placeholderSnapshot = useMemo(() => getAdminFileManagementSnapshot(), []);
  const [snapshot, setSnapshot] = useState<AdminFileManagementSnapshot>(placeholderSnapshot);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminFileTabKey>("attachments");
  const [trendPeriod, setTrendPeriod] = useState<AdminFileTrendPeriod>(7);
  const [fileSortKey, setFileSortKey] = useState<AdminFileSortKey>("latest");
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const [selectedTrashItemIds, setSelectedTrashItemIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function refreshSnapshot() {
    setIsLoadingSnapshot(true);
    try {
      const response = await fetch(`/api/admin/files/snapshot?period=${trendPeriod}&t=${Date.now()}`, { method: "GET", cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { snapshot?: AdminFileManagementSnapshot; message?: string } | null;

      if (payload?.snapshot) {
        setSnapshot(payload.snapshot);
      }

      if (!response.ok && payload?.message) {
        setActionMessage(`파일 목록 DB 조회 실패: ${payload.message}`);
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? `파일 목록 DB 조회 실패: ${error.message}` : "파일 목록 DB 조회 실패");
    } finally {
      setIsLoadingSnapshot(false);
    }
  }

  useEffect(() => {
    refreshSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendPeriod]);

  const sortedAttachments = useMemo(() => sortAdminManagedFiles(snapshot.attachments, fileSortKey), [fileSortKey, snapshot.attachments]);
  const selectedAttachments = useMemo(() => selectAdminManagedFilesByIds(snapshot.attachments, selectedAttachmentIds), [selectedAttachmentIds, snapshot.attachments]);
  const selectedTrashItems = useMemo(() => selectAdminTrashItemsByIds(snapshot.trashItems, selectedTrashItemIds), [selectedTrashItemIds, snapshot.trashItems]);

  function toggleId(targetId: string, currentIds: string[], setIds: (ids: string[]) => void) {
    setIds(toggleAdminSelectedId(currentIds, targetId));
    setActionMessage(null);
  }

  function handleToggleAllAttachments() {
    setSelectedAttachmentIds(buildAdminSelectAllIds(sortedAttachments, selectedAttachmentIds));
    setActionMessage(null);
  }

  function handleToggleAllTrashItems() {
    setSelectedTrashItemIds(buildAdminSelectAllIds(snapshot.trashItems, selectedTrashItemIds));
    setActionMessage(null);
  }

  async function handleMoveAttachmentToTrash() {
    const result = await runMoveAttachmentsToTrashFlow(selectedAttachments);
    setActionMessage(result.message);
    if (result.ok) {
      setSelectedAttachmentIds([]);
      await refreshSnapshot();
    }
  }

  async function handleRestoreTrashItem() {
    const result = await runRestoreTrashItemsFlow(selectedTrashItems);
    setActionMessage(result.message);
    if (result.ok) {
      setSelectedTrashItemIds([]);
      await refreshSnapshot();
    }
  }

  async function handlePurgeTrashItem() {
    const result = await runPurgeTrashItemsFlow(selectedTrashItems);
    setActionMessage(result.message);
    if (result.ok) {
      setSelectedTrashItemIds([]);
      await refreshSnapshot();
    }
  }

  function handleChangeTab(tabKey: AdminFileTabKey) {
    setActiveTab(tabKey);
    setActionMessage(null);
  }

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={FILE_ADMIN_NAVIGATION_ITEMS}
      title="저장소 관리"
    >
      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-stone-200 bg-white p-5 shadow-sm">
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

        <div className="mt-4 flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {snapshot.tabs.filter((tab) => tab.key !== "storage").map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} type="button" onClick={() => handleChangeTab(tab.key)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? "border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)] text-[var(--admin-theme-text-on-surface)]" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>
                  {tab.label}
                </button>
              );
            })}
          </div>


        </div>

        {actionMessage ? (
          <section className="pointer-events-none absolute bottom-5 right-5 z-10 max-w-md rounded-2xl bg-[var(--admin-theme-surface)] px-4 py-3 text-sm font-semibold text-[var(--admin-theme-text-on-surface)] shadow-xl">
            {actionMessage}
          </section>
        ) : null}

        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          {activeTab === "attachments" ? (
            <FileListSection
              items={sortedAttachments}
              selectedItemIds={selectedAttachmentIds}
              sortKey={fileSortKey}
              onChangeSort={setFileSortKey}
              onToggleItem={(itemId) => toggleId(itemId, selectedAttachmentIds, setSelectedAttachmentIds)}
              onToggleAll={handleToggleAllAttachments}
              onMoveToTrash={handleMoveAttachmentToTrash}
            />
          ) : null}
          {activeTab === "trash" ? (
            <FileTrashSection
              items={snapshot.trashItems}
              selectedItemIds={selectedTrashItemIds}
              onToggleItem={(itemId) => toggleId(itemId, selectedTrashItemIds, setSelectedTrashItemIds)}
              onToggleAll={handleToggleAllTrashItems}
              onRestore={handleRestoreTrashItem}
              onPurge={handlePurgeTrashItem}
            />
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
