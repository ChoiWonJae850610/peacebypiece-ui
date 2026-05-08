"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { SystemStoragePurgeCandidate } from "@/lib/system/storagePurgeCandidates";
import {
  SYSTEM_STORAGE_PURGE_COPY,
  SYSTEM_STORAGE_PURGE_SORT_LABELS,
  buildSystemStoragePurgeResultMessage,
  buildSystemStorageSelectedPurgeConfirmMessage,
  buildSystemStorageWorkOrderBundleMetaLabel,
  getSystemStoragePurgeResultMessageClass,
  getSystemStoragePurgeResultTone,
  getSystemStorageSortDirectionLabel,
  type SystemStoragePurgeResponse,
  type SystemStoragePurgeResultTone,
} from "@/lib/system/storagePurgePresentation";

type PurgeResponse = SystemStoragePurgeResponse;


type SystemStoragePurgeCandidatesClientProps = {
  candidates: SystemStoragePurgeCandidate[];
};

type SortDirection = "asc" | "desc";
type SortKey = "kind" | "company" | "target" | "deletedAt" | "purgeDueAt" | "size" | "attachmentCount" | "memoCount" | "status";

type SortState = {
  key: SortKey;
  direction: SortDirection;
};

const SORT_LABELS: Record<SortKey, string> = SYSTEM_STORAGE_PURGE_SORT_LABELS;

function renderKey(value: string | null) {
  if (!value) return <span className="text-stone-400">없음</span>;
  return <code className="break-all text-[11px] leading-5 text-stone-500">{value}</code>;
}


function toSortTime(value: string): number {
  if (!value || value === "-") return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "ko-KR", { numeric: true, sensitivity: "base" });
}

function compareCandidates(left: SystemStoragePurgeCandidate, right: SystemStoragePurgeCandidate, key: SortKey): number {
  if (key === "size") return left.originalSizeBytes - right.originalSizeBytes;
  if (key === "attachmentCount") return left.attachmentCount - right.attachmentCount;
  if (key === "memoCount") return left.memoCount - right.memoCount;
  if (key === "deletedAt") return toSortTime(left.deletedAt) - toSortTime(right.deletedAt);
  if (key === "purgeDueAt") return toSortTime(left.purgeDueAt) - toSortTime(right.purgeDueAt);
  if (key === "kind") return compareText(left.fileTypeLabel, right.fileTypeLabel);
  if (key === "company") return compareText(`${left.companyName} ${left.workorderTitle}`, `${right.companyName} ${right.workorderTitle}`);
  if (key === "target") return compareText(left.fileName, right.fileName);
  return compareText(left.purgeStatusLabel, right.purgeStatusLabel);
}

async function postPurgeRequest(body: { mode: "selected" | "all-due"; trashItemIds?: string[]; limit?: number }): Promise<PurgeResponse> {
  const response = await fetch("/api/system/storage-usage/purge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as PurgeResponse | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.message || payload?.error || `SYSTEM_STORAGE_PURGE_FAILED_${response.status}`);
  }
  return payload;
}

