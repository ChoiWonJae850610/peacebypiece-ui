import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import ModalShell from "@/components/common/modal/ModalShell";
import { AppSelect, type AppSelectOption } from "@/components/common/ui";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
import { fetchAdminStandardsFromApi } from "@/lib/admin/settings/standardsApiClient";
import {
  buildCategorySourceFromDefinitions,
  createFallbackOption,
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

function buildCategorySelectOptions(options: CategoryOption[]): AppSelectOption[] {
  return options.map((option) => ({
    value: option.name,
    label: option.name,
  }));
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
  onSave: () => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.modals.basicInfo;
  const [categorySource, setCategorySource] = useState<CategorySource>(() => buildCategorySourceFromValue(value));

  useEffect(() => {
    if (!open) return;
    setCategorySource(buildCategorySourceFromValue(value));
    let isMounted = true;
    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        const nextSource = buildCategorySourceFromDefinitions(payload.itemCategories);
        setCategorySource(nextSource);
        const nextCategory1 = findCategoryOption(nextSource.category1Options, value.category1, nextSource.defaultCategory1);
        const nextCategory2Options = nextSource.category2OptionsMap[nextCategory1.name] ?? [nextSource.defaultCategory2];
        const nextCategory2 = findCategoryOption(nextCategory2Options, value.category2, nextSource.defaultCategory2);
        const nextCategory3Options = nextSource.category3OptionsMap[nextCategory2.name] ?? [nextSource.defaultCategory3];
        const nextCategory3 = findCategoryOption(nextCategory3Options, value.category3, nextSource.defaultCategory3);
        onChange({
          ...value,
          category1: nextCategory1.name,
          category2: nextCategory2.name,
          category3: nextCategory3.name,
          category1Id: nextCategory1.id,
          category2Id: nextCategory2.id,
          category3Id: nextCategory3.id,
        });
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  // category refresh must run when the modal opens. value/onChange are intentionally not included to avoid resetting drafts on every select change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const category2Options = useMemo(() => categorySource.category2OptionsMap[value.category1] ?? [categorySource.defaultCategory2], [categorySource, value.category1]);
  const category3Options = useMemo(() => categorySource.category3OptionsMap[value.category2] ?? [categorySource.defaultCategory3], [categorySource, value.category2]);

  const handleCategory1Change = (category1: string) => {
    const nextCategory2Options = categorySource.category2OptionsMap[category1] ?? [categorySource.defaultCategory2];
    const nextCategory2 = nextCategory2Options[0] ?? categorySource.defaultCategory2;
    const nextCategory3Options = categorySource.category3OptionsMap[nextCategory2.name] ?? [categorySource.defaultCategory3];
    const nextCategory3 = nextCategory3Options[0] ?? categorySource.defaultCategory3;
    const nextCategory1 = findCategoryOption(categorySource.category1Options, category1, categorySource.defaultCategory1);
    onChange({
      ...value,
      category1: nextCategory1.name,
      category2: nextCategory2.name,
      category3: nextCategory3.name,
      category1Id: nextCategory1.id,
      category2Id: nextCategory2.id,
      category3Id: nextCategory3.id,
    });
  };

  const handleCategory2Change = (category2: string) => {
    const nextCategory3Options = categorySource.category3OptionsMap[category2] ?? [categorySource.defaultCategory3];
    const nextCategory3 = nextCategory3Options[0] ?? categorySource.defaultCategory3;
    const nextCategory2 = findCategoryOption(category2Options, category2, categorySource.defaultCategory2);
    onChange({
      ...value,
      category2: nextCategory2.name,
      category3: nextCategory3.name,
      category2Id: nextCategory2.id,
      category3Id: nextCategory3.id,
    });
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      maxWidthClass="md:max-w-xl"
      footer={renderModalFooterActions({
        layout: "split",
        secondary: { label: i18n.common.ui.common.cancel, onClick: onClose, width: "fill" },
        primary: { label: i18n.common.ui.common.apply, onClick: onSave, tone: "primary", width: "fill" },
      })}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="pbp-workorder-selectable-panel rounded-2xl border p-3">
          <div className="text-xs text-[var(--pbp-text-muted)]">{copy.category1}</div>
          <AppSelect
            value={value.category1}
            onValueChange={handleCategory1Change}
            options={buildCategorySelectOptions(categorySource.category1Options)}
            ariaLabel={copy.category1}
            className="mt-2"
          />
        </div>
        <div className="pbp-workorder-selectable-panel rounded-2xl border p-3">
          <div className="text-xs text-[var(--pbp-text-muted)]">{copy.category2}</div>
          <AppSelect
            value={value.category2}
            onValueChange={handleCategory2Change}
            options={buildCategorySelectOptions(category2Options)}
            ariaLabel={copy.category2}
            className="mt-2"
          />
        </div>
        <div className="pbp-workorder-selectable-panel rounded-2xl border p-3">
          <div className="text-xs text-[var(--pbp-text-muted)]">{copy.category3}</div>
          <AppSelect
            value={value.category3}
            onValueChange={(nextValue) => {
              const nextCategory3 = findCategoryOption(category3Options, nextValue, categorySource.defaultCategory3);
              onChange({
                ...value,
                category3: nextCategory3.name,
                category3Id: nextCategory3.id,
              });
            }}
            options={buildCategorySelectOptions(category3Options)}
            ariaLabel={copy.category3}
            className="mt-2"
          />
        </div>
      </div>

      <div className="pbp-detail-summary-readonly mt-4 rounded-2xl border px-4 py-3">
        <div className="text-xs text-[var(--pbp-text-muted)]">{copy.previewLabel}</div>
        <div className="mt-2 text-sm font-medium text-[var(--pbp-text-primary)]">{formatBasicSummary(value)}</div>
      </div>
    </ModalShell>
  );
}
