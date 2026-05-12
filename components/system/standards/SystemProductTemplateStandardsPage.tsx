"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SYSTEM_PRODUCT_TEMPLATE_POLICY,
  SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS,
  isSystemProductTemplateActive,
  type SystemProductTemplateRow,
  type SystemProductTemplateStatus,
} from "@/lib/system/standards/systemProductTemplateStandards";

const statusTones: Record<SystemProductTemplateStatus, AdminStatusBadgeTone> = {
  active: "success",
  draft: "warning",
  archived: "neutral",
};

type TemplateFormState = {
  code: string;
  name: string;
  description: string;
  sortOrder: string;
};

type CategoryFormState = {
  parentId: string;
  level: "1" | "2" | "3";
  name: string;
  sortOrder: string;
};

type CategoryEditState = {
  id: string;
  name: string;
  sortOrder: string;
};

const EMPTY_TEMPLATE_FORM: TemplateFormState = {
  code: "",
  name: "",
  description: "",
  sortOrder: "30",
};

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  parentId: "",
  level: "1",
  name: "",
  sortOrder: "10",
};

function toSortOrder(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function toEditableState(row: SystemProductTemplateRow): TemplateFormState {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    sortOrder: String(row.sortOrder),
  };
}

function getTemplateCounts(template: SystemProductTemplateRow) {
  const topLevelCount = template.tree.length;
  const secondLevelCount = template.tree.reduce((sum, top) => sum + top.children.length, 0);
  const thirdLevelCount = template.tree.reduce(
    (sum, top) => sum + top.children.reduce((childSum, second) => childSum + second.children.length, 0),
    0,
  );
  return { topLevelCount, secondLevelCount, thirdLevelCount };
}

function getCategoryOptions(template: SystemProductTemplateRow, level: CategoryFormState["level"]) {
  if (level === "1") return [];

  if (level === "2") {
    return template.tree.map((top) => ({ id: top.id, label: `1차 · ${top.name}` }));
  }

  return template.tree.flatMap((top) =>
    top.children.map((second) => ({ id: second.id, label: `${top.name} > ${second.name}` })),
  );
}

