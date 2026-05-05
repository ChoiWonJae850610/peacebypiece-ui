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
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-emerald-900">{title}</div>
          <div className="mt-1 text-sm text-emerald-800">
            {recommendation.category1} / {recommendation.category2} / {recommendation.category3}
          </div>
          <div className="mt-1 text-xs leading-5 text-emerald-700">{recommendation.reason}</div>
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="pbp-interactive-button shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
