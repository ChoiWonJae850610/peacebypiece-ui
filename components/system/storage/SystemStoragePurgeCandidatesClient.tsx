"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminTable from "@/components/admin/common/AdminTable";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import ToastMessage, { type ToastTone } from "@/components/common/ToastMessage";
import {
  SYSTEM_PANEL_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SUBTLE_TEXT_CLASS,
  SYSTEM_TABLE_HEADER_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { useSystemTranslation } from "@/lib/i18n/useSystemTranslation";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { SystemStoragePurgeCandidate } from "@/lib/system/storagePurgeCandidates";
import {
  buildSystemStoragePurgeCopy,
  buildSystemStoragePurgeResultMessage,
  buildSystemStorageSelectedPurgeConfirmMessage,
  buildSystemStorageWorkOrderBundleMetaLabel,
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
type SortKey = "kind" | "company" | "target" | "deletedAt" | "purgeDueAt" | "size" | "attachmentCount" | "status";

type SortState = {
  key: SortKey;
  direction: SortDirection;
};


function toToastTone(tone: SystemStoragePurgeResultTone): ToastTone {
  if (tone === "error") return "danger";
  if (tone === "warning") return "warning";
  if (tone === "success") return "success";
  return "info";
}

function renderKey(value: string | null) {
  if (!value) return <span className={SYSTEM_SUBTLE_TEXT_CLASS}>없음</span>;
  return <code className={`break-all text-[11px] leading-5 ${SYSTEM_SUBTLE_TEXT_CLASS}`}>{value}</code>;
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
  const t = useSystemTranslation();
  const purgeCopy = buildSystemStoragePurgeCopy(t);
  const sortLabels = purgeCopy.sort;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultTone, setResultTone] = useState<SystemStoragePurgeResultTone>(null);
  const [resultEventKey, setResultEventKey] = useState(0);
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

  function renderSortButton(key: SortKey, label = sortLabels[key]) {
    const isActive = sortState.key === key;
    return (
      <button
        type="button"
        onClick={() => changeSort(key)}
        className={`inline-flex items-center gap-1 text-left font-semibold ${isActive ? SYSTEM_VALUE_TEXT_CLASS : "text-[var(--pbp-text-muted)] hover:text-[var(--pbp-text-primary)]"}`}
        aria-label={`${label} 기준 정렬`}
      >
        <span>{label}</span>
        <span className="text-[10px] text-[var(--pbp-text-subtle)]">{isActive ? (sortState.direction === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    );
  }

  const purgeCandidateTableColumns: AdminTableColumn<SystemStoragePurgeCandidate>[] = [
    {
      key: "select",
      label: <input type="checkbox" checked={hasCandidates && selectedCount === sortedCandidates.length} onChange={toggleAll} disabled={!hasCandidates || isPending} />,
      render: (candidate) => (
        <input
          type="checkbox"
          checked={selectedIdSet.has(candidate.trashItemId)}
          onChange={() => toggleCandidate(candidate.trashItemId)}
          disabled={isPending}
          aria-label={`${candidate.fileName} ${purgeCopy.list.selectCandidateLabelSuffix}`}
        />
      ),
    },
    {
      key: "kind",
      label: renderSortButton("kind"),
      render: (candidate) => (
        <div className="space-y-1">
          {candidate.previewUrl ? (
            <img
              src={candidate.previewUrl}
              alt={`${candidate.fileName} ${purgeCopy.list.previewAltSuffix}`}
              className="h-14 w-14 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[11px] font-bold text-[var(--pbp-text-subtle)]">
              {candidate.fileTypeLabel}
            </div>
          )}
          <p
            className={`max-w-24 text-[10px] font-semibold leading-4 ${
              candidate.previewMode === "original-fallback" ? "text-[var(--pbp-status-warning)]" : SYSTEM_SUBTLE_TEXT_CLASS
            }`}
          >
            {candidate.previewModeLabel}
          </p>
        </div>
      ),
    },
    {
      key: "company",
      label: renderSortButton("company", purgeCopy.list.companyWorkOrderHeader),
      render: (candidate) => (
        <div>
          <p className="text-[10px] text-[var(--pbp-text-subtle)] lg:hidden">{purgeCopy.list.companyWorkOrderHeader}</p>
          <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{candidate.companyName}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{candidate.workorderTitle}</p>
        </div>
      ),
    },
    {
      key: "target",
      label: renderSortButton("target"),
      render: (candidate) => (
        <div>
          <p className="text-[10px] text-[var(--pbp-text-subtle)] lg:hidden">{sortLabels.target}</p>
          <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{candidate.fileName}</p>
          <p className="mt-1 text-xs text-[var(--pbp-text-muted)]">
            {candidate.candidateKind === "workorder"
              ? buildSystemStorageWorkOrderBundleMetaLabel({ documentCount: candidate.documentCount, designCount: candidate.designCount }, purgeCopy)
              : `${candidate.fileTypeLabel} · ${candidate.thumbnailCountLabel}`}
          </p>
        </div>
      ),
    },
    {
      key: "dates",
      label: (
        <span className="flex flex-col gap-1">
          {renderSortButton("deletedAt")}
          {renderSortButton("purgeDueAt")}
        </span>
      ),
      render: (candidate) => (
        <div className="text-xs leading-5 text-[var(--pbp-text-muted)]">
          <p>{purgeCopy.list.deletedAtLabel}: {candidate.deletedAt}</p>
          <p>{purgeCopy.list.purgeDueAtLabel}: {candidate.purgeDueAt}</p>
          <p className="font-semibold text-[var(--pbp-status-danger)]">{purgeCopy.list.overdueLabel}: {candidate.overdueDays}일</p>
        </div>
      ),
    },
    {
      key: "status",
      label: (
        <span className="flex flex-col gap-1">
          {renderSortButton("size")}
          {renderSortButton("status")}
        </span>
      ),
      render: (candidate) => (
        <div>
          <p className={`font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{candidate.originalSizeLabel}</p>
          <AdminStatusBadge className="mt-1">{candidate.purgeStatusLabel}</AdminStatusBadge>
          {candidate.lastPurgeError ? <p className="mt-1 text-xs text-[var(--pbp-status-danger)]">{candidate.lastPurgeError}</p> : null}
        </div>
      ),
    },
    {
      key: "keys",
      label: (
        <span className="flex flex-col gap-1">
          <span>{purgeCopy.list.keyHeader}</span>
          <span className="flex gap-3">
            {renderSortButton("attachmentCount")}
          </span>
        </span>
      ),
      render: (candidate) => (
        <div className="space-y-2">
          <div>
            <p className="text-[11px] font-semibold text-[var(--pbp-text-subtle)]">{purgeCopy.list.sourceKeyTitle}</p>
            {candidate.candidateKind === "workorder" ? <span className={SYSTEM_SUBTLE_TEXT_CLASS}>{purgeCopy.list.workOrderSourceHint}</span> : renderKey(candidate.storageKey)}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[var(--pbp-text-subtle)]">{purgeCopy.list.thumbnailKeyTitle}</p>
            {candidate.candidateKind === "workorder" ? <span className={SYSTEM_SUBTLE_TEXT_CLASS}>{purgeCopy.list.workOrderRetryHint}</span> : renderKey(candidate.thumbnailKey)}
          </div>
        </div>
      ),
    },
  ];


  async function runSelectedPurge() {
    if (selectedIds.length === 0 || isPending) return;
    const confirmed = window.confirm(buildSystemStorageSelectedPurgeConfirmMessage(selectedIds.length, purgeCopy));
    if (!confirmed) return;

    setIsPending(true);
    setResultMessage(null);
    setResultTone(null);
    try {
      const result = await postPurgeRequest({ mode: "selected", trashItemIds: selectedIds, limit: selectedIds.length });
      setResultMessage(buildSystemStoragePurgeResultMessage(purgeCopy.result.selectedLabel, result, purgeCopy));
      setResultTone(getSystemStoragePurgeResultTone(result));
      setResultEventKey((currentKey) => currentKey + 1);
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : purgeCopy.result.selectedError);
      setResultTone("error");
      setResultEventKey((currentKey) => currentKey + 1);
    } finally {
      setIsPending(false);
    }
  }

  async function runAllDuePurge() {
    if (!hasCandidates || isPending) return;
    const confirmed = window.confirm(purgeCopy.confirm.allDue);
    if (!confirmed) return;

    setIsPending(true);
    setResultMessage(null);
    setResultTone(null);
    try {
      const result = await postPurgeRequest({ mode: "all-due", limit: 200 });
      setResultMessage(buildSystemStoragePurgeResultMessage(purgeCopy.result.allDueLabel, result, purgeCopy));
      setResultTone(getSystemStoragePurgeResultTone(result));
      setResultEventKey((currentKey) => currentKey + 1);
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : purgeCopy.result.allDueError);
      setResultTone("error");
      setResultEventKey((currentKey) => currentKey + 1);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className={SYSTEM_PANEL_CLASS}>
      <div className={`flex flex-col gap-3 ${SYSTEM_SECTION_HEADER_CLASS} lg:flex-row lg:items-center lg:justify-between`}>
        <div>
          <h2 className={`text-lg font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{purgeCopy.list.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--pbp-text-muted)]">
            {purgeCopy.list.description}
          </p>
          <p className="mt-2 text-xs font-medium text-[var(--pbp-text-muted)]">
            {purgeCopy.list.currentSort}: {sortLabels[sortState.key]} · {getSystemStorageSortDirectionLabel(sortState.direction, t)}
          </p>
          <ToastMessage message={resultMessage} tone={toToastTone(resultTone)} eventKey={resultEventKey} />
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <AdminButton onClick={refreshCandidates} disabled={isPending}>
            {purgeCopy.list.refresh}
          </AdminButton>
          <AdminButton onClick={runSelectedPurge} disabled={selectedCount === 0 || isPending}>
            {isPending ? purgeCopy.list.pending : `${purgeCopy.list.selectDelete} (${selectedCount})`}
          </AdminButton>
          <AdminButton variant="danger" onClick={runAllDuePurge} disabled={!hasCandidates || isPending}>
            {isPending ? purgeCopy.list.pending : purgeCopy.list.deleteAll}
          </AdminButton>
        </div>
      </div>

      <AdminTable
        className="mt-4 overflow-x-auto"
        items={sortedCandidates}
        columns={purgeCandidateTableColumns}
        getRowKey={(candidate) => candidate.trashItemId}
        emptyLabel={purgeCopy.list.empty}
        emptyDescription={purgeCopy.list.emptyDescription}
        gridTemplateColumns="0.24fr 0.58fr 1.05fr 1.15fr 1fr 0.82fr 1.5fr"
        rowBaseClassName="grid w-full gap-3 px-4 py-4 text-left text-sm lg:min-w-[980px] lg:items-start"
        responsiveGridClassName="grid-cols-1 lg:[grid-template-columns:var(--admin-table-columns)]"
        headerClassName={`${SYSTEM_TABLE_HEADER_CLASS} lg:[grid-template-columns:var(--admin-table-columns)]`}
      />
    </section>
  );
}
