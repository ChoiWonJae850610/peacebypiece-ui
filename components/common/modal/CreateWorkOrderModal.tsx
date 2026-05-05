"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_INPUT_CLASS, MODAL_SELECT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { MODAL_ACTION_LABELS, createModalActionHandler, getModalActionDisabledState, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import { WORKORDER_CATEGORY_RECOMMENDATION_ENABLED } from "@/lib/constants/runtimeMode";
import { fetchAdminStandardsFromApi } from "@/lib/admin/settings/standardsApiClient";
import type { AdminItemCategoryDefinition } from "@/lib/admin/settings/standardsTypes";
import { useI18n } from "@/lib/i18n";
import { getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";

type CreateWorkOrderPayload = {
  title: string;
  category1: string;
  category2: string;
  category3: string;
  category1Id?: string | null;
  category2Id?: string | null;
  category3Id?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateWorkOrderPayload) => void;
  isCreating?: boolean;
};

type CategoryOption = {
  id: string | null;
  name: string;
};

type CategorySource = {
  category1Options: CategoryOption[];
  category2OptionsMap: Record<string, CategoryOption[]>;
  category3OptionsMap: Record<string, CategoryOption[]>;
  defaultCategory1: CategoryOption;
  defaultCategory2: CategoryOption;
  defaultCategory3: CategoryOption;
};

function createFallbackOption(name: string): CategoryOption {
  return { id: null, name };
}

function buildDefaultCategorySource(): CategorySource {
  const category1Options = CATEGORY1_OPTIONS.map(createFallbackOption);
  const category2OptionsMap = Object.fromEntries(
    Object.entries(CATEGORY2_OPTIONS_MAP).map(([category1Name, items]) => [category1Name, items.map(createFallbackOption)]),
  );
  const category3OptionsMap = Object.fromEntries(
    Object.entries(CATEGORY3_OPTIONS_MAP).map(([category2Name, items]) => [category2Name, items.map(createFallbackOption)]),
  );

  return {
    category1Options,
    category2OptionsMap,
    category3OptionsMap,
    defaultCategory1: createFallbackOption(DEFAULT_CATEGORY1),
    defaultCategory2: createFallbackOption(DEFAULT_CATEGORY2),
    defaultCategory3: createFallbackOption(DEFAULT_CATEGORY3),
  };
}

function sortCategoryItems(items: AdminItemCategoryDefinition[]) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));
}

function buildCategorySourceFromDefinitions(items: AdminItemCategoryDefinition[]): CategorySource {
  const activeItems = items.filter((item) => item.is_active);
  const level1 = sortCategoryItems(activeItems.filter((item) => item.level === 1));
  const level2 = sortCategoryItems(activeItems.filter((item) => item.level === 2));
  const level3 = sortCategoryItems(activeItems.filter((item) => item.level === 3));

  if (level1.length === 0) return buildDefaultCategorySource();

  const category2OptionsMap: Record<string, CategoryOption[]> = {};
  const category3OptionsMap: Record<string, CategoryOption[]> = {};

  level1.forEach((category1) => {
    category2OptionsMap[category1.name] = level2
      .filter((category2) => category2.parent_id === category1.id)
      .map((category2) => ({ id: category2.id, name: category2.name }));
  });

  level2.forEach((category2) => {
    category3OptionsMap[category2.name] = level3
      .filter((category3) => category3.parent_id === category2.id)
      .map((category3) => ({ id: category3.id, name: category3.name }));
  });

  const defaultCategory1 = { id: level1[0]?.id ?? null, name: level1[0]?.name ?? DEFAULT_CATEGORY1 };
  const defaultCategory2 = category2OptionsMap[defaultCategory1.name]?.[0] ?? createFallbackOption(DEFAULT_CATEGORY2);
  const defaultCategory3 = category3OptionsMap[defaultCategory2.name]?.[0] ?? createFallbackOption(DEFAULT_CATEGORY3);

  return {
    category1Options: level1.map((item) => ({ id: item.id, name: item.name })),
    category2OptionsMap,
    category3OptionsMap,
    defaultCategory1,
    defaultCategory2,
    defaultCategory3,
  };
}

function findCategoryOption(options: CategoryOption[], name: string, fallback: CategoryOption): CategoryOption {
  return options.find((option) => option.name === name) ?? fallback;
}