export function SystemStoragePurgeCandidatesClient({ candidates }: SystemStoragePurgeCandidatesClientProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<SystemStoragePurgeResultTone>(null);
  const [sortState, setSortState] = useState<SortState>({ key: "purgeDueAt", direction: "asc" });

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((left, right) => {
      const result = compareCandidates(left, right, sortState.key);
      return sortState.direction === "asc" ? result : -result;
    });
  }, [candidates, sortState]);

  const selectedCount = selectedIds.length;
  const hasCandidates = sortedCandidates.length > 0;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleCandidate(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelectedIds((current) => (current.length === sortedCandidates.length ? [] : sortedCandidates.map((candidate) => candidate.trashItemId)));
  }

  function changeSort(key: SortKey) {
    setSortState((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  function refreshCandidates() {
    if (isPending) return;
    setResultMessage(null);
    setResultTone(null);
    setSelectedIds([]);
    router.refresh();
  }

  function renderSortButton(key: SortKey, label = SORT_LABELS[key]) {
    const isActive = sortState.key === key;
    return (
      <button
        type="button"
        onClick={() => changeSort(key)}
        className={`inline-flex items-center gap-1 text-left font-semibold ${isActive ? "text-stone-950" : "text-stone-600 hover:text-stone-950"}`}
        aria-label={`${label} 기준 정렬`}
      >
        <span>{label}</span>
        <span className="text-[10px] text-stone-400">{isActive ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    );
  }

  async function runSelectedPurge() {
    if (selectedIds.length === 0 || isPending) return;
    const confirmed = window.confirm(buildSystemStorageSelectedPurgeConfirmMessage(selectedIds.length));
    if (!confirmed) return;

    setIsPending(true);
    setResultMessage(null);
    setResultTone(null);
    try {
      const result = await postPurgeRequest({ mode: "selected", trashItemIds: selectedIds, limit: selectedIds.length });
      setResultMessage(buildSystemStoragePurgeResultMessage(SYSTEM_STORAGE_PURGE_COPY.result.selectedLabel, result));
      setResultTone(getSystemStoragePurgeResultTone(result));
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : SYSTEM_STORAGE_PURGE_COPY.result.selectedError);
      setResultTone("error");
    } finally {
      setIsPending(false);
    }
  }

  async function runAllDuePurge() {
    if (!hasCandidates || isPending) return;
    const confirmed = window.confirm(SYSTEM_STORAGE_PURGE_COPY.confirm.allDue);
    if (!confirmed) return;

    setIsPending(true);
    setResultMessage(null);
    setResultTone(null);
    try {
      const result = await postPurgeRequest({ mode: "all-due", limit: 200 });
      setResultMessage(buildSystemStoragePurgeResultMessage(SYSTEM_STORAGE_PURGE_COPY.result.allDueLabel, result));
      setResultTone(getSystemStoragePurgeResultTone(result));
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : SYSTEM_STORAGE_PURGE_COPY.result.allDueError);
      setResultTone("error");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{SYSTEM_STORAGE_PURGE_COPY.list.title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {SYSTEM_STORAGE_PURGE_COPY.list.description}
          </p>
          <p className="mt-2 text-xs font-medium text-stone-500">
            {SYSTEM_STORAGE_PURGE_COPY.list.currentSort}: {SORT_LABELS[sortState.key]} · {getSystemStorageSortDirectionLabel(sortState.direction)}
          </p>
          {resultMessage ? <p className={`mt-2 rounded-2xl px-3 py-2 text-xs font-medium ${getSystemStoragePurgeResultMessageClass(resultTone)}`}>{resultMessage}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshCandidates}
            disabled={isPending}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
          >
            {SYSTEM_STORAGE_PURGE_COPY.list.refresh}
          </button>
          <button
            type="button"
            onClick={runSelectedPurge}
            disabled={selectedCount === 0 || isPending}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
          >
            {isPending ? SYSTEM_STORAGE_PURGE_COPY.list.pending : `${SYSTEM_STORAGE_PURGE_COPY.list.selectDelete} (${selectedCount})`}
          </button>
          <button
            type="button"
            onClick={runAllDuePurge}
            disabled={!hasCandidates || isPending}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:border-red-100 disabled:bg-red-50 disabled:text-red-300"
          >
            {isPending ? SYSTEM_STORAGE_PURGE_COPY.list.pending : SYSTEM_STORAGE_PURGE_COPY.list.deleteAll}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
        <div className="hidden grid-cols-[0.22fr_0.55fr_1.05fr_1.15fr_1fr_0.8fr_1.45fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold text-stone-600 lg:grid">
          <span>
            <input type="checkbox" checked={hasCandidates && selectedCount === sortedCandidates.length} onChange={toggleAll} disabled={!hasCandidates || isPending} />
          </span>
          <span>{renderSortButton("kind")}</span>
          <span>{renderSortButton("company", SYSTEM_STORAGE_PURGE_COPY.list.companyWorkOrderHeader)}</span>
          <span>{renderSortButton("target")}</span>
          <span className="flex flex-col gap-1">
            {renderSortButton("deletedAt")}
            {renderSortButton("purgeDueAt")}
          </span>
          <span className="flex flex-col gap-1">
            {renderSortButton("size")}
            {renderSortButton("status")}
          </span>
          <span className="flex flex-col gap-1">
            <span>{SYSTEM_STORAGE_PURGE_COPY.list.keyHeader}</span>
            <span className="flex gap-3">
              {renderSortButton("attachmentCount")}
              {renderSortButton("memoCount")}
            </span>
          </span>
        </div>

        {sortedCandidates.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-stone-500">{SYSTEM_STORAGE_PURGE_COPY.list.empty}</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sortedCandidates.map((candidate) => (
              <article key={candidate.trashItemId} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[0.22fr_0.55fr_1.05fr_1.15fr_1fr_0.8fr_1.45fr]">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedIdSet.has(candidate.trashItemId)}
                    onChange={() => toggleCandidate(candidate.trashItemId)}
                    disabled={isPending}
                    aria-label={`${candidate.fileName} ${SYSTEM_STORAGE_PURGE_COPY.list.selectCandidateLabelSuffix}`}
                  />
                </div>
                <div className="space-y-1">
                  {candidate.previewUrl ? (
                    <img
                      src={candidate.previewUrl}
                      alt={`${candidate.fileName} ${SYSTEM_STORAGE_PURGE_COPY.list.previewAltSuffix}`}
                      className="h-14 w-14 rounded-xl border border-stone-200 bg-stone-100 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-[11px] font-bold text-stone-500">
                      {candidate.fileTypeLabel}
                    </div>
                  )}
                  <p
                    className={`max-w-24 text-[10px] font-semibold leading-4 ${
                      candidate.previewMode === "original-fallback" ? "text-amber-700" : "text-stone-500"
                    }`}
                  >
                    {candidate.previewModeLabel}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-stone-950">{candidate.companyName}</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">{candidate.workorderTitle}</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{candidate.fileName}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {candidate.candidateKind === "workorder"
                      ? buildSystemStorageWorkOrderBundleMetaLabel({ attachmentCount: candidate.attachmentCount, memoCount: candidate.memoCount })
                      : `${candidate.fileTypeLabel} · ${candidate.thumbnailCountLabel}`}
                  </p>
                </div>
                <div className="text-xs leading-5 text-stone-600">
                  <p>{SYSTEM_STORAGE_PURGE_COPY.list.deletedAtLabel}: {candidate.deletedAt}</p>
                  <p>{SYSTEM_STORAGE_PURGE_COPY.list.purgeDueAtLabel}: {candidate.purgeDueAt}</p>
                  <p className="font-semibold text-red-600">{SYSTEM_STORAGE_PURGE_COPY.list.overdueLabel}: {candidate.overdueDays}일</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{candidate.originalSizeLabel}</p>
                  <p className="mt-1 text-xs text-stone-500">{candidate.purgeStatusLabel}</p>
                  {candidate.lastPurgeError ? <p className="mt-1 text-xs text-red-600">{candidate.lastPurgeError}</p> : null}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400">{SYSTEM_STORAGE_PURGE_COPY.list.sourceKeyTitle}</p>
                    {candidate.candidateKind === "workorder" ? <span className="text-stone-400">{SYSTEM_STORAGE_PURGE_COPY.list.workOrderSourceHint}</span> : renderKey(candidate.storageKey)}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400">{SYSTEM_STORAGE_PURGE_COPY.list.thumbnailKeyTitle}</p>
                    {candidate.candidateKind === "workorder" ? <span className="text-stone-400">{SYSTEM_STORAGE_PURGE_COPY.list.workOrderRetryHint}</span> : renderKey(candidate.thumbnailKey)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
