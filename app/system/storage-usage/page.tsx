import Link from "next/link";

import { SystemStoragePurgeCandidatesClient } from "@/components/system/storage/SystemStoragePurgeCandidatesClient";
import { APP_VERSION } from "@/lib/constants/app";
import { getSystemStoragePurgeCandidateSnapshot } from "@/lib/system/storagePurgeCandidates";

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
                  전 고객 공통 30일 휴지통 정책에 따라 삭제 예정일이 도래한 파일을 확인합니다. 이 화면에서 후보를 확인한 뒤 선택 항목 또는 전체 도래 항목을 Worker 기반으로 실제 삭제할 수 있습니다.
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

        <SystemStoragePurgeCandidatesClient candidates={candidates} />
      </div>
    </main>
  );
}
