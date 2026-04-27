"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import FileListSection from "@/components/admin/files/FileListSection";
import FileStorageSummary from "@/components/admin/files/FileStorageSummary";
import FileTrashSection from "@/components/admin/files/FileTrashSection";
import { requestMoveAttachmentsToTrash, requestPurgeTrashItems, requestRestoreTrashItems } from "@/lib/admin/adminFiles.actions";
import { getAdminFileManagementSnapshot } from "@/lib/admin/adminFiles.adapter";
import { sortAdminManagedFiles } from "@/lib/admin/adminFiles.presentation";
import type { AdminFileManagementSnapshot, AdminFileSortKey, AdminFileTabKey } from "@/lib/admin/adminFiles.types";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminFilesPage() {
  const placeholderSnapshot = useMemo(() => getAdminFileManagementSnapshot(), []);
  const [snapshot, setSnapshot] = useState<AdminFileManagementSnapshot>(placeholderSnapshot);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminFileTabKey>("attachments");
  const [fileSortKey, setFileSortKey] = useState<AdminFileSortKey>("latest");
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);
  const [selectedTrashItemIds, setSelectedTrashItemIds] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);


  useEffect(() => {
    let isMounted = true;

    async function loadSnapshot() {
      setIsLoadingSnapshot(true);
      try {
        const response = await fetch("/api/admin/files/snapshot", { method: "GET" });
        const payload = (await response.json().catch(() => null)) as { snapshot?: AdminFileManagementSnapshot; message?: string } | null;
        if (!isMounted) return;

        if (payload?.snapshot) {
          setSnapshot(payload.snapshot);
        }

        if (!response.ok && payload?.message) {
          setActionMessage(`파일 목록 DB 조회 실패: ${payload.message}`);
        }
      } catch (error) {
        if (!isMounted) return;
        setActionMessage(error instanceof Error ? `파일 목록 DB 조회 실패: ${error.message}` : "파일 목록 DB 조회 실패");
      } finally {
        if (isMounted) setIsLoadingSnapshot(false);
      }
    }

    loadSnapshot();

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedAttachments = useMemo(() => sortAdminManagedFiles(snapshot.attachments, fileSortKey), [fileSortKey, snapshot.attachments]);
  const selectedAttachments = snapshot.attachments.filter((item) => selectedAttachmentIds.includes(item.id));
  const selectedTrashItems = snapshot.trashItems.filter((item) => selectedTrashItemIds.includes(item.id));

  function toggleId(targetId: string, currentIds: string[], setIds: (ids: string[]) => void) {
    setIds(currentIds.includes(targetId) ? currentIds.filter((id) => id !== targetId) : [...currentIds, targetId]);
    setActionMessage(null);
  }

  function handleToggleAllAttachments() {
    setSelectedAttachmentIds(selectedAttachmentIds.length === sortedAttachments.length ? [] : sortedAttachments.map((item) => item.id));
    setActionMessage(null);
  }

  function handleToggleAllTrashItems() {
    setSelectedTrashItemIds(selectedTrashItemIds.length === snapshot.trashItems.length ? [] : snapshot.trashItems.map((item) => item.id));
    setActionMessage(null);
  }

  async function handleMoveAttachmentToTrash() {
    const result = await requestMoveAttachmentsToTrash(selectedAttachments);
    setActionMessage(result.message);
    if (result.ok) setSelectedAttachmentIds([]);
  }

  async function handleRestoreTrashItem() {
    const result = await requestRestoreTrashItems(selectedTrashItems);
    setActionMessage(result.message);
    if (result.ok) setSelectedTrashItemIds([]);
  }

  async function handlePurgeTrashItem() {
    const result = await requestPurgeTrashItems(selectedTrashItems);
    setActionMessage(result.message);
    if (result.ok) setSelectedTrashItemIds([]);
  }

  function handleChangeTab(tabKey: AdminFileTabKey) {
    setActiveTab(tabKey);
    setActionMessage(null);
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">파일 / 용량 관리</h1>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap gap-2 md:justify-end">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{isLoadingSnapshot ? "DB 조회 중" : snapshot.dataSourceLabel}</span>
              </div>
              <Link href="/admin" className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                관리자 메인으로 이동
              </Link>
            </div>
          </div>
        </header>

        <FileStorageSummary usageCards={snapshot.usageCards} usageSummary={snapshot.usageSummary} policyItems={snapshot.storagePolicies} />

        <section className="rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
          <div className="grid gap-2 md:grid-cols-3">
            {snapshot.tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} type="button" onClick={() => handleChangeTab(tab.key)} className={`rounded-2xl border px-4 py-3 text-left transition ${isActive ? "border-stone-400 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"}`}>
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={`mt-1 block text-xs leading-5 ${isActive ? "text-stone-300" : "text-stone-500"}`}>{tab.description}</span>
                </button>
              );
            })}
          </div>
        </section>

        {actionMessage ? <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{actionMessage}</section> : null}

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
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">용량 추가 요청</h2>
                <p className="mt-2 text-sm leading-6 text-stone-500">고객사별 첨부파일 사용량을 기준으로 추가 용량 요청과 과금 정책을 연결할 영역입니다.</p>
              </div>
              <button type="button" className="w-fit rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-400" disabled>
                요청 기능 예정
              </button>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-xs leading-5 text-stone-500">
              실제 사용량 집계는 attachments의 활성 파일과 휴지통 보관 파일을 합산하고, R2 실제 삭제 이후에만 차감하는 구조로 연결합니다.
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
