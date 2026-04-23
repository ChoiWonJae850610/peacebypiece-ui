import { useI18n } from "@/lib/i18n";
import { getDisplayStageLabel, getStageDotTone } from "@/lib/workorder/presentation/statusPresentation";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type ActionProps = WorkOrderDetailViewModel["actionProps"];

export default function WorkOrderDetailMobileActionSection({ stages, currentStage, actions, onAction }: ActionProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.actionSection;

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="text-sm font-semibold text-stone-900">{copy.title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {stages.map((stage) => {
          const isCurrent = stage === currentStage;
          return (
            <div
              key={stage}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                isCurrent ? "border-stone-900 bg-white text-stone-900" : "border-stone-200 bg-white text-stone-500"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isCurrent ? getStageDotTone(stage) : "bg-stone-300"}`} />
              <span>{getDisplayStageLabel(stage)}</span>
            </div>
          );
        })}
      </div>
      {actions.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {actions.map((action, index) => (
            <button
              key={`${currentStage}-${action.nextState}-${action.label}`}
              type="button"
              onClick={() => onAction(action)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                index === 0 ? "bg-stone-900 text-white" : "border border-stone-300 bg-white text-stone-700"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
