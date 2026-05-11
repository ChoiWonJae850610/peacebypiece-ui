"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_PROCESS_STANDARD_CATEGORY_LABELS,
  SYSTEM_PROCESS_STANDARD_POLICY,
  SYSTEM_PROCESS_STANDARD_ROWS,
  SYSTEM_PROCESS_STANDARD_STATUS_LABELS,
  type SystemProcessStandardRow,
  type SystemProcessStandardStatus,
} from "@/lib/system/standards/systemProcessStandards";

const statusClassNames: Record<SystemProcessStandardStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-stone-200 bg-stone-50 text-stone-500",
  review: "border-amber-200 bg-amber-50 text-amber-700",
};

type ProcessFormState = {
  code: string;
  name: string;
  category: string;
  description: string;
  example: string;
  sortOrder: string;
};

const EMPTY_FORM: ProcessFormState = {
  code: "",
  name: "",
  category: "surface",
  description: "",
  example: "",
  sortOrder: "60",
};

function toEditableState(row: SystemProcessStandardRow): ProcessFormState {
  return {
    code: row.code,
    name: row.name,
    category: row.category,
    description: row.description,
    example: row.example,
    sortOrder: String(row.sortOrder),
  };
}

function toSortOrder(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

export default function SystemProcessStandardsPage() {
  const [records, setRecords] = useState<SystemProcessStandardRow[]>(SYSTEM_PROCESS_STANDARD_ROWS);
  const [form, setForm] = useState<ProcessFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ProcessFormState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("DB 연결 시 시스템 외주공정 유형 원장을 조회합니다.");

  const activeCount = useMemo(() => records.filter((record) => record.status === "active").length, [records]);

  async function loadRecords() {
    setIsLoading(true);
    setMessage("외주공정 유형을 불러오는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/processes", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; records?: SystemProcessStandardRow[]; message?: string };
      if (!response.ok || !payload.ok || !Array.isArray(payload.records)) {
        throw new Error(payload.message || "외주공정 유형을 불러오지 못했습니다.");
      }
      setRecords(payload.records);
      setMessage(`외주공정 유형 ${payload.records.length}개를 불러왔습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "외주공정 유형 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  async function createRecord() {
    setIsSaving(true);
    setMessage("외주공정 유형을 추가하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          category: form.category,
          description: form.description,
          example: form.example,
          sortOrder: toSortOrder(form.sortOrder),
          isActive: true,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProcessStandardRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "외주공정 유형을 추가하지 못했습니다.");
      }
      setRecords((current) => [...current, payload.record as SystemProcessStandardRow].sort((a, b) => a.sortOrder - b.sortOrder));
      setForm(EMPTY_FORM);
      setMessage("외주공정 유형을 추가했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "외주공정 유형 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRecord(row: SystemProcessStandardRow) {
    if (!editingForm) return;
    setIsSaving(true);
    setMessage("외주공정 유형을 수정하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/processes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          code: editingForm.code,
          name: editingForm.name,
          category: editingForm.category,
          description: editingForm.description,
          example: editingForm.example,
          sortOrder: toSortOrder(editingForm.sortOrder),
          isActive: row.status === "active",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProcessStandardRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "외주공정 유형을 수정하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === row.id ? (payload.record as SystemProcessStandardRow) : item)));
      setEditingId(null);
      setEditingForm(null);
      setMessage("외주공정 유형을 수정했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "외주공정 유형 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(row: SystemProcessStandardRow) {
    setIsSaving(true);
    setMessage("외주공정 유형 사용 상태를 변경하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/processes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, isActive: row.status !== "active" }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProcessStandardRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "외주공정 유형 사용 상태를 변경하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === row.id ? (payload.record as SystemProcessStandardRow) : item)));
      setMessage("외주공정 유형 사용 상태를 변경했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "외주공정 유형 사용 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                SYSTEM STANDARD MASTER
              </p>
              <h1 className="text-2xl font-semibold text-stone-950">외주공정 유형 관리</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                시스템관리자가 고객사 공통 외주공정 유형 원장을 추가·수정하고 활성 상태를 관리합니다. 고객사는 이 원장 중 필요한 공정만 사용합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/system/standards"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                기준정보 설계
              </Link>
              <Link
                href="/system"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                시스템 콘솔
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">시스템 외주공정 유형 원장</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  총 {records.length}개 중 활성 {activeCount}개입니다. 코드 중복은 허용하지 않습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={loadRecords}
                disabled={isLoading || isSaving}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-400"
              >
                {isLoading ? "조회중" : "새로고침"}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <div className="grid gap-2 md:grid-cols-[0.8fr_0.8fr_0.8fr_120px]">
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="공정명"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
                />
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="시스템 코드 예: printing"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
                />
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
                >
                  {Object.entries(SYSTEM_PROCESS_STANDARD_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  placeholder="정렬"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
                />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_120px]">
                <input
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="설명"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
                />
                <input
                  value={form.example}
                  onChange={(event) => setForm((current) => ({ ...current, example: event.target.value }))}
                  placeholder="사용 예시"
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400"
                />
                <button
                  type="button"
                  onClick={createRecord}
                  disabled={isSaving || !form.code.trim() || !form.name.trim()}
                  className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                  공정 추가
                </button>
              </div>
            </div>

            <p className="mt-3 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">{message}</p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
              <div className="grid grid-cols-[0.65fr_0.65fr_0.75fr_1.15fr_0.75fr_0.45fr_0.75fr] gap-3 border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                <span>공정명</span>
                <span>코드</span>
                <span>분류</span>
                <span>설명</span>
                <span>사용 예시</span>
                <span className="text-right">정렬</span>
                <span className="text-right">상태/수정</span>
              </div>
              <div className="max-h-[460px] divide-y divide-stone-100 overflow-y-auto bg-white">
                {records.map((row) => {
                  const isEditing = editingId === row.id && editingForm;
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[0.65fr_0.65fr_0.75fr_1.15fr_0.75fr_0.45fr_0.75fr] gap-3 px-4 py-3 text-sm text-stone-700"
                    >
                      {isEditing ? (
                        <>
                          <input
                            value={editingForm.name}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, name: event.target.value } : current)}
                            className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                          <input
                            value={editingForm.code}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, code: event.target.value } : current)}
                            className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                          <select
                            value={editingForm.category}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, category: event.target.value } : current)}
                            className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          >
                            {Object.entries(SYSTEM_PROCESS_STANDARD_CATEGORY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <input
                            value={editingForm.description}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, description: event.target.value } : current)}
                            className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                          <input
                            value={editingForm.example}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, example: event.target.value } : current)}
                            className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
                          />
                          <input
                            value={editingForm.sortOrder}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, sortOrder: event.target.value } : current)}
                            className="rounded-lg border border-stone-200 px-2 py-1 text-right text-sm"
                          />
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => saveRecord(row)}
                              disabled={isSaving}
                              className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white disabled:bg-stone-300"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditingForm(null);
                              }}
                              className="rounded-full border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600"
                            >
                              취소
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-stone-950">{row.name}</span>
                          <span className="font-mono text-xs font-semibold text-stone-600">{row.code}</span>
                          <span className="text-xs text-stone-500">{SYSTEM_PROCESS_STANDARD_CATEGORY_LABELS[row.category] || row.category}</span>
                          <span className="text-xs leading-5 text-stone-600">{row.description}</span>
                          <span className="text-xs text-stone-500">{row.example}</span>
                          <span className="text-right text-xs text-stone-500">{row.sortOrder}</span>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleActive(row)}
                              disabled={isSaving}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClassNames[row.status]}`}
                            >
                              {SYSTEM_PROCESS_STANDARD_STATUS_LABELS[row.status]}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(row.id);
                                setEditingForm(toEditableState(row));
                              }}
                              className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-50"
                            >
                              수정
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">1차 연결 범위</h2>
              <ul className="mt-4 grid gap-3">
                {SYSTEM_PROCESS_STANDARD_POLICY.map((note) => (
                  <li
                    key={note}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600"
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800 shadow-sm">
              <h2 className="font-semibold text-amber-900">후속 구현 메모</h2>
              <p className="mt-2">
                외주공정 유형 원장 CRUD를 먼저 연결했습니다. 고객사별 사용 여부 저장과 고객관리자 화면 반영은 후속 단계에서 연결합니다.
              </p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