function CategoryEditForm({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: {
  value: CategoryEditState;
  onChange: (next: CategoryEditState) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="grid gap-2 rounded-xl border border-stone-200 bg-white p-2 sm:grid-cols-[1fr_72px_auto]">
      <input
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-semibold text-stone-700 outline-none focus:border-stone-400"
        placeholder="분류명"
      />
      <input
        value={value.sortOrder}
        onChange={(event) => onChange({ ...value, sortOrder: event.target.value })}
        className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-right text-xs text-stone-600 outline-none focus:border-stone-400"
        placeholder="정렬"
      />
      <div className="flex items-center justify-end gap-1">
        <AdminButton type="button" size="sm" variant="primary" onClick={onSave} disabled={isSaving || !value.name.trim()} className="min-h-7 px-2.5 py-1 text-[11px]">
          저장
        </AdminButton>
        <AdminButton type="button" size="sm" variant="secondary" onClick={onCancel} disabled={isSaving} className="min-h-7 px-2.5 py-1 text-[11px]">
          취소
        </AdminButton>
      </div>
    </div>
  );
}

function TemplateTreePreview({
  template,
  onToggleCategory,
  onSaveCategory,
  editingCategory,
  onStartEditCategory,
  onChangeEditCategory,
  onCancelEditCategory,
  isSaving,
}: {
  template: SystemProductTemplateRow;
  onToggleCategory: (categoryId: string, name: string, nextActive: boolean) => void;
  onSaveCategory: () => void;
  editingCategory: CategoryEditState | null;
  onStartEditCategory: (category: { id: string; name: string; sortOrder?: number }) => void;
  onChangeEditCategory: (next: CategoryEditState) => void;
  onCancelEditCategory: () => void;
  isSaving: boolean;
}) {
  const { topLevelCount, secondLevelCount, thirdLevelCount } = getTemplateCounts(template);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-stone-950">{template.name}</h3>
            <AdminStatusBadge tone={statusTones[template.status]}>
              {SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS[template.status]}
            </AdminStatusBadge>
            {template.isDefault ? <AdminStatusBadge tone="info">기본값</AdminStatusBadge> : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-600">{template.description}</p>
          <p className="mt-1 font-mono text-[11px] font-semibold text-stone-500">{template.code}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-stone-600">
          <AdminStatusBadge tone="neutral">1차 {topLevelCount}개</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">2차 {secondLevelCount}개</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">3차 {thirdLevelCount}개</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">정렬 {template.sortOrder}</AdminStatusBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {template.tree.map((top) => {
          const isTopEditing = editingCategory?.id === top.id;
          return (
            <div key={top.id} className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              {isTopEditing ? (
                <CategoryEditForm
                  value={editingCategory}
                  onChange={onChangeEditCategory}
                  onSave={onSaveCategory}
                  onCancel={onCancelEditCategory}
                  isSaving={isSaving}
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-950">{top.name}</p>
                  <div className="flex items-center gap-1">
                    <AdminButton type="button" variant="secondary" size="sm" onClick={() => onStartEditCategory(top)} disabled={isSaving} className="min-h-7 px-2 py-0.5 text-[11px]">
                      수정
                    </AdminButton>
                    <AdminButton type="button" variant={top.isActive === false ? "ghost" : "secondary"} size="sm" onClick={() => onToggleCategory(top.id, top.name, !(top.isActive ?? true))} disabled={isSaving} className="min-h-7 px-2 py-0.5 text-[11px]">
                      {top.isActive === false ? "미사용" : "사용"}
                    </AdminButton>
                  </div>
                </div>
              )}

              <div className="mt-3 grid gap-2">
                {top.children.map((second) => {
                  const isSecondEditing = editingCategory?.id === second.id;
                  return (
                    <div key={second.id} className="rounded-xl border border-stone-200 bg-white p-3">
                      {isSecondEditing ? (
                        <CategoryEditForm
                          value={editingCategory}
                          onChange={onChangeEditCategory}
                          onSave={onSaveCategory}
                          onCancel={onCancelEditCategory}
                          isSaving={isSaving}
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-stone-700">{second.name}</p>
                          <div className="flex items-center gap-1">
                            <AdminButton type="button" variant="secondary" size="sm" onClick={() => onStartEditCategory(second)} disabled={isSaving} className="min-h-7 px-2 py-0.5 text-[11px]">
                              수정
                            </AdminButton>
                            <AdminButton type="button" variant={second.isActive === false ? "ghost" : "secondary"} size="sm" onClick={() => onToggleCategory(second.id, second.name, !(second.isActive ?? true))} disabled={isSaving} className="min-h-7 px-2 py-0.5 text-[11px]">
                              {second.isActive === false ? "미사용" : "사용"}
                            </AdminButton>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {second.children.map((leaf) => {
                          const isLeafEditing = editingCategory?.id === leaf.id;
                          if (isLeafEditing) {
                            return (
                              <div key={leaf.id} className="w-full">
                                <CategoryEditForm
                                  value={editingCategory}
                                  onChange={onChangeEditCategory}
                                  onSave={onSaveCategory}
                                  onCancel={onCancelEditCategory}
                                  isSaving={isSaving}
                                />
                              </div>
                            );
                          }

                          return (
                            <div key={leaf.id} className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 pl-2 text-[11px] font-medium text-stone-600">
                              <span className={leaf.isActive === false ? "text-stone-400" : "text-stone-600"} title={leaf.description}>
                                {leaf.name}
                              </span>
                              <AdminButton type="button" variant="ghost" size="sm" onClick={() => onStartEditCategory(leaf)} disabled={isSaving} className="min-h-7 px-1.5 py-1 text-[10px]">
                                수정
                              </AdminButton>
                              <AdminButton type="button" variant={leaf.isActive === false ? "ghost" : "secondary"} size="sm" onClick={() => onToggleCategory(leaf.id, leaf.name, !(leaf.isActive ?? true))} disabled={isSaving} className="min-h-7 px-2 py-1 text-[11px]">
                                {leaf.isActive === false ? "미사용" : "사용"}
                              </AdminButton>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SystemProductTemplateStandardsPage() {
  const [records, setRecords] = useState<SystemProductTemplateRow[]>([]);
  const [form, setForm] = useState<TemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<TemplateFormState | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryEditState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("DB 기준 시스템 생산품 유형 기본 템플릿을 조회합니다.");
  const loadSeqRef = useRef(0);

  const selectedTemplate = records.find((record) => record.id === selectedTemplateId) ?? records[0] ?? null;
  const activeCount = useMemo(() => records.filter((record) => record.status === "active").length, [records]);
  const categoryOptions = selectedTemplate ? getCategoryOptions(selectedTemplate, categoryForm.level) : [];

  async function loadRecords() {
    const requestId = loadSeqRef.current + 1;
    loadSeqRef.current = requestId;
    setIsLoading(true);
    setMessage("생산품 유형 템플릿을 불러오는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean; records?: SystemProductTemplateRow[]; message?: string };
      if (!response.ok || !payload.ok || !Array.isArray(payload.records)) {
        throw new Error(payload.message || "생산품 유형 템플릿을 불러오지 못했습니다.");
      }
      if (loadSeqRef.current !== requestId) return;
      const nextRecords = payload.records;
      setRecords(nextRecords);
      setSelectedTemplateId((current) => nextRecords.some((record) => record.id === current) ? current : nextRecords[0]?.id ?? "");
      setMessage(`생산품 유형 템플릿 ${nextRecords.length}개를 불러왔습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 조회 중 오류가 발생했습니다.");
    } finally {
      if (loadSeqRef.current === requestId) setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  async function createTemplate() {
    setIsSaving(true);
    setMessage("생산품 유형 템플릿을 추가하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
          sortOrder: toSortOrder(form.sortOrder),
          isActive: true,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProductTemplateRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "생산품 유형 템플릿을 추가하지 못했습니다.");
      }
      setRecords((current) => [...current, payload.record as SystemProductTemplateRow].sort((a, b) => a.sortOrder - b.sortOrder));
      setSelectedTemplateId(payload.record.id);
      setForm(EMPTY_TEMPLATE_FORM);
      setMessage("생산품 유형 템플릿을 추가했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTemplate(row: SystemProductTemplateRow) {
    if (!editingForm) return;
    setIsSaving(true);
    setMessage("생산품 유형 템플릿을 수정하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          code: editingForm.code,
          name: editingForm.name,
          description: editingForm.description,
          sortOrder: toSortOrder(editingForm.sortOrder),
          isActive: isSystemProductTemplateActive(row.status),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProductTemplateRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "생산품 유형 템플릿을 수정하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === row.id ? (payload.record as SystemProductTemplateRow) : item)));
      setEditingId(null);
      setEditingForm(null);
      setMessage("생산품 유형 템플릿을 수정했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleTemplate(row: SystemProductTemplateRow) {
    setIsSaving(true);
    setMessage("생산품 유형 템플릿 사용 상태를 변경하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, isActive: !isSystemProductTemplateActive(row.status) }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProductTemplateRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "생산품 유형 템플릿 상태를 변경하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === row.id ? (payload.record as SystemProductTemplateRow) : item)));
      setMessage("생산품 유형 템플릿 사용 상태를 변경했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function createCategory() {
    if (!selectedTemplate) return;
    const level = Number(categoryForm.level) as 1 | 2 | 3;
    setIsSaving(true);
    setMessage("생산품 유형 템플릿 분류를 추가하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_category",
          templateId: selectedTemplate.id,
          parentId: level === 1 ? null : categoryForm.parentId,
          level,
          name: categoryForm.name,
          sortOrder: toSortOrder(categoryForm.sortOrder),
          isActive: true,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProductTemplateRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "생산품 유형 템플릿 분류를 추가하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === payload.record?.id ? (payload.record as SystemProductTemplateRow) : item)));
      setCategoryForm(EMPTY_CATEGORY_FORM);
      setMessage("생산품 유형 템플릿 분류를 추가했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 분류 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(categoryId: string, name: string, nextActive: boolean) {
    setIsSaving(true);
    setMessage("생산품 유형 템플릿 분류 상태를 변경하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_category", id: categoryId, isActive: nextActive }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProductTemplateRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "생산품 유형 템플릿 분류 상태를 변경하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === payload.record?.id ? (payload.record as SystemProductTemplateRow) : item)));
      setMessage(`분류 상태를 변경했습니다: ${name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 분류 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }


  function startEditCategory(category: { id: string; name: string; sortOrder?: number }) {
    setEditingCategory({
      id: category.id,
      name: category.name,
      sortOrder: String(category.sortOrder ?? 0),
    });
  }

  async function saveCategory() {
    if (!editingCategory) return;
    setIsSaving(true);
    setMessage("생산품 유형 템플릿 분류명을 수정하는 중입니다.");
    try {
      const response = await fetch("/api/system/standards/product-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_category",
          id: editingCategory.id,
          name: editingCategory.name,
          sortOrder: toSortOrder(editingCategory.sortOrder),
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; record?: SystemProductTemplateRow; message?: string };
      if (!response.ok || !payload.ok || !payload.record) {
        throw new Error(payload.message || "생산품 유형 템플릿 분류명을 수정하지 못했습니다.");
      }
      setRecords((current) => current.map((item) => (item.id === payload.record?.id ? (payload.record as SystemProductTemplateRow) : item)));
      setEditingCategory(null);
      setMessage(`분류명을 수정했습니다: ${editingCategory.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "생산품 유형 템플릿 분류명 수정 중 오류가 발생했습니다.");
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">SYSTEM STANDARD TEMPLATE</p>
              <h1 className="text-2xl font-semibold text-stone-950">생산품 유형 기본 템플릿</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600">
                신규 고객사 생성 시 복사할 생산품 유형 기본 템플릿 원장을 관리합니다. 고객사별 생산품 유형은 복사 후 고객관리자가 직접 조정합니다.
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
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">시스템 생산품 유형 템플릿 원장</h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  총 {records.length}개 중 활성 {activeCount}개입니다. 1차 → 2차 → 3차 분류는 각 항목의 수정 버튼으로 이름과 정렬값을 바꿀 수 있습니다.
                </p>
              </div>
              <AdminButton type="button" variant="secondary" onClick={loadRecords} disabled={isLoading || isSaving}>
                {isLoading ? "조회중" : "새로고침"}
              </AdminButton>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <div className="grid gap-2 md:grid-cols-[0.8fr_0.85fr_1fr_120px_120px]">
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="템플릿명" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="코드 예: apparel-basic" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="설명" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <input value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} placeholder="정렬" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <AdminButton type="button" variant="primary" onClick={createTemplate} disabled={isSaving || !form.code.trim() || !form.name.trim()} className="rounded-xl">
                  템플릿 추가
                </AdminButton>
              </div>
            </div>

            <p className="mt-3 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">{message}</p>

            <div className="mt-4 grid gap-4">
              {records.length === 0 && !isLoading ? (
                <AdminEmptyState
                  title="생산품 유형 템플릿이 없습니다"
                  description="템플릿을 추가하면 고객사 생성 시 복사할 생산품 유형 기준정보를 구성할 수 있습니다."
                />
              ) : null}
              {records.map((template) => {
                const isEditing = editingId === template.id && editingForm;
                return (
                  <div key={template.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                    {isEditing ? (
                      <div className="grid gap-2 md:grid-cols-[0.8fr_0.8fr_1fr_90px_120px]">
                        <input value={editingForm.name} onChange={(event) => setEditingForm((current) => current ? { ...current, name: event.target.value } : current)} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm" />
                        <input value={editingForm.code} onChange={(event) => setEditingForm((current) => current ? { ...current, code: event.target.value } : current)} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm" />
                        <input value={editingForm.description} onChange={(event) => setEditingForm((current) => current ? { ...current, description: event.target.value } : current)} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm" />
                        <input value={editingForm.sortOrder} onChange={(event) => setEditingForm((current) => current ? { ...current, sortOrder: event.target.value } : current)} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-right text-sm" />
                        <div className="flex justify-end gap-1">
                          <AdminButton type="button" variant="primary" size="sm" onClick={() => saveTemplate(template)} disabled={isSaving} className="min-h-7 px-3 py-1 text-xs">저장</AdminButton>
                          <AdminButton type="button" variant="secondary" size="sm" onClick={() => { setEditingId(null); setEditingForm(null); }} className="min-h-7 px-3 py-1 text-xs">취소</AdminButton>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 flex flex-wrap items-center justify-end gap-1">
                        <AdminButton type="button" variant={template.status === "active" ? "secondary" : "ghost"} size="sm" onClick={() => toggleTemplate(template)} disabled={isSaving} className="min-h-7 px-2.5 py-1 text-[11px]">
                          {SYSTEM_PRODUCT_TEMPLATE_STATUS_LABELS[template.status]}
                        </AdminButton>
                        <AdminButton type="button" variant="secondary" size="sm" onClick={() => { setEditingId(template.id); setEditingForm(toEditableState(template)); }} className="min-h-7 px-2.5 py-1 text-[11px]">
                          수정
                        </AdminButton>
                      </div>
                    )}
                    <TemplateTreePreview
                      template={template}
                      onToggleCategory={toggleCategory}
                      onSaveCategory={saveCategory}
                      editingCategory={editingCategory}
                      onStartEditCategory={startEditCategory}
                      onChangeEditCategory={setEditingCategory}
                      onCancelEditCategory={() => setEditingCategory(null)}
                      isSaving={isSaving}
                    />
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="flex flex-col gap-4">
            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">분류 추가</h2>
              <div className="mt-4 grid gap-2">
                <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
                  {records.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
                <select value={categoryForm.level} onChange={(event) => setCategoryForm({ ...EMPTY_CATEGORY_FORM, level: event.target.value as CategoryFormState["level"] })} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
                  <option value="1">1차 분류</option>
                  <option value="2">2차 분류</option>
                  <option value="3">3차 분류</option>
                </select>
                {categoryForm.level !== "1" ? (
                  <select value={categoryForm.parentId} onChange={(event) => setCategoryForm((current) => ({ ...current, parentId: event.target.value }))} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400">
                    <option value="">상위 분류 선택</option>
                    {categoryOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                ) : null}
                <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="분류명" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <input value={categoryForm.sortOrder} onChange={(event) => setCategoryForm((current) => ({ ...current, sortOrder: event.target.value }))} placeholder="정렬" className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-400" />
                <AdminButton type="button" variant="primary" onClick={createCategory} disabled={isSaving || !selectedTemplate || !categoryForm.name.trim() || (categoryForm.level !== "1" && !categoryForm.parentId)} className="rounded-xl">
                  분류 추가
                </AdminButton>
              </div>
            </article>

            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-950">1차 연결 범위</h2>
              <ul className="mt-4 grid gap-3">
                {SYSTEM_PRODUCT_TEMPLATE_POLICY.map((note) => (
                  <li key={note} className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-stone-600">{note}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800 shadow-sm">
              <h2 className="font-semibold text-amber-900">후속 구현 메모</h2>
              <p className="mt-2">
                템플릿 원장 CRUD를 먼저 연결했습니다. 신규 고객사 생성 시 템플릿을 고객사 기준정보로 복사하는 흐름은 후속 단계에서 연결합니다.
              </p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  );
}
