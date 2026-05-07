"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { SystemStoragePurgeCandidate } from "@/lib/system/storagePurgeCandidates";

type PurgeResponse = {
  ok: boolean;
  candidateCount?: number;
  purgedCount?: number;
  failedCount?: number;
  message?: string;
  error?: string;
};

type SystemStoragePurgeCandidatesClientProps = {
  candidates: SystemStoragePurgeCandidate[];
};

function renderKey(value: string | null) {
  if (!value) return <span className="text-stone-400">없음</span>;
  return <code className="break-all text-[11px] leading-5 text-stone-500">{value}</code>;
}

function buildPurgeResultMessage(label: string, result: PurgeResponse) {
  const purgedCount = result.purgedCount ?? 0;
  const failedCount = result.failedCount ?? 0;
  if (failedCount > 0) {
    return `${label}: ${purgedCount}개 삭제 완료, ${failedCount}개 실패. 실패 항목은 목록에 남아 재시도할 수 있습니다.`;
  }
  return `${label}: ${purgedCount}개 삭제 완료. 후보 목록과 요약이 갱신됩니다.`;
}

function getPurgeResultTone(result: PurgeResponse): "success" | "warning" {
  return (result.failedCount ?? 0) > 0 ? "warning" : "success";
}

function getResultMessageClass(tone: "success" | "warning" | "error" | null) {
  if (tone === "error") return "bg-red-50 text-red-700 ring-1 ring-red-100";
  if (tone === "warning") return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
  return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
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
  const [resultTone, setResultTone] = useState<"success" | "warning" | "error" | null>(null);

  const selectedCount = selectedIds.length;
  const hasCandidates = candidates.length > 0;
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggleCandidate(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleAll() {
    setSelectedIds((current) => (current.length === candidates.length ? [] : candidates.map((candidate) => candidate.trashItemId)));
  }

  async function runSelectedPurge() {
    if (selectedIds.length === 0 || isPending) return;
    const confirmed = window.confirm(`선택한 ${selectedIds.length}개 삭제 후보를 처리합니다. 파일은 R2에서 실제 삭제하고, 작업지시서는 DB 삭제 완료 상태로 전환합니다. 이 작업은 복구할 수 없습니다. 계속할까요?`);
    if (!confirmed) return;

    setIsPending(true);
    setResultMessage(null);
    setResultTone(null);
    try {
      const result = await postPurgeRequest({ mode: "selected", trashItemIds: selectedIds, limit: selectedIds.length });
      setResultMessage(buildPurgeResultMessage("선택 삭제 결과", result));
      setResultTone(getPurgeResultTone(result));
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "선택 삭제 요청에 실패했습니다.");
      setResultTone("error");
    } finally {
      setIsPending(false);
    }
  }

  async function runAllDuePurge() {
    if (!hasCandidates || isPending) return;
    const confirmed = window.confirm(`삭제 예정일이 도래했거나 영구삭제 요청된 후보를 처리합니다. 파일은 R2에서 실제 삭제하고, 작업지시서는 DB 삭제 완료 상태로 전환합니다. 계속할까요?`);
    if (!confirmed) return;

    setIsPending(true);
    setResultMessage(null);
    setResultTone(null);
    try {
      const result = await postPurgeRequest({ mode: "all-due", limit: 200 });
      setResultMessage(buildPurgeResultMessage("전체 도래 항목 삭제 결과", result));
      setResultTone(getPurgeResultTone(result));
      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "전체 도래 항목 삭제 요청에 실패했습니다.");
      setResultTone("error");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">삭제 후보 목록</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            파일 후보는 원본/썸네일 key를 확인한 뒤 Worker로 실제 삭제합니다. 작업지시서 후보는 DB 삭제 완료 상태로 전환하고 연결 파일은 R2 purge 후보로 이어집니다.
          </p>
          {resultMessage ? <p className={`mt-2 rounded-2xl px-3 py-2 text-xs font-medium ${getResultMessageClass(resultTone)}`}>{resultMessage}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runSelectedPurge}
            disabled={selectedCount === 0 || isPending}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
          >
            {isPending ? "처리 중" : `선택 삭제 (${selectedCount})`}
          </button>
          <button
            type="button"
            onClick={runAllDuePurge}
            disabled={!hasCandidates || isPending}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:border-red-100 disabled:bg-red-50 disabled:text-red-300"
          >
            {isPending ? "처리 중" : "전체 도래 후보 처리"}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
        <div className="hidden grid-cols-[0.22fr_0.55fr_1.05fr_1.15fr_1fr_0.8fr_1.45fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold text-stone-600 lg:grid">
          <span>
            <input type="checkbox" checked={hasCandidates && selectedCount === candidates.length} onChange={toggleAll} disabled={!hasCandidates || isPending} />
          </span>
          <span>구분</span>
          <span>고객사 / 작업지시서</span>
          <span>대상</span>
          <span>삭제일 / 예정일</span>
          <span>용량 / 상태</span>
          <span>R2 key</span>
        </div>

        {candidates.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-stone-500">현재 R2 실제 삭제 후보가 없습니다.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {candidates.map((candidate) => (
              <article key={candidate.trashItemId} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[0.22fr_0.55fr_1.05fr_1.15fr_1fr_0.8fr_1.45fr]">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedIdSet.has(candidate.trashItemId)}
                    onChange={() => toggleCandidate(candidate.trashItemId)}
                    disabled={isPending}
                    aria-label={`${candidate.fileName} 삭제 후보 선택`}
                  />
                </div>
                <div className="space-y-1">
                  {candidate.previewUrl ? (
                    <img
                      src={candidate.previewUrl}
                      alt={`${candidate.fileName} 미리보기`}
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
                      ? `작업지시서 · 첨부 ${candidate.attachmentCount}개 · 메모 ${candidate.memoCount}개`
                      : `${candidate.fileTypeLabel} · ${candidate.thumbnailCountLabel}`}
                  </p>
                </div>
                <div className="text-xs leading-5 text-stone-600">
                  <p>삭제일: {candidate.deletedAt}</p>
                  <p>예정일: {candidate.purgeDueAt}</p>
                  <p className="font-semibold text-red-600">경과: {candidate.overdueDays}일</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{candidate.originalSizeLabel}</p>
                  <p className="mt-1 text-xs text-stone-500">{candidate.purgeStatusLabel}</p>
                  {candidate.lastPurgeError ? <p className="mt-1 text-xs text-red-600">{candidate.lastPurgeError}</p> : null}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400">원본</p>
                    {candidate.candidateKind === "workorder" ? <span className="text-stone-400">작업지시서 후보</span> : renderKey(candidate.storageKey)}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400">썸네일</p>
                    {candidate.candidateKind === "workorder" ? <span className="text-stone-400">연결 파일 별도 후보화</span> : renderKey(candidate.thumbnailKey)}
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
