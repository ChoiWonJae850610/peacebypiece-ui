"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_INPUT_CLASS, MODAL_SELECT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { MODAL_ACTION_LABELS, createModalActionHandler, getModalActionDisabledState, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { DEFAULT_BASIC_YEAR, SEASON_OPTIONS, YEAR_OPTIONS } from "@/lib/constants/workorderOptions";
import { CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import { fetchAdminStandardsFromApi } from "@/lib/admin/settings/standardsApiClient";
import type { AdminItemCategoryDefinition } from "@/lib/admin/settings/standardsTypes";
import { useI18n } from "@/lib/i18n";
import { getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; category1: string; category2: string; category3: string; season: string }) => void;
};

type CategorySource = {
  category1Options: string[];
  category2OptionsMap: Record<string, readonly string[]>;
  category3OptionsMap: Record<string, readonly string[]>;
  defaultCategory1: string;
  defaultCategory2: string;
  defaultCategory3: string;
};

function buildDefaultCategorySource(): CategorySource {
  return {
    category1Options: CATEGORY1_OPTIONS,
    category2OptionsMap: CATEGORY2_OPTIONS_MAP,
    category3OptionsMap: CATEGORY3_OPTIONS_MAP,
    defaultCategory1: DEFAULT_CATEGORY1,
    defaultCategory2: DEFAULT_CATEGORY2,
    defaultCategory3: DEFAULT_CATEGORY3,
  };
}

function buildCategorySourceFromDefinitions(items: AdminItemCategoryDefinition[]): CategorySource {
  const activeItems = items.filter((item) => item.is_active);
  const level1 = activeItems.filter((item) => item.level === 1).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));
  const level2 = activeItems.filter((item) => item.level === 2).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));
  const level3 = activeItems.filter((item) => item.level === 3).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));

  if (level1.length === 0) return buildDefaultCategorySource();

  const category2OptionsMap: Record<string, string[]> = {};
  const category3OptionsMap: Record<string, string[]> = {};

  level1.forEach((category1) => {
    category2OptionsMap[category1.name] = level2.filter((category2) => category2.parent_id === category1.id).map((category2) => category2.name);
  });
  level2.forEach((category2) => {
    category3OptionsMap[category2.name] = level3.filter((category3) => category3.parent_id === category2.id).map((category3) => category3.name);
  });

  const defaultCategory1 = level1[0]?.name ?? DEFAULT_CATEGORY1;
  const defaultCategory2 = category2OptionsMap[defaultCategory1]?.[0] ?? DEFAULT_CATEGORY2;
  const defaultCategory3 = category3OptionsMap[defaultCategory2]?.[0] ?? DEFAULT_CATEGORY3;

  return {
    category1Options: level1.map((item) => item.name),
    category2OptionsMap,
    category3OptionsMap,
    defaultCategory1,
    defaultCategory2,
    defaultCategory3,
  };
}

export default function CreateWorkOrderModal({ open, onClose, onCreate }: Props) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.modals.createWorkOrder;
  const [title, setTitle] = useState("");
  const [categorySource, setCategorySource] = useState<CategorySource>(() => buildDefaultCategorySource());
  const [category1, setCategory1] = useState<string>(DEFAULT_CATEGORY1);
  const category2Options = useMemo(() => categorySource.category2OptionsMap[category1] ?? [i18n.common.ui.common.uncategorized], [categorySource.category2OptionsMap, category1, i18n.common.ui.common.uncategorized]);
  const [category2, setCategory2] = useState<string>(category2Options[0] ?? DEFAULT_CATEGORY2);
  const category3Options = useMemo(() => categorySource.category3OptionsMap[category2] ?? [i18n.common.ui.common.uncategorized], [categorySource.category3OptionsMap, category2, i18n.common.ui.common.uncategorized]);
  const [category3, setCategory3] = useState<string>(category3Options[0] ?? DEFAULT_CATEGORY3);
  const [seasonType, setSeasonType] = useState<string>(SEASON_OPTIONS[0] ?? "SS");
  const [seasonYear, setSeasonYear] = useState<string>(DEFAULT_BASIC_YEAR);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    const nextCategory1 = categorySource.defaultCategory1;
    const nextCategory2 = categorySource.category2OptionsMap[nextCategory1]?.[0] ?? categorySource.defaultCategory2;
    const nextCategory3 = categorySource.category3OptionsMap[nextCategory2]?.[0] ?? categorySource.defaultCategory3;
    setCategory1(nextCategory1);
    setCategory2(nextCategory2);
    setCategory3(nextCategory3);
    setSeasonType(SEASON_OPTIONS[0] ?? "SS");
    setSeasonYear(DEFAULT_BASIC_YEAR);
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
    setCategory2(nextCategory2);
  }, [categorySource, category1]);

  useEffect(() => {
    const nextCategory3 = categorySource.category3OptionsMap[category2]?.[0] ?? categorySource.defaultCategory3;
    setCategory3(nextCategory3);
  }, [categorySource, category2]);

  const trimmedTitle = title.trim();
  const submitDisabled = getModalActionDisabledState(trimmedTitle.length === 0);
  const recommendedCategory = useMemo(() => getRecommendedWorkOrderCategory(trimmedTitle), [trimmedTitle]);

  const handleCreate = createModalActionHandler({
    shouldProceed: !submitDisabled,
    action: () => onCreate({ title: trimmedTitle, category1, category2, category3, season: `${seasonType} ${seasonYear}`.trim() }),
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
        secondary: { label: i18n.common.ui.common.cancel ?? MODAL_ACTION_LABELS.cancel, onClick: onClose },
        primary: { label: i18n.common.ui.common.create ?? MODAL_ACTION_LABELS.create, onClick: handleCreate, disabled: submitDisabled, tone: "primary", className: "font-semibold" },
      })}
    >
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-stone-700">{copy.workOrderTitle}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={copy.titlePlaceholder} className={MODAL_INPUT_CLASS} />
        </label>
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
            <select value={category1} onChange={(e) => setCategory1(e.target.value)} className={MODAL_SELECT_CLASS}>
              {categorySource.category1Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.category2}</span>
            <select value={category2} onChange={(e) => setCategory2(e.target.value)} className={MODAL_SELECT_CLASS}>
              {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.category3}</span>
            <select value={category3} onChange={(e) => setCategory3(e.target.value)} className={MODAL_SELECT_CLASS}>
              {category3Options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.season}</span>
            <select value={seasonType} onChange={(e) => setSeasonType(e.target.value)} className={MODAL_SELECT_CLASS}>
              {SEASON_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-stone-700">{copy.year}</span>
            <select value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className={MODAL_SELECT_CLASS}>
              {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </div>
    </ModalShell>
  );
}
