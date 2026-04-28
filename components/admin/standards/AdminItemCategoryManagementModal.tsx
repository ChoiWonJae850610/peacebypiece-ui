"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminModal,
  AdminModalSection,
  adminModalInputClassName,
  adminModalPrimaryButtonClassName,
  adminModalSecondaryButtonClassName,
} from "@/components/admin/layout/AdminModal";
import { createDefaultItemCategoryDefinitions } from "@/lib/admin/standards.defaults";
import type { AdminItemCategoryDefinition, AdminItemCategoryLevel } from "@/lib/admin/standards.types";

type CategoryDraft = {
  level1: AdminItemCategoryDefinition[];
  level2: AdminItemCategoryDefinition[];
  level3: AdminItemCategoryDefinition[];
};

type Props = {
  open: boolean;
  categories: AdminItemCategoryDefinition[];
  saving?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (categories: AdminItemCategoryDefinition[]) => void;
};

function createCategoryDraft(items: AdminItemCategoryDefinition[]): CategoryDraft {
  const sortItems = (a: AdminItemCategoryDefinition, b: AdminItemCategoryDefinition) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR");
  return {
    level1: items.filter((item) => item.level === 1).sort(sortItems),
    level2: items.filter((item) => item.level === 2).sort(sortItems),
    level3: items.filter((item) => item.level === 3).sort(sortItems),
  };
}

function flattenDraft(draft: CategoryDraft): AdminItemCategoryDefinition[] {
  return [...draft.level1, ...draft.level2, ...draft.level3];
}

function normalizeCategoryLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createCategoryId(level: AdminItemCategoryLevel, parentId: string | undefined | null, label: string) {
  return parentId ? `category:${level}:${parentId}:${label}:${Date.now()}` : `category:${level}:${label}:${Date.now()}`;
}

function getInitialSelection(draft: CategoryDraft) {
  const level1Id = draft.level1[0]?.id ?? null;
  const level2Id = draft.level2.find((item) => item.parent_id === level1Id)?.id ?? null;
  return { level1Id, level2Id };
}

