"use client";

import { useState } from "react";
import { runPurgeWorkerFlow } from "@/lib/admin/files/actionFlow";

export default function SystemStoragePurgeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRun(dryRun: boolean) {
    setIsRunning(true);
    const result = await runPurgeWorkerFlow(dryRun);
    setMessage(result.message);
    setIsRunning(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
      >
        용량관리
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="system-storage-purge-title" className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">SYSTEM STORAGE</p>
                <h2 id="system-storage-purge-title" className="mt-1 text-lg font-semibold text-stone-950">용량관리</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-semibold text-stone-700 shadow-sm hover:bg-stone-50">
                닫기
              </button>
            </header>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
                고객사 관리자 화면에서 분리된 실제 삭제 관리 기능입니다. 실제 삭제 실행 전 후보 확인을 먼저 실행합니다.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleRun(true)}
                  disabled={isRunning}
                  className="rounded-2xl border border-stone-300 bg-white px-4 py-4 text-left text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:text-stone-400"
                >
                  실제삭제 후보 확인
                </button>
                <button
                  type="button"
                  onClick={() => handleRun(false)}
                  disabled={isRunning}
                  className="rounded-2xl border border-red-200 bg-white px-4 py-4 text-left text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:text-stone-400"
                >
                  R2 실제 삭제
                </button>
              </div>
              {message ? <div className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white">{message}</div> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
