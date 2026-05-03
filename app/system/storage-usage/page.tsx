import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import { getSystemStoragePurgeCandidateSnapshot } from "@/lib/system/storagePurgeCandidates";

function renderKey(value: string | null) {
  if (!value) return <span className="text-stone-400">없음</span>;
  return <code className="break-all text-[11px] leading-5 text-stone-500">{value}</code>;
}

export default async function SystemStorageUsagePage() {
  const snapshot = await getSystemStoragePurgeCandidateSnapshot();
  const { summary, candidates } = snapshot;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                SYSTEM STORAGE PURGE
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  R2 실제 삭제 후보
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  전 고객 공통 30일 휴지통 정책에 따라 삭제 예정일이 도래한 파일을 확인합니다. 이 화면은 후보 확인 1차 화면이며, 실제 R2 삭제 실행은 다음 버전에서 확인 모달과 함께 연결합니다.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템 콘솔
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">삭제 후보</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.candidateCount}개</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">30일 경과 또는 영구삭제 요청 상태</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">고객사</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.companyCount}곳</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">후보 파일이 있는 고객사 수</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">원본 용량</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.totalOriginalSizeLabel}</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">썸네일 용량은 추후 별도 산정</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500">썸네일 객체</p>
            <p className="mt-3 text-2xl font-semibold text-stone-950">{summary.thumbnailObjectCount}개</p>
            <p className="mt-2 text-xs leading-5 text-stone-600">R2 삭제 시 원본과 함께 처리 대상</p>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">삭제 후보 목록</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                고객사 관리자가 삭제한 뒤 {summary.retentionDays}일이 지난 파일과 영구삭제 요청 파일입니다. 실제 삭제 전 원본 key와 썸네일 key를 함께 확인합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled
                className="rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400"
              >
                선택 삭제 준비중
              </button>
              <button
                type="button"
                disabled
                className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-300"
              >
                전체 도래 항목 삭제 준비중
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
            <div className="hidden grid-cols-[1.1fr_1.2fr_1fr_0.8fr_1.6fr] gap-3 border-b border-stone-200 bg-stone-100 px-4 py-3 text-xs font-semibold text-stone-600 lg:grid">
              <span>고객사 / 작업지시서</span>
              <span>파일</span>
              <span>삭제일 / 예정일</span>
              <span>용량 / 상태</span>
              <span>R2 key</span>
            </div>

            {candidates.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-stone-500">
                현재 R2 실제 삭제 후보가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {candidates.map((candidate) => (
                  <article
                    key={candidate.trashItemId}
                    className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.1fr_1.2fr_1fr_0.8fr_1.6fr]"
                  >
                    <div>
                      <p className="font-semibold text-stone-950">{candidate.companyName}</p>
                      <p className="mt-1 text-xs leading-5 text-stone-500">{candidate.workorderTitle}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{candidate.fileName}</p>
                      <p className="mt-1 text-xs text-stone-500">{candidate.fileTypeLabel} · {candidate.thumbnailCountLabel}</p>
                    </div>
                    <div className="text-xs leading-5 text-stone-600">
                      <p>삭제일: {candidate.deletedAt}</p>
                      <p>예정일: {candidate.purgeDueAt}</p>
                      <p className="font-semibold text-red-600">경과: {candidate.overdueDays}일</p>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{candidate.originalSizeLabel}</p>
                      <p className="mt-1 text-xs text-stone-500">{candidate.purgeStatusLabel}</p>
                      {candidate.lastPurgeError ? (
                        <p className="mt-1 text-xs text-red-600">{candidate.lastPurgeError}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[11px] font-semibold text-stone-400">원본</p>
                        {renderKey(candidate.storageKey)}
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-stone-400">썸네일</p>
                        {renderKey(candidate.thumbnailKey)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
