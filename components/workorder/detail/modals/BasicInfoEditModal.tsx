import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import ModalShell from "@/components/common/modal/ModalShell";
import CreateWorkOrderCategoryFields from "@/components/common/modal/createWorkOrder/CreateWorkOrderCategoryFields";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
import { WaflInfoBox } from "@/components/common/ui";
import { fetchAdminStandardsFromApi } from "@/lib/admin/settings/standardsApiClient";
import {
  buildCategorySourceFromDefinitions,
  findCategoryOption,
  type CategoryOption,
  type CategorySource,
} from "@/components/common/modal/createWorkOrder/createWorkOrderCategorySource";
import { formatBasicSummary } from "@/lib/workorder/detail/detailFormatting";
import type { BasicInfoState } from "@/components/workorder/detail/shared/detailEditorShared";

function buildCategorySourceFromValue(value: BasicInfoState): CategorySource {
  const category1: CategoryOption = { id: value.category1Id ?? null, name: value.category1 || "-" };
  const category2: CategoryOption = { id: value.category2Id ?? null, name: value.category2 || "-" };
  const category3: CategoryOption = { id: value.category3Id ?? null, name: value.category3 || "-" };

  return {
    category1Options: [category1],
    category2OptionsMap: { [category1.name]: [category2] },
    category3OptionsMap: { [category2.name]: [category3] },
    defaultCategory1: category1,
    defaultCategory2: category2,
    defaultCategory3: category3,
  };
}

function getCategory2Options(source: CategorySource, category1: string) {
  return source.category2OptionsMap[category1] ?? [source.defaultCategory2];
}

function getCategory3Options(source: CategorySource, category2: string) {
  return source.category3OptionsMap[category2] ?? [source.defaultCategory3];
}

function normalizeDraftWithSource(source: CategorySource, value: BasicInfoState): BasicInfoState {
  const nextCategory1 = findCategoryOption(source.category1Options, value.category1, source.defaultCategory1);
  const nextCategory2Options = getCategory2Options(source, nextCategory1.name);
  const nextCategory2 = findCategoryOption(nextCategory2Options, value.category2, source.defaultCategory2);
  const nextCategory3Options = getCategory3Options(source, nextCategory2.name);
  const nextCategory3 = findCategoryOption(nextCategory3Options, value.category3, source.defaultCategory3);
  return {
    ...value,
    category1: nextCategory1.name,
    category2: nextCategory2.name,
    category3: nextCategory3.name,
    category1Id: nextCategory1.id,
    category2Id: nextCategory2.id,
    category3Id: nextCategory3.id,
  };
}

export default function BasicInfoEditModal({
  open,
  value,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  value: BasicInfoState;
  onChange: (next: BasicInfoState) => void;
  onClose: () => void;
  onSave: (next?: BasicInfoState) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.modals.basicInfo;
  const [categorySource, setCategorySource] = useState<CategorySource>(() => buildCategorySourceFromValue(value));
  const [draft, setDraft] = useState<BasicInfoState>(value);

  useEffect(() => {
    if (!open) return;
    const fallbackSource = buildCategorySourceFromValue(value);
    setCategorySource(fallbackSource);
    setDraft(value);
    let isMounted = true;
    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        const nextSource = buildCategorySourceFromDefinitions(payload.itemCategories);
        const nextDraft = normalizeDraftWithSource(nextSource, value);
        setCategorySource(nextSource);
        setDraft(nextDraft);
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [open, value]);

  const category2Options = useMemo(() => getCategory2Options(categorySource, draft.category1), [categorySource, draft.category1]);
  const category3Options = useMemo(() => getCategory3Options(categorySource, draft.category2), [categorySource, draft.category2]);

  const handleCategory1Change = (nextValue: string) => {
    const nextCategory1 = findCategoryOption(categorySource.category1Options, nextValue, categorySource.defaultCategory1);
    const nextCategory2Options = getCategory2Options(categorySource, nextCategory1.name);
    const nextCategory2 = nextCategory2Options[0] ?? categorySource.defaultCategory2;
    const nextCategory3Options = getCategory3Options(categorySource, nextCategory2.name);
    const nextCategory3 = nextCategory3Options[0] ?? categorySource.defaultCategory3;
    setDraft((current) => ({
      ...current,
      category1: nextCategory1.name,
      category2: nextCategory2.name,
      category3: nextCategory3.name,
      category1Id: nextCategory1.id,
      category2Id: nextCategory2.id,
      category3Id: nextCategory3.id,
    }));
  };

  const handleCategory2Change = (nextValue: string) => {
    const nextCategory2 = findCategoryOption(category2Options, nextValue, categorySource.defaultCategory2);
    const nextCategory3Options = getCategory3Options(categorySource, nextCategory2.name);
    const nextCategory3 = nextCategory3Options[0] ?? categorySource.defaultCategory3;
    setDraft((current) => ({
      ...current,
      category2: nextCategory2.name,
      category3: nextCategory3.name,
      category2Id: nextCategory2.id,
      category3Id: nextCategory3.id,
    }));
  };

  const handleCategory3Change = (nextValue: string) => {
    const nextCategory3 = findCategoryOption(category3Options, nextValue, categorySource.defaultCategory3);
    setDraft((current) => ({
      ...current,
      category3: nextCategory3.name,
      category3Id: nextCategory3.id,
    }));
  };

  const applyDisabled = !draft.category1 || !draft.category2 || !draft.category3;

  const handleApply = () => {
    if (applyDisabled) return;
    blurActiveModalElement();
    onChange(draft);
    onSave(draft);
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
        primary: { label: i18n.common.ui.common.apply, onClick: handleApply, disabled: applyDisabled, tone: "primary" },
      })}
    >
      <CreateWorkOrderCategoryFields
        labels={{ category1: copy.category1, category2: copy.category2, category3: copy.category3 }}
        values={{ category1: draft.category1, category2: draft.category2, category3: draft.category3 }}
        options={{ category1Options: categorySource.category1Options, category2Options, category3Options }}
        onChange={{ category1: handleCategory1Change, category2: handleCategory2Change, category3: handleCategory3Change }}
      />

      <WaflInfoBox component="preview-card" tone="muted" shape="control" state="current" className="pbp-detail-summary-readonly mt-4 px-4 py-3">
        <div className="text-xs text-[var(--pbp-text-muted)]">{copy.previewLabel}</div>
        <div className="mt-2 text-sm font-medium text-[var(--pbp-text-primary)]">{formatBasicSummary(draft)}</div>
      </WaflInfoBox>
    </ModalShell>
  );
}
