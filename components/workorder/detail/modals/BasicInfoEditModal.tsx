import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import ModalShell from "@/components/common/modal/ModalShell";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import { renderModalFooterActions } from "@/components/common/modal/modalActions";
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

function CategoryOptionButton({
  label,
  selected,
  expanded,
  onClick,
}: {
  label: string;
  selected: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        blurActiveModalElement();
        event.stopPropagation();
      }}
      onTouchEnd={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={[
        "flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 text-left text-base font-semibold transition md:text-sm",
        selected
          ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] text-[var(--pbp-selected-text)]"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] hover:border-[var(--pbp-border-strong)]",
      ].join(" ")}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="inline-flex items-center gap-2 text-[var(--pbp-text-muted)]">
        {selected ? <Check className="h-4 w-4 text-[var(--pbp-accent)]" aria-hidden="true" /> : null}
        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </span>
    </button>
  );
}

function LeafOptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        blurActiveModalElement();
        event.stopPropagation();
      }}
      onTouchEnd={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={[
        "flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-base font-semibold transition md:text-sm",
        selected
          ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] text-[var(--pbp-selected-text)]"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] hover:border-[var(--pbp-border-strong)]",
      ].join(" ")}
    >
      <span className="min-w-0 truncate">{label}</span>
      {selected ? <Check className="h-4 w-4 text-[var(--pbp-accent)]" aria-hidden="true" /> : null}
    </button>
  );
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
  const [expandedCategory1, setExpandedCategory1] = useState<string | null>(value.category1 || null);
  const [expandedCategory2, setExpandedCategory2] = useState<string | null>(value.category2 || null);

  useEffect(() => {
    if (!open) return;
    const fallbackSource = buildCategorySourceFromValue(value);
    setCategorySource(fallbackSource);
    setDraft(value);
    setExpandedCategory1(value.category1 || null);
    setExpandedCategory2(value.category2 || null);
    let isMounted = true;
    fetchAdminStandardsFromApi()
      .then((payload) => {
        if (!isMounted) return;
        const nextSource = buildCategorySourceFromDefinitions(payload.itemCategories);
        const nextDraft = normalizeDraftWithSource(nextSource, value);
        setCategorySource(nextSource);
        setDraft(nextDraft);
        setExpandedCategory1(nextDraft.category1 || null);
        setExpandedCategory2(nextDraft.category2 || null);
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, [open, value]);

  const category2Options = useMemo(() => getCategory2Options(categorySource, draft.category1), [categorySource, draft.category1]);
  const category3Options = useMemo(() => getCategory3Options(categorySource, draft.category2), [categorySource, draft.category2]);

  const handleCategory1Toggle = (option: CategoryOption) => {
    if (expandedCategory1 === option.name) {
      setExpandedCategory1(null);
      setExpandedCategory2(null);
      return;
    }
    setDraft((current) => ({
      ...current,
      category1: option.name,
      category2: current.category1 === option.name ? current.category2 : "",
      category3: current.category1 === option.name ? current.category3 : "",
      category1Id: option.id,
      category2Id: current.category1 === option.name ? current.category2Id : null,
      category3Id: current.category1 === option.name ? current.category3Id : null,
    }));
    setExpandedCategory1(option.name);
    setExpandedCategory2(null);
  };

  const handleCategory2Toggle = (option: CategoryOption) => {
    if (expandedCategory2 === option.name) {
      setExpandedCategory2(null);
      return;
    }
    setDraft((current) => ({
      ...current,
      category2: option.name,
      category3: current.category2 === option.name ? current.category3 : "",
      category2Id: option.id,
      category3Id: current.category2 === option.name ? current.category3Id : null,
    }));
    setExpandedCategory2(option.name);
  };

  const handleCategory3Select = (option: CategoryOption) => {
    setDraft((current) => ({
      ...current,
      category3: option.name,
      category3Id: option.id,
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="pbp-workorder-selectable-panel rounded-2xl border p-3">
          <div className="text-xs text-[var(--pbp-text-muted)]">{copy.category1}</div>
          <div className="mt-2 space-y-2">
            {categorySource.category1Options.map((option) => (
              <CategoryOptionButton
                key={option.name}
                label={option.name}
                selected={draft.category1 === option.name}
                expanded={expandedCategory1 === option.name}
                onClick={() => handleCategory1Toggle(option)}
              />
            ))}
          </div>
        </div>

        <div className="pbp-workorder-selectable-panel rounded-2xl border p-3">
          <div className="text-xs text-[var(--pbp-text-muted)]">{copy.category2}</div>
          {expandedCategory1 === draft.category1 ? (
            <div className="mt-2 space-y-2">
              {category2Options.map((option) => (
                <CategoryOptionButton
                  key={option.name}
                  label={option.name}
                  selected={draft.category2 === option.name}
                  expanded={expandedCategory2 === option.name}
                  onClick={() => handleCategory2Toggle(option)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-[var(--pbp-surface-muted)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">{draft.category1 || "상위 분류"} 항목을 열면 세부 분류를 확인할 수 있습니다.</p>
          )}
        </div>

        <div className="pbp-workorder-selectable-panel rounded-2xl border p-3">
          <div className="text-xs text-[var(--pbp-text-muted)]">{copy.category3}</div>
          {expandedCategory2 === draft.category2 ? (
            <div className="mt-2 space-y-2">
              {category3Options.map((option) => (
                <LeafOptionButton
                  key={option.name}
                  label={option.name}
                  selected={draft.category3 === option.name}
                  onClick={() => handleCategory3Select(option)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-[var(--pbp-surface-muted)] px-3 py-2 text-xs text-[var(--pbp-text-muted)]">{draft.category2 || "중분류"} 항목을 열면 세부 항목을 확인할 수 있습니다.</p>
          )}
        </div>
      </div>

      <div className="pbp-detail-summary-readonly mt-4 rounded-2xl border px-4 py-3">
        <div className="text-xs text-[var(--pbp-text-muted)]">{copy.previewLabel}</div>
        <div className="mt-2 text-sm font-medium text-[var(--pbp-text-primary)]">{formatBasicSummary(draft)}</div>
      </div>
    </ModalShell>
  );
}
