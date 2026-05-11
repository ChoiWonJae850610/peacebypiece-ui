"use client";

import { useEffect, useMemo, useState } from "react";
import AdminUsageToggle from "@/components/admin/common/AdminUsageToggle";
import {
  AdminModalFooterActions,
  AdminModalSection,
  adminModalInputClassName,
} from "@/components/admin/layout/AdminModal";
import StandardManagementModalFrame, {
  standardModalAddButtonClassName,
  standardModalListBoxClassName,
  standardModalListScrollClassName,
  standardModalMutedRowClassName,
  standardModalSelectedRowClassName,
} from "@/components/admin/standards/StandardManagementModalFrame";
import type { AdminItemCategoryDefinition, AdminItemCategoryLevel } from "@/lib/admin/settings/standardsTypes";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type CategoryDraft = {
  level1: AdminItemCategoryDefinition[];
  level2: AdminItemCategoryDefinition[];
  level3: AdminItemCategoryDefinition[];
};

type Props = {
  open: boolean;
  categories: AdminItemCategoryDefinition[];
  defaultCategories?: AdminItemCategoryDefinition[];
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
  countSuffix,
  activeLabel,
  inactiveLabel,
  disabled = false,
}: {
  title: string;
  items: AdminItemCategoryDefinition[];
  selectedId: string | null;
  emptyLabel: string;
  onSelect: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  countSuffix: string;
  activeLabel: string;
  inactiveLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-h-0 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-900">{title}</p>
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">{items.length}{countSuffix}</span>
      </div>
      <div className={`h-[250px] ${standardModalListBoxClassName}`}>
        <div className={standardModalListScrollClassName}>
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center px-3 text-center text-sm text-stone-400">{emptyLabel}</div>
          ) : (
            items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition",
                    isSelected ? standardModalSelectedRowClassName : standardModalMutedRowClassName,
                  ].join(" ")}
                >
                  <button type="button" onClick={() => onSelect(item.id)} disabled={disabled} className="min-w-0 flex-1 truncate text-left font-medium disabled:cursor-not-allowed disabled:opacity-60">
                    {item.name}
                  </button>
                  <AdminUsageToggle
                    label={`${item.name} ${title}`}
                    checked={item.is_active}
                    activeLabel={activeLabel}
                    inactiveLabel={inactiveLabel}
                    variant="inline"
                    disabled={disabled}
                    onChange={(nextValue) => onToggleActive(item.id, nextValue)}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminItemCategoryManagementModal({ open, categories, defaultCategories = [], saving = false, error = "", onClose, onSave }: Props) {
  const t = useAdminTranslation();
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
      setFormError(t("standards.itemCategories.nameRequired", "추가할 품목명을 입력하세요."));
      return;
    }
    if (level > 1 && !parentId) {
      setFormError(level === 2 ? t("standards.itemCategories.selectLevel1", "1차 품목을 먼저 선택하세요.") : t("standards.itemCategories.selectLevel2", "2차 품목을 먼저 선택하세요."));
      return;
    }

    const key = `level${level}` as keyof CategoryDraft;
    if (draft[key].some((item) => item.parent_id === parentId && item.name === label)) {
      setFormError(t("standards.itemCategories.duplicate", "이미 등록된 품목명입니다."));
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
    if (defaultCategories.length === 0) {
      setFormError("시스템관리자 기본 템플릿이 없습니다. 시스템관리자 기준정보에서 기본 템플릿을 먼저 등록하세요.");
      return;
    }
    const nextDraft = createCategoryDraft(defaultCategories);
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
    <StandardManagementModalFrame
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={t("standards.itemCategories.title", "생산품 유형")}
      description="1차 품목 안에 2차 품목을, 2차 품목 안에 3차 세부 유형을 연결해 관리합니다."
      categoryLabel="계층형 기준정보"
      maxWidthClass="md:max-w-5xl"
      footer={
        <AdminModalFooterActions
          secondaryLabel={t("standards.common.resetDefaults", "기본값 복원")}
          primaryLabel={saving ? t("standards.common.saving", "저장 중") : t("standards.common.save", "저장")}
          onSecondary={resetDraft}
          onPrimary={() => onSave(flattenDraft(draft))}
          secondaryDisabled={saving}
          primaryDisabled={saving}
          statusMessage={formError || error}
          statusTone={formError || error ? "danger" : "neutral"}
        />
      }
    >
      <AdminModalSection title={t("standards.itemCategories.addTitle", "품목 추가")}>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex min-w-0 gap-2">
            <input disabled={saving} value={newLevel1Label} onChange={(event) => { setNewLevel1Label(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.itemCategories.level1Placeholder", "1차 품목 추가")} className={`h-11 min-w-0 flex-1 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(1)} disabled={saving} className={standardModalAddButtonClassName}>{t("standards.common.add", "추가")}</button>
          </div>
          <div className="flex min-w-0 gap-2">
            <input disabled={saving} value={newLevel2Label} onChange={(event) => { setNewLevel2Label(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.itemCategories.level2Placeholder", "선택한 1차 안에 2차 추가")} className={`h-11 min-w-0 flex-1 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(2)} disabled={saving} className={standardModalAddButtonClassName}>{t("standards.common.add", "추가")}</button>
          </div>
          <div className="flex min-w-0 gap-2">
            <input disabled={saving} value={newLevel3Label} onChange={(event) => { setNewLevel3Label(event.target.value); if (formError) setFormError(""); }} placeholder={t("standards.itemCategories.level3Placeholder", "선택한 2차 안에 3차 추가")} className={`h-11 min-w-0 flex-1 ${adminModalInputClassName}`} />
            <button type="button" onClick={() => addCategory(3)} disabled={saving} className={standardModalAddButtonClassName}>{t("standards.common.add", "추가")}</button>
          </div>
        </div>
      </AdminModalSection>

      <AdminModalSection title={t("standards.itemCategories.usageTitle", "품목 사용 여부")}>
        <div className="grid gap-4 md:grid-cols-3">
          <CategoryList title={t("standards.itemCategories.level1Title", "1차 품목")} items={draft.level1} selectedId={selectedLevel1Id} emptyLabel={t("standards.itemCategories.level1Empty", "1차 품목이 없습니다.")} countSuffix={t("standards.itemCategories.countSuffix", "개")} activeLabel={t("standards.itemCategories.active", "사용")} inactiveLabel={t("standards.itemCategories.inactive", "미사용")} onSelect={(id) => { setSelectedLevel1Id(id); setSelectedLevel2Id(draft.level2.find((item) => item.parent_id === id)?.id ?? null); }} onToggleActive={(id, isActive) => updateNodeActive(1, id, isActive)} disabled={saving} />
          <CategoryList title={t("standards.itemCategories.level2Title", "2차 품목")} items={level2Items} selectedId={selectedLevel2Id} emptyLabel={t("standards.itemCategories.level2Empty", "선택한 1차 품목의 2차 품목이 없습니다.")} countSuffix={t("standards.itemCategories.countSuffix", "개")} activeLabel={t("standards.itemCategories.active", "사용")} inactiveLabel={t("standards.itemCategories.inactive", "미사용")} onSelect={setSelectedLevel2Id} onToggleActive={(id, isActive) => updateNodeActive(2, id, isActive)} disabled={saving} />
          <CategoryList title={t("standards.itemCategories.level3Title", "3차 품목")} items={level3Items} selectedId={null} emptyLabel={t("standards.itemCategories.level3Empty", "선택한 2차 품목의 3차 품목이 없습니다.")} countSuffix={t("standards.itemCategories.countSuffix", "개")} activeLabel={t("standards.itemCategories.active", "사용")} inactiveLabel={t("standards.itemCategories.inactive", "미사용")} onSelect={() => undefined} onToggleActive={(id, isActive) => updateNodeActive(3, id, isActive)} disabled={saving} />
        </div>
      </AdminModalSection>
    </StandardManagementModalFrame>
  );
}
