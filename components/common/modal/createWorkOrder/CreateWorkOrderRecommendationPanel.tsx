import { MODAL_CONTENT_SECTION_PANEL_CLASS } from "@/components/common/modal/modalContentClassNames";
import type { WorkOrderCategoryRecommendation } from "@/lib/constants/workorderCategoryKeywords";

type Props = {
  recommendation: WorkOrderCategoryRecommendation | null;
  disabled?: boolean;
  title: string;
  applyLabel: string;
  onApply: () => void;
};

export default function CreateWorkOrderRecommendationPanel({ recommendation, disabled = false, title, applyLabel, onApply }: Props) {
  if (!recommendation) return null;

  return (
    <div className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] p-3`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--pbp-selected-text)]">{title}</div>
          <div className="mt-1 text-sm text-[var(--pbp-selected-text)]">
            {recommendation.category1} / {recommendation.category2} / {recommendation.category3}
          </div>
          <div className="mt-1 text-xs leading-5 text-[var(--pbp-selected-text)] opacity-80">{recommendation.reason}</div>
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="pbp-interactive-button pbp-action-secondary shrink-0 rounded-xl border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