export default function CreateWorkOrderModal({ open, onClose, onCreate, isCreating = false }: Props) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.modals.createWorkOrder;
  const [title, setTitle] = useState("");
  const [categorySource, setCategorySource] = useState<CategorySource>(() => buildDefaultCategorySource());
  const [category1, setCategory1] = useState<string>(DEFAULT_CATEGORY1);
  const category2Options = useMemo(() => categorySource.category2OptionsMap[category1] ?? [createFallbackOption(i18n.common.ui.common.uncategorized)], [categorySource.category2OptionsMap, category1, i18n.common.ui.common.uncategorized]);
  const [category2, setCategory2] = useState<string>(category2Options[0]?.name ?? DEFAULT_CATEGORY2);
  const category3Options = useMemo(() => categorySource.category3OptionsMap[category2] ?? [createFallbackOption(i18n.common.ui.common.uncategorized)], [categorySource.category3OptionsMap, category2, i18n.common.ui.common.uncategorized]);
  const [category3, setCategory3] = useState<string>(category3Options[0]?.name ?? DEFAULT_CATEGORY3);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    const nextCategory1 = categorySource.defaultCategory1;
    const nextCategory2 = categorySource.category2OptionsMap[nextCategory1.name]?.[0] ?? categorySource.defaultCategory2;
    const nextCategory3 = categorySource.category3OptionsMap[nextCategory2.name]?.[0] ?? categorySource.defaultCategory3;
    setCategory1(nextCategory1.name);
    setCategory2(nextCategory2.name);
    setCategory3(nextCategory3.name);
  }, [open, categorySource]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        setCategorySource(buildCategorySourceFromDefinitions(payload.itemCategories));
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    const nextCategory2 = categorySource.category2OptionsMap[category1]?.[0] ?? categorySource.defaultCategory2;
    setCategory2(nextCategory2.name);
  }, [categorySource, category1]);

  useEffect(() => {
    const nextCategory3 = categorySource.category3OptionsMap[category2]?.[0] ?? categorySource.defaultCategory3;
    setCategory3(nextCategory3.name);
  }, [categorySource, category2]);

  const trimmedTitle = title.trim();
  const submitDisabled = getModalActionDisabledState(trimmedTitle.length === 0 || isCreating);
  const recommendedCategory = useMemo(() => (
    WORKORDER_CATEGORY_RECOMMENDATION_ENABLED ? getRecommendedWorkOrderCategory(trimmedTitle) : null
  ), [trimmedTitle]);

  const selectedCategory1 = findCategoryOption(categorySource.category1Options, category1, categorySource.defaultCategory1);
  const selectedCategory2 = findCategoryOption(category2Options, category2, categorySource.defaultCategory2);
  const selectedCategory3 = findCategoryOption(category3Options, category3, categorySource.defaultCategory3);

  const handleCreate = createModalActionHandler({
    shouldProceed: !submitDisabled,
    action: () => onCreate({
      title: trimmedTitle,
      category1: selectedCategory1.name,
      category2: selectedCategory2.name,
      category3: selectedCategory3.name,
      category1Id: selectedCategory1.id,
      category2Id: selectedCategory2.id,
      category3Id: selectedCategory3.id,
    }),
  });

  const handleApplyRecommendation = () => {
    if (!recommendedCategory) return;
    setCategory1(recommendedCategory.category1);
    setCategory2(recommendedCategory.category2);
    setCategory3(recommendedCategory.category3);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-xl"
      footer={renderModalFooterActions({
        layout: "end",
        secondary: { label: i18n.common.ui.common.cancel ?? MODAL_ACTION_LABELS.cancel, onClick: onClose, disabled: isCreating },
        primary: { label: isCreating ? copy.creating : i18n.common.ui.common.create ?? MODAL_ACTION_LABELS.create, onClick: handleCreate, disabled: submitDisabled, tone: "primary", className: "font-semibold" },
      })}
    >
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-stone-700">{copy.workOrderTitle}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.titlePlaceholder} className={MODAL_INPUT_CLASS} disabled={isCreating} />
        </label>
        {isCreating ? (
          <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" aria-hidden="true" />
            {copy.creatingDescription}
          </div>
        ) : null}
        {recommendedCategory ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-900">{copy.recommendedCategory}</div>
                <div className="mt-1 text-sm text-emerald-800">
                  {recommendedCategory.category1} / {recommendedCategory.category2} / {recommendedCategory.category3}
                </div>
                <div className="mt-1 text-xs leading-5 text-emerald-700">{recommendedCategory.reason}</div>
              </div>
              <button
                type="button"
                onClick={handleApplyRecommendation}
                disabled={isCreating}
                className="pbp-interactive-button shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100"
              >
                {copy.applyRecommendedCategory}
              </button>
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.category1}</span>
            <select value={category1} onChange={(e) => setCategory1(e.target.value)} className={MODAL_SELECT_CLASS} disabled={isCreating}>
              {categorySource.category1Options.map((option) => <option key={option.id ?? option.name} value={option.name}>{option.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.category2}</span>
            <select value={category2} onChange={(e) => setCategory2(e.target.value)} className={MODAL_SELECT_CLASS} disabled={isCreating}>
              {category2Options.map((option) => <option key={option.id ?? option.name} value={option.name}>{option.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.category3}</span>
            <select value={category3} onChange={(e) => setCategory3(e.target.value)} className={MODAL_SELECT_CLASS} disabled={isCreating}>
              {category3Options.map((option) => <option key={option.id ?? option.name} value={option.name}>{option.name}</option>)}
            </select>
          </label>
        </div>
      </div>
    </ModalShell>
  );
}
