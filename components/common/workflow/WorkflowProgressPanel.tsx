import type { ReactNode } from "react";

export type WorkflowProgressPanelStep = {
  key: string;
  label: ReactNode;
  isDone: boolean;
  isCurrent: boolean;
  fillClassName?: string;
  currentTextClassName?: string;
  isCompleted?: boolean;
};

export type WorkflowProgressPanelAction = {
  key: string;
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isPrimary?: boolean;
  isProcessing?: boolean;
};

type WorkflowProgressPanelDensity = "default" | "compact";

export function WorkflowProgressPanel({
  title,
  steps,
  actions = [],
  footer,
  density = "default",
  className = "",
}: {
  title: ReactNode;
  steps: WorkflowProgressPanelStep[];
  actions?: WorkflowProgressPanelAction[];
  footer?: ReactNode;
  density?: WorkflowProgressPanelDensity;
  className?: string;
}) {
  const isCompact = density === "compact";
  const trackTone = "bg-[var(--pbp-selected-border)]";

  return (
    <div
      className={`pbp-workflow-panel rounded-[24px] border shadow-sm ${isCompact ? "px-3 py-2" : "p-4"} ${className}`}
    >
      <div
        className={`flex items-start justify-between ${isCompact ? "gap-2" : "gap-4"}`}
      >
        <div className="min-w-0">
          <div
            className={`${isCompact ? "text-xs" : "text-sm"} font-semibold text-stone-900`}
          >
            {title}
          </div>
        </div>
        {actions.length > 0 ? (
          <div
            className={`flex flex-wrap justify-end ${isCompact ? "gap-1.5" : "gap-2"}`}
          >
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                disabled={Boolean(action.disabled)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                  isCompact ? "px-2.5 py-1" : "px-3 py-2"
                } ${action.isPrimary ? "pbp-action-primary" : "pbp-action-secondary border"}`}
              >
                {action.isProcessing ? (
                  <span
                    className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                ) : null}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={isCompact ? "mt-2" : "mt-4"}>
        <div
          className={`grid ${isCompact ? "gap-1" : "gap-2"}`}
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((step, index) => {
            const fillClassName =
              step.fillClassName ?? "bg-[var(--pbp-selected-border)]";
            const currentTextClassName =
              step.currentTextClassName ?? "pbp-text-primary";
            return (
              <div
                key={step.key}
                className={`relative flex flex-col items-center text-center ${isCompact ? "gap-1" : "gap-2"}`}
              >
                {index < steps.length - 1 ? (
                  <div
                    className={`absolute left-1/2 top-3 h-0.5 w-full ${step.isDone ? trackTone : "bg-[var(--pbp-border)]"}`}
                    aria-hidden="true"
                  />
                ) : null}
                <div
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                    step.isDone
                      ? `${fillClassName} border-transparent`
                      : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${step.isDone ? (step.isCompleted ? "bg-white" : "bg-white/90") : "bg-[var(--pbp-text-subtle)]"}`}
                  />
                </div>
                <div
                  className={`${isCompact ? "text-[11px]" : "text-xs"} font-medium ${step.isCurrent ? currentTextClassName : "text-[var(--pbp-text-muted)]"}`}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {footer ? (
        <div
          className={`${isCompact ? "mt-2 text-[11px]" : "mt-4 text-xs"} flex items-center gap-2 text-[var(--pbp-text-muted)]`}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
