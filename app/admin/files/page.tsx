"use client";

import { useEffect, useMemo, useState } from "react";
import FileListSection from "@/components/admin/files/FileListSection";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { runMoveAttachmentsToTrashFlow, runPurgeTrashItemsFlow, runPurgeWorkerFlow, runRestoreTrashItemsFlow, runUpdateFilePolicySettingsFlow } from "@/lib/admin/adminFiles.actionFlow";
import { getAdminFileManagementSnapshot } from "@/lib/admin/adminFiles.adapter";
import {
  buildAdminSelectAllIds,
  buildAdminStoragePolicyBadges,
  getAdminFilePolicySourceLabel,
  selectAdminManagedFilesByIds,
  selectAdminTrashItemsByIds,
  sortAdminManagedFiles,
  toggleAdminSelectedId,
} from "@/lib/admin/adminFiles.presentation";
import type { AdminFileManagementSnapshot, AdminFileSortKey, AdminFileTabKey, AdminStoragePolicySettings } from "@/lib/admin/adminFiles.types";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

const FILE_ADMIN_NAVIGATION_ITEMS = getAdminNavigationItems("/admin/files");

export default function AdminFilesPage() {
  const placeholderSnapshot = useMemo(() => getAdminFileManagementSnapshot(), []);
  const [snapshot, setSnapshot] = useState<AdminFileManagementSnapshot>(placeholderSnapshot);
  const [policySettings, setPolicySettings] = useState<AdminStoragePolicySettings>(placeholderSnapshot.policySettings);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminFileTabKey>("attachments");
  const [fileSortKey, setFileSortKey] = useState<AdminFileSortKey>("latest");
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const [selectedTrashItemIds, setSelectedTrashItemIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isPurgeWorkerRunning, setIsPurgeWorkerRunning] = useState(false);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  async function refreshSnapshot() {
    setIsLoadingSnapshot(true);
    try {
      const response = await fetch(`/api/admin/files/snapshot?t=${Date.now()}`, { method: "GET", cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { snapshot?: AdminFileManagementSnapshot; message?: string } | null;

      if (payload?.snapshot) {
        setSnapshot(payload.snapshot);
        setPolicySettings(payload.snapshot.policySettings);
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
  }, []);

  const sortedAttachments = useMemo(() => sortAdminManagedFiles(snapshot.attachments, fileSortKey), [fileSortKey, snapshot.attachments]);
  const selectedAttachments = useMemo(() => selectAdminManagedFilesByIds(snapshot.attachments, selectedAttachmentIds), [selectedAttachmentIds, snapshot.attachments]);
  const selectedTrashItems = useMemo(() => selectAdminTrashItemsByIds(snapshot.trashItems, selectedTrashItemIds), [selectedTrashItemIds, snapshot.trashItems]);
  const storagePolicyBadges = useMemo(() => buildAdminStoragePolicyBadges(policySettings), [policySettings]);

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


  async function handleChangePolicySettings(nextPolicySettings: AdminStoragePolicySettings) {
    const previousPolicySettings = policySettings;
    setPolicySettings(nextPolicySettings);
    setIsSavingPolicy(true);
    setActionMessage(null);

    try {
      const result = await runUpdateFilePolicySettingsFlow(nextPolicySettings);
      setActionMessage(result.message);
      if (!result.ok) {
        setPolicySettings(previousPolicySettings);
        return;
      }
      await refreshSnapshot();
    } finally {
      setIsSavingPolicy(false);
    }
  }

  async function handleRunPurgeWorker(dryRun: boolean) {
    setIsPurgeWorkerRunning(true);
    const result = await runPurgeWorkerFlow(dryRun);
    setActionMessage(result.message);
    if (result.ok) {
      await refreshSnapshot();
    }
    setIsPurgeWorkerRunning(false);
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
      title="파일 / 용량 관리"
      description="첨부파일 사용량, 휴지통, 실제 삭제 후보를 확인하고 company_settings 기준 파일 정책을 빠르게 수정합니다."
    >
      <FileStorageSummary
        usageCards={snapshot.usageCards}
        usageSummary={snapshot.usageSummary}
        policyItems={snapshot.storagePolicies}
        policySettings={policySettings}
        onChangePolicySettings={handleChangePolicySettings}
        isSavingPolicy={isSavingPolicy}
        policySourceLabel={getAdminFilePolicySourceLabel(snapshot.dataSource)}
      />

      <AdminCard className="p-2">
        <div className="grid gap-2 md:grid-cols-3">
          {snapshot.tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => handleChangeTab(tab.key)} className={`rounded-3xl border px-4 py-4 text-left transition ${isActive ? "border-stone-300 bg-stone-950 text-white shadow-sm" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`}>
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className={`mt-1 block text-xs leading-5 ${isActive ? "text-stone-300" : "text-stone-500"}`}>{tab.description}</span>
              </button>
            );
          })}
        </div>
      </AdminCard>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm ring-1 ring-stone-200">{isLoadingSnapshot ? "DB 조회 중" : snapshot.dataSourceLabel}</span>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-500 shadow-sm ring-1 ring-stone-200">선택 첨부 {selectedAttachmentIds.length}개</span>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-500 shadow-sm ring-1 ring-stone-200">선택 휴지통 {selectedTrashItemIds.length}개</span>
        </div>
        <button type="button" onClick={refreshSnapshot} aria-label="새로고침" title="새로고침" disabled={isLoadingSnapshot} className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:text-stone-400">
          <span aria-hidden="true">↻</span>
          새로고침
        </button>
      </div>

      {actionMessage ? <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 shadow-sm">{actionMessage}</section> : null}

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
      {activeTab === "storage" ? (
        <AdminCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">PURGE WORKER</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">실제 삭제 실행</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleRunPurgeWorker(true)} disabled={isPurgeWorkerRunning} className="w-fit rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:text-stone-400">
                실제삭제 후보 확인
              </button>
              <button type="button" onClick={() => handleRunPurgeWorker(false)} disabled={isPurgeWorkerRunning} className="w-fit rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:text-stone-400">
                R2 실제삭제 실행
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {storagePolicyBadges.map((item) => (
              <div key={item.label} className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                {item.label}: {item.value}
              </div>
            ))}
            <a href="/admin/settings" className="rounded-3xl border border-stone-300 bg-white p-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50">환경설정에서 전체 정책 관리</a>
          </div>
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}