function CategoryList({
  title,
  items,
  selectedId,
  emptyLabel,
  onSelect,
  onToggleActive,
}: {
  title: string;
  items: AdminItemCategoryDefinition[];
  selectedId: string | null;
  emptyLabel: string;
  onSelect: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  return (
    <div className="min-h-0 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">{items.length}개</span>
      </div>
      <div className="h-[250px] rounded-3xl border border-stone-200 bg-stone-50/70 p-2">
        <div className="h-full space-y-2 overflow-auto pr-1">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{emptyLabel}</div>
          ) : (
            items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition",
                    isSelected ? "border-stone-950 bg-white text-stone-950 shadow-sm" : "border-stone-200 bg-white text-stone-700 hover:border-stone-300",
                  ].join(" ")}
                >
                  <span className="min-w-0 truncate font-medium">{item.name}</span>
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleActive(item.id, !item.is_active);
                    }}
                    className={[
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500",
                    ].join(" ")}
                    role="switch"
                    aria-checked={item.is_active}
                  >
                    {item.is_active ? "사용" : "미사용"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminItemCategoryManagementModal({ open, categories, saving = false, error = "", onClose, onSave }: Props) {
  const [draft, setDraft] = useState<CategoryDraft>(() => createCategoryDraft(categories));
  const initialSelection = useMemo(() => getInitialSelection(createCategoryDraft(categories)), [categories]);
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<string | null>(initialSelection.level1Id);
  const [selectedLevel2Id, setSelectedLevel2Id] = useState<string | null>(initialSelection.level2Id);
  const [newLevel1Label, setNewLevel1Label] = useState("");
  const [newLevel2Label, setNewLevel2Label] = useState("");
  const [newLevel3Label, setNewLevel3Label] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    const nextDraft = createCategoryDraft(categories);
    const nextSelection = getInitialSelection(nextDraft);
    setDraft(nextDraft);
    setSelectedLevel1Id(nextSelection.level1Id);
    setSelectedLevel2Id(nextSelection.level2Id);
    setNewLevel1Label("");
    setNewLevel2Label("");
    setNewLevel3Label("");
    setFormError("");
  }, [open, categories]);

  const level2Items = useMemo(() => draft.level2.filter((item) => item.parent_id === selectedLevel1Id), [draft.level2, selectedLevel1Id]);
  const level3Items = useMemo(() => draft.level3.filter((item) => item.parent_id === selectedLevel2Id), [draft.level3, selectedLevel2Id]);

  const updateNodeActive = (level: AdminItemCategoryLevel, id: string, isActive: boolean) => {
    const key = `level${level}` as keyof CategoryDraft;
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item) => (item.id === id ? { ...item, is_active: isActive } : item)),
    }));
  };

  const addCategory = (level: AdminItemCategoryLevel) => {
    const label = normalizeCategoryLabel(level === 1 ? newLevel1Label : level === 2 ? newLevel2Label : newLevel3Label);
    const parentId = level === 1 ? null : level === 2 ? selectedLevel1Id : selectedLevel2Id;

    if (!label) {
      setFormError("추가할 품목명을 입력하세요.");
      return;
    }
    if (level > 1 && !parentId) {
      setFormError(level === 2 ? "1차 품목을 먼저 선택하세요." : "2차 품목을 먼저 선택하세요.");
      return;
    }

    const key = `level${level}` as keyof CategoryDraft;
    if (draft[key].some((item) => item.parent_id === parentId && item.name === label)) {
      setFormError("이미 등록된 품목명입니다.");
      return;
    }

    const nextItem: AdminItemCategoryDefinition = {
      id: createCategoryId(level, parentId, label),
      level,
      parent_id: parentId,
      name: label,
      is_active: true,
      sort_order: (draft[key].filter((item) => item.parent_id === parentId).length + 1) * 10,
    };
    setDraft((current) => ({ ...current, [key]: [...current[key], nextItem] }));
    setFormError("");

    if (level === 1) {
      setNewLevel1Label("");
      setSelectedLevel1Id(nextItem.id);
      setSelectedLevel2Id(null);
    }
    if (level === 2) {
      setNewLevel2Label("");
      setSelectedLevel2Id(nextItem.id);
    }
    if (level === 3) setNewLevel3Label("");
  };

  const resetDraft = () => {
    const nextDraft = createCategoryDraft(createDefaultItemCategoryDefinitions());
    const nextSelection = getInitialSelection(nextDraft);
    setDraft(nextDraft);
    setSelectedLevel1Id(nextSelection.level1Id);
    setSelectedLevel2Id(nextSelection.level2Id);
    setNewLevel1Label("");
    setNewLevel2Label("");
    setNewLevel3Label("");
    setFormError("");
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="생산품 유형"
      maxWidthClass="md:max-w-5xl"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={resetDraft} className={adminModalSecondaryButtonClassName}>기본값 복원</button>
          <button type="button" onClick={() => onSave(flattenDraft(draft))} disabled={saving} className={adminModalPrimaryButtonClassName}>{saving ? "저장 중" : "저장"}</button>
        </div>
      }
    >
      <AdminModalSection title="품목 추가">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex min-w-0 gap-2">
            <input value={newLevel1Label} onChange={(event) => { setNewLevel1Label(event.target.value); if (formError) setFormError(""); }} placeholder="1차 품목 추가" className={`h-11 min-w-0 flex-1 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(1)} className="h-11 shrink-0 whitespace-nowrap rounded-full bg-stone-950 px-5 text-sm font-semibold text-white">추가</button>
          </div>
          <div className="flex min-w-0 gap-2">
            <input value={newLevel2Label} onChange={(event) => { setNewLevel2Label(event.target.value); if (formError) setFormError(""); }} placeholder="선택한 1차 안에 2차 추가" className={`h-11 min-w-0 flex-1 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(2)} className="h-11 shrink-0 whitespace-nowrap rounded-full bg-stone-950 px-5 text-sm font-semibold text-white">추가</button>
          </div>
          <div className="flex min-w-0 gap-2">
            <input value={newLevel3Label} onChange={(event) => { setNewLevel3Label(event.target.value); if (formError) setFormError(""); }} placeholder="선택한 2차 안에 3차 추가" className={`h-11 min-w-0 flex-1 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(3)} className="h-11 shrink-0 whitespace-nowrap rounded-full bg-stone-950 px-5 text-sm font-semibold text-white">추가</button>
          </div>
        </div>
        {formError || error ? <p className="mt-2 text-sm font-semibold text-rose-600">{formError || error}</p> : null}
      </AdminModalSection>

      <AdminModalSection title="품목 사용 여부">
        <div className="grid gap-4 md:grid-cols-3">
          <CategoryList title="1차 품목" items={draft.level1} selectedId={selectedLevel1Id} emptyLabel="1차 품목이 없습니다." onSelect={(id) => { setSelectedLevel1Id(id); setSelectedLevel2Id(draft.level2.find((item) => item.parent_id === id)?.id ?? null); }} onToggleActive={(id, isActive) => updateNodeActive(1, id, isActive)} />
          <CategoryList title="2차 품목" items={level2Items} selectedId={selectedLevel2Id} emptyLabel="선택한 1차 품목의 2차 품목이 없습니다." onSelect={setSelectedLevel2Id} onToggleActive={(id, isActive) => updateNodeActive(2, id, isActive)} />
          <CategoryList title="3차 품목" items={level3Items} selectedId={null} emptyLabel="선택한 2차 품목의 3차 품목이 없습니다." onSelect={() => undefined} onToggleActive={(id, isActive) => updateNodeActive(3, id, isActive)} />
        </div>
      </AdminModalSection>
    </AdminModal>
  );
}
