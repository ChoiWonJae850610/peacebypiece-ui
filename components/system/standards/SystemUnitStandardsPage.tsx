"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_PANEL_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_UNIT_STANDARD_CATEGORY_LABELS,
  SYSTEM_UNIT_STANDARD_POLICY,
  SYSTEM_UNIT_STANDARD_STATUS_LABELS,
  type SystemUnitStandardRow,
  type SystemUnitStandardStatus,
} from "@/lib/system/standards/systemUnitStandards";

const statusBadgeTones: Record<SystemUnitStandardStatus, AdminStatusBadgeTone> = {
  active: "success",
  inactive: "neutral",
  review: "warning",
};

type UnitFormState = {
  code: string;
  koreanName: string;
  englishCode: string;
  category: string;
  description: string;
  example: string;
  sortOrder: string;
};

const EMPTY_FORM: UnitFormState = {
  code: "",
  koreanName: "",
  englishCode: "",
  category: "count",
  description: "",
  example: "",
  sortOrder: "80",
};

function toEditableState(row: SystemUnitStandardRow): UnitFormState {
  return {
    code: row.code,
    koreanName: row.koreanName,
    englishCode: row.englishCode,
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

export default function SystemUnitStandardsPage() {
  const [records, setRecords] = useState<SystemUnitStandardRow[]>([]);
  const [form, setForm] = useState<UnitFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<UnitFormState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("DB 기준 시스템 단위 표준 원장을 조회합니다.");
  const loadSeqRef = useRef(0);

  const activeCount = useMemo(() => records.filter((record) => record.status === "active").length, [records]);

  async function loadRecords() {
    const requestId = loadSeqRef.current + 1;
    loadSeqRef.current = requestId;
    setIsLoading(true);
    setMessage("단위 표준을 불러오는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/units", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; records?: SystemUnitStandardRow[]; message?: string };
      if (!response.ok || !payload.ok || !Array.isArray(payload.records)) {
        throw new Error(payload.message || "단위 표준을 불러오지 못했습니다.");
      }
      if (loadSeqRef.current !== requestId) return;
      setRecords(payload.records);
      setMessage(`단위 표준 ${payload.records.length}개를 불러왔습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "단위 표준 조회 중 오류가 발생했습니다.");
    } finally {
      if (loadSeqRef.current === requestId) setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  async function createRecord() {
    setIsSaving(true);
    setMessage("단위 표준을 추가하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          koreanName: form.koreanName,
          englishCode: form.englishCode,
          category: form.category,
          description: form.description,
          example: form.example,
          sortOrder: toSortOrder(form.sortOrder),
          isActive: true,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemUnitStandardRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "단위 표준을 추가하지 못했습니다.");
      }
      setRecords((current) => [...current, payload.record as SystemUnitStandardRow].sort((a, b) => a.sortOrder - b.sortOrder));
      setForm(EMPTY_FORM);
      setMessage("단위 표준을 추가했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "단위 표준 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRecord(row: SystemUnitStandardRow) {
    if (!editingForm) return;
    setIsSaving(true);
    setMessage("단위 표준을 수정하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/units", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          code: editingForm.code,
          koreanName: editingForm.koreanName,
          englishCode: editingForm.englishCode,
          category: editingForm.category,
          description: editingForm.description,
          example: editingForm.example,
          sortOrder: toSortOrder(editingForm.sortOrder),
          isActive: row.status === "active",
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemUnitStandardRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "단위 표준을 수정하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === row.id ? (payload.record as SystemUnitStandardRow) : item)));
      setEditingId(null);
      setEditingForm(null);
      setMessage("단위 표준을 수정했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "단위 표준 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(row: SystemUnitStandardRow) {
    setIsSaving(true);
    setMessage("단위 표준 사용 상태를 변경하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/units", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, isActive: row.status !== "active" }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemUnitStandardRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "단위 표준 사용 상태를 변경하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === row.id ? (payload.record as SystemUnitStandardRow) : item)));
      setMessage("단위 표준 사용 상태를 변경했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "단위 표준 사용 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SystemShell>
        <header className={SYSTEM_HEADER_PANEL_CLASS}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className={SYSTEM_EYEBROW_CLASS}>
                SYSTEM STANDARD MASTER
              </p>
              <h1 className={SYSTEM_TITLE_CLASS}>단위 표준 관리</h1>
              <p className={SYSTEM_SUBTITLE_CLASS}>
                시스템관리자가 고객사 공통 단위 표준 원장을 추가·수정하고 활성 상태를 관리합니다. 고객사는 이 원장 중 필요한 단위만 사용합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <AdminStatusBadge tone="neutral">v{APP_VERSION}</AdminStatusBadge>
              <AdminLinkButton href="/system/standards">기준정보 설계</AdminLinkButton>
              <AdminLinkButton href="/system">시스템 콘솔</AdminLinkButton>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <article className={SYSTEM_PANEL_CLASS}>
            <div className="flex flex-col gap-3 border-b border-[var(--pbp-border-soft)] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className={SYSTEM_SECTION_TITLE_CLASS}>시스템 단위 표준 원장</h2>
                <p className={`mt-1 ${SYSTEM_BODY_TEXT_CLASS}`}>
                  총 {records.length}개 중 활성 {activeCount}개입니다. 코드 중복은 허용하지 않습니다.
                </p>
              </div>
              <AdminButton onClick={loadRecords} disabled={isLoading || isSaving}>
                {isLoading ? "조회중" : "새로고침"}
              </AdminButton>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-3">
              <div className="grid gap-2 md:grid-cols-[0.8fr_0.8fr_0.8fr_0.8fr]">
                <input
                  value={form.koreanName}
                  onChange={(event) => setForm((current) => ({ ...current, koreanName: event.target.value }))}
                  placeholder="한글명"
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                />
                <input
                  value={form.englishCode}
                  onChange={(event) => setForm((current) => ({ ...current, englishCode: event.target.value }))}
                  placeholder="영문 코드/약어"
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                />
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="시스템 코드 예: piece"
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                />
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                >
                  {Object.entries(SYSTEM_UNIT_STANDARD_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_120px_120px]">
                <input
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="설명"
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                />
                <input
                  value={form.example}
                  onChange={(event) => setForm((current) => ({ ...current, example: event.target.value }))}
                  placeholder="사용 예시"
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                />
                <input
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  placeholder="정렬"
                  className="rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--pbp-accent)]"
                />
                <AdminButton
                  onClick={createRecord}
                  disabled={isSaving || !form.code.trim() || !form.koreanName.trim() || !form.englishCode.trim()}
                  variant="primary"
                  size="md"
                  className="w-full rounded-xl"
                >
                  단위 추가
                </AdminButton>
              </div>
            </div>

            <p className="mt-3 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">{message}</p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--pbp-border)]">
              <div className="grid grid-cols-[0.65fr_0.65fr_0.7fr_1.1fr_0.7fr_0.45fr_0.75fr] gap-3 border-b border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-muted)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--pbp-text-subtle)]">
                <span>한글명</span>
                <span>영문 코드</span>
                <span>분류</span>
                <span>설명</span>
                <span>사용 예시</span>
                <span className="text-right">정렬</span>
                <span className="text-right">상태/수정</span>
              </div>
              <div className="max-h-[460px] divide-y divide-stone-100 overflow-y-auto bg-[var(--pbp-surface)]">
                {records.map((row) => {
                  const isEditing = editingId === row.id && editingForm;
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[0.65fr_0.65fr_0.7fr_1.1fr_0.7fr_0.45fr_0.75fr] gap-3 px-4 py-3 text-sm text-[var(--pbp-text-primary)]"
                    >
                      {isEditing ? (
                        <>
                          <input
                            value={editingForm.koreanName}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, koreanName: event.target.value } : current)}
                            className="rounded-lg border border-[var(--pbp-border)] px-2 py-1 text-sm"
                          />
                          <input
                            value={editingForm.englishCode}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, englishCode: event.target.value } : current)}
                            className="rounded-lg border border-[var(--pbp-border)] px-2 py-1 text-sm"
                          />
                          <select
                            value={editingForm.category}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, category: event.target.value } : current)}
                            className="rounded-lg border border-[var(--pbp-border)] px-2 py-1 text-sm"
                          >
                            {Object.entries(SYSTEM_UNIT_STANDARD_CATEGORY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <input
                            value={editingForm.description}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, description: event.target.value } : current)}
                            className="rounded-lg border border-[var(--pbp-border)] px-2 py-1 text-sm"
                          />
                          <input
                            value={editingForm.example}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, example: event.target.value } : current)}
                            className="rounded-lg border border-[var(--pbp-border)] px-2 py-1 text-sm"
                          />
                          <input
                            value={editingForm.sortOrder}
                            onChange={(event) => setEditingForm((current) => current ? { ...current, sortOrder: event.target.value } : current)}
                            className="rounded-lg border border-[var(--pbp-border)] px-2 py-1 text-right text-sm"
                          />
                          <div className="flex justify-end gap-1">
                            <AdminButton
                              onClick={() => saveRecord(row)}
                              disabled={isSaving}
                              variant="primary"
                              className="min-h-0 px-3 py-1 text-xs"
                            >
                              저장
                            </AdminButton>
                            <AdminButton
                              onClick={() => {
                                setEditingId(null);
                                setEditingForm(null);
                              }}
                              className="min-h-0 px-3 py-1 text-xs"
                            >
                              취소
                            </AdminButton>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold text-[var(--pbp-text-primary)]">{row.koreanName}</span>
                          <span className="font-mono text-xs font-semibold text-[var(--pbp-text-muted)]">{row.englishCode}</span>
                          <span className="text-xs text-[var(--pbp-text-subtle)]">{SYSTEM_UNIT_STANDARD_CATEGORY_LABELS[row.category] || row.category}</span>
                          <span className="text-xs leading-5 text-[var(--pbp-text-muted)]">{row.description}</span>
                          <span className="text-xs text-[var(--pbp-text-subtle)]">{row.example}</span>
                          <span className="text-right text-xs text-[var(--pbp-text-subtle)]">{row.sortOrder}</span>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleActive(row)}
                              disabled={isSaving}
                              className="rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <AdminStatusBadge tone={statusBadgeTones[row.status]} size="xs">
                                {SYSTEM_UNIT_STANDARD_STATUS_LABELS[row.status]}
                              </AdminStatusBadge>
                            </button>
                            <AdminButton
                              onClick={() => {
                                setEditingId(row.id);
                                setEditingForm(toEditableState(row));
                              }}
                              className="min-h-0 px-2.5 py-1 text-[11px]"
                            >
                              수정
                            </AdminButton>
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
            <article className={SYSTEM_PANEL_CLASS}>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>1차 연결 범위</h2>
              <ul className="mt-4 grid gap-3">
                {SYSTEM_UNIT_STANDARD_POLICY.map((note) => (
                  <li
                    key={note}
                    className={`${SYSTEM_MUTED_CARD_CLASS} text-sm leading-6 text-[var(--pbp-text-muted)]`}
                  >
                    {note}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] p-5 text-sm leading-6 text-[var(--pbp-status-warning)] shadow-sm">
              <h2 className="font-semibold text-[var(--pbp-status-warning)]">후속 구현 메모</h2>
              <p className="mt-2">
                단위 표준 원장 CRUD를 먼저 연결했습니다. 고객사별 사용 여부 저장과 고객관리자 화면 반영은 후속 단계에서 연결합니다.
              </p>
            </article>
          </aside>
        </section>
    </SystemShell>
  );
}
