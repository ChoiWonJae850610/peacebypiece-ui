"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_INPUT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { MODAL_ACTION_LABELS, createModalActionHandler, getModalActionDisabledState, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import { WORKORDER_CATEGORY_RECOMMENDATION_ENABLED } from "@/lib/runtime/runtimeMode";
import { fetchAdminStandardsFromApi } from "@/lib/admin/settings/standardsApiClient";
import CreateWorkOrderCategoryFields from "@/components/common/modal/createWorkOrder/CreateWorkOrderCategoryFields";
import CreateWorkOrderRecommendationPanel from "@/components/common/modal/createWorkOrder/CreateWorkOrderRecommendationPanel";
import { buildCategorySourceFromDefinitions, buildDefaultCategorySource, createFallbackOption, findCategoryOption, type CategorySource } from "@/components/common/modal/createWorkOrder/createWorkOrderCategorySource";
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
        <CreateWorkOrderRecommendationPanel
          recommendation={recommendedCategory}
          disabled={isCreating}
          title={copy.recommendedCategory}
          applyLabel={copy.applyRecommendedCategory}
          onApply={handleApplyRecommendation}
        />
        <CreateWorkOrderCategoryFields
          disabled={isCreating}
          labels={{ category1: copy.category1, category2: copy.category2, category3: copy.category3 }}
          values={{ category1, category2, category3 }}
          options={{ category1Options: categorySource.category1Options, category2Options, category3Options }}
          onChange={{ category1: setCategory1, category2: setCategory2, category3: setCategory3 }}
        />
      </div>
    </ModalShell>
  );
}
