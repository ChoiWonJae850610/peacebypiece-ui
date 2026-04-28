"use client";

import { useMemo, useState } from "react";
import {
  AdminModal,
  AdminModalSection,
  adminModalInputClassName,
  adminModalPrimaryButtonClassName,
  adminModalSecondaryButtonClassName,
} from "@/components/admin/layout/AdminModal";
import { CATEGORY_TREE } from "@/lib/constants/workorderCategories";

type CategoryLevel = 1 | 2 | 3;

type CategoryNode = {
  id: string;
  label: string;
  isActive: boolean;
  parentId?: string;
};

type CategoryDraft = {
  level1: CategoryNode[];
  level2: CategoryNode[];
  level3: CategoryNode[];
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function createInitialCategoryDraft(): CategoryDraft {
  const level1: CategoryNode[] = [];
  const level2: CategoryNode[] = [];
  const level3: CategoryNode[] = [];

  Object.entries(CATEGORY_TREE).forEach(([category1, category2Map]) => {
    const level1Id = `level1:${category1}`;
    level1.push({ id: level1Id, label: category1, isActive: true });

    Object.entries(category2Map).forEach(([category2, category3Items]) => {
      const level2Id = `level2:${category1}:${category2}`;
      level2.push({ id: level2Id, label: category2, isActive: true, parentId: level1Id });

      category3Items.forEach((category3) => {
        level3.push({
          id: `level3:${category1}:${category2}:${category3}`,
          label: category3,
          isActive: true,
          parentId: level2Id,
        });
      });
    });
  });

  return { level1, level2, level3 };
}

function normalizeCategoryLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function createCategoryId(level: CategoryLevel, parentId: string | undefined, label: string) {
  return parentId ? `level${level}:${parentId}:${label}` : `level${level}:${label}`;
}

function getInitialSelection(draft: CategoryDraft) {
  const level1Id = draft.level1[0]?.id ?? null;
  const level2Id = draft.level2.find((item) => item.parentId === level1Id)?.id ?? null;
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
  items: CategoryNode[];
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
                  <span className="min-w-0 truncate font-medium">{item.label}</span>
                  <span
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleActive(item.id, !item.isActive);
                    }}
                    className={[
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                      item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500",
                    ].join(" ")}
                    role="switch"
                    aria-checked={item.isActive}
                  >
                    {item.isActive ? "사용" : "미사용"}
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

export default function AdminItemCategoryManagementModal({ open, onClose }: Props) {
  const [draft, setDraft] = useState<CategoryDraft>(() => createInitialCategoryDraft());
  const initialSelection = useMemo(() => getInitialSelection(createInitialCategoryDraft()), []);
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<string | null>(initialSelection.level1Id);
  const [selectedLevel2Id, setSelectedLevel2Id] = useState<string | null>(initialSelection.level2Id);
  const [newLevel1Label, setNewLevel1Label] = useState("");
  const [newLevel2Label, setNewLevel2Label] = useState("");
  const [newLevel3Label, setNewLevel3Label] = useState("");
  const [formError, setFormError] = useState("");

  const level2Items = useMemo(() => draft.level2.filter((item) => item.parentId === selectedLevel1Id), [draft.level2, selectedLevel1Id]);
  const level3Items = useMemo(() => draft.level3.filter((item) => item.parentId === selectedLevel2Id), [draft.level3, selectedLevel2Id]);

  const updateNodeActive = (level: CategoryLevel, id: string, isActive: boolean) => {
    const key = `level${level}` as keyof CategoryDraft;
    setDraft((current) => ({
      ...current,
      [key]: current[key].map((item) => (item.id === id ? { ...item, isActive } : item)),
    }));
  };

  const addCategory = (level: CategoryLevel) => {
    const label = normalizeCategoryLabel(level === 1 ? newLevel1Label : level === 2 ? newLevel2Label : newLevel3Label);
    const parentId = level === 1 ? undefined : level === 2 ? selectedLevel1Id ?? undefined : selectedLevel2Id ?? undefined;

    if (!label) {
      setFormError("추가할 품목명을 입력하세요.");
      return;
    }
    if (level > 1 && !parentId) {
      setFormError(level === 2 ? "1차 품목을 먼저 선택하세요." : "2차 품목을 먼저 선택하세요.");
      return;
    }

    const key = `level${level}` as keyof CategoryDraft;
    if (draft[key].some((item) => item.parentId === parentId && item.label === label)) {
      setFormError("이미 등록된 품목명입니다.");
      return;
    }

    const nextItem: CategoryNode = { id: createCategoryId(level, parentId, label), label, isActive: true, parentId };
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
    const nextDraft = createInitialCategoryDraft();
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
      title="품목 관리"
      maxWidthClass="md:max-w-5xl"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={resetDraft} className={adminModalSecondaryButtonClassName}>기본값 복원</button>
          <button type="button" onClick={onClose} className={adminModalPrimaryButtonClassName}>저장</button>
        </div>
      }
    >
      <AdminModalSection title="품목 추가">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex gap-2">
            <input value={newLevel1Label} onChange={(event) => { setNewLevel1Label(event.target.value); if (formError) setFormError(""); }} placeholder="1차 품목 추가" className={`h-11 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(1)} className="h-11 rounded-full bg-stone-950 px-4 text-sm font-semibold text-white">추가</button>
          </div>
          <div className="flex gap-2">
            <input value={newLevel2Label} onChange={(event) => { setNewLevel2Label(event.target.value); if (formError) setFormError(""); }} placeholder="선택한 1차 안에 2차 추가" className={`h-11 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(2)} className="h-11 rounded-full bg-stone-950 px-4 text-sm font-semibold text-white">추가</button>
          </div>
          <div className="flex gap-2">
            <input value={newLevel3Label} onChange={(event) => { setNewLevel3Label(event.target.value); if (formError) setFormError(""); }} placeholder="선택한 2차 안에 3차 추가" className={`h-11 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(3)} className="h-11 rounded-full bg-stone-950 px-4 text-sm font-semibold text-white">추가</button>
          </div>
        </div>
        {formError ? <p className="mt-2 text-sm font-semibold text-rose-600">{formError}</p> : null}
      </AdminModalSection>

      <AdminModalSection title="품목 사용 여부">
        <div className="grid gap-4 md:grid-cols-3">
          <CategoryList title="1차 품목" items={draft.level1} selectedId={selectedLevel1Id} emptyLabel="1차 품목이 없습니다." onSelect={(id) => { setSelectedLevel1Id(id); setSelectedLevel2Id(draft.level2.find((item) => item.parentId === id)?.id ?? null); }} onToggleActive={(id, isActive) => updateNodeActive(1, id, isActive)} />
          <CategoryList title="2차 품목" items={level2Items} selectedId={selectedLevel2Id} emptyLabel="선택한 1차 품목의 2차 품목이 없습니다." onSelect={setSelectedLevel2Id} onToggleActive={(id, isActive) => updateNodeActive(2, id, isActive)} />
          <CategoryList title="3차 품목" items={level3Items} selectedId={null} emptyLabel="선택한 2차 품목의 3차 품목이 없습니다." onSelect={() => undefined} onToggleActive={(id, isActive) => updateNodeActive(3, id, isActive)} />
        </div>
      </AdminModalSection>
    </AdminModal>
  );
}
