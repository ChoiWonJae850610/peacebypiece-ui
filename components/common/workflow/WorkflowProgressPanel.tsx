"use client";

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

export type WorkflowProgressPanelPathMode = "standard" | "directOrder";

export type WorkflowProgressPanelDirectPath = {
  fromKey: string;
  toKey: string;
  isVisible?: boolean;
  isActive?: boolean;
};

const TRACK_VIEWBOX_WIDTH = 100;
const TRACK_VIEWBOX_HEIGHT = 44;
const TRACK_CENTER_Y = 22;
const DIRECT_CURVE_CONTROL_Y = 3;
function getStepPositionPercent(index: number, stepCount: number) {
  if (stepCount <= 1) {
    return 50;
  }

  return (index / (stepCount - 1)) * TRACK_VIEWBOX_WIDTH;
}

function getDirectPathD(fromX: number, toX: number) {
  const controlX = (fromX + toX) / 2;

  return `M ${fromX} ${TRACK_CENTER_Y} Q ${controlX} ${DIRECT_CURVE_CONTROL_Y} ${toX} ${TRACK_CENTER_Y}`;
}

export function WorkflowProgressPanel({
  title,
  steps,
  actions = [],
  footer,
  density = "default",
  className = "",
  pathMode = "standard",
  directPath,
}: {
  title: ReactNode;
  steps: WorkflowProgressPanelStep[];
  actions?: WorkflowProgressPanelAction[];
  footer?: ReactNode;
  density?: WorkflowProgressPanelDensity;
  className?: string;
  pathMode?: WorkflowProgressPanelPathMode;
  directPath?: WorkflowProgressPanelDirectPath;
}) {
  const isCompact = density === "compact";
  const trackPositionClassName = "top-[-10px]";
  const directPathFromIndex = directPath
    ? steps.findIndex((step) => step.key === directPath.fromKey)
    : -1;
  const directPathToIndex = directPath
    ? steps.findIndex((step) => step.key === directPath.toKey)
    : -1;
  const canShowDirectPath = Boolean(
    directPath &&
      directPath.isVisible !== false &&
      directPathFromIndex >= 0 &&
      directPathToIndex >= 0 &&
      directPathFromIndex !== directPathToIndex,
  );
  const shouldEmphasizeDirectPath =
    pathMode === "directOrder" || Boolean(directPath?.isActive);

  return (
    <div
      className={`pbp-workflow-panel rounded-[24px] border shadow-sm ${isCompact ? "px-4 py-3" : "p-4"} ${className}`}
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

      <div className={isCompact ? "mt-3" : "mt-4"}>
        <div className="relative">
          <svg
            className={`pointer-events-none absolute left-0 right-0 ${trackPositionClassName} z-0 h-11 w-full overflow-visible`}
            viewBox={`0 0 ${TRACK_VIEWBOX_WIDTH} ${TRACK_VIEWBOX_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {steps.slice(0, -1).map((step, index) => {
              const fromX = getStepPositionPercent(index, steps.length);
              const toX = getStepPositionPercent(index + 1, steps.length);
              const isSegmentActive = step.isDone && !shouldEmphasizeDirectPath;

              return (
                <line
                  key={`${step.key}-track`}
                  x1={fromX}
                  y1={TRACK_CENTER_Y}
                  x2={toX}
                  y2={TRACK_CENTER_Y}
                  className={
                    isSegmentActive
                      ? "stroke-[var(--pbp-selected-border)]"
                      : "stroke-[var(--pbp-border)]"
                  }
                  opacity={isSegmentActive ? 1 : 0.58}
                  strokeWidth={isSegmentActive ? 1.6 : 1.2}
                  vectorEffect="non-scaling-stroke"
                  style={{
                    transition:
                      "opacity 180ms ease-out, stroke-width 180ms ease-out, stroke 180ms ease-out",
                  }}
                />
              );
            })}
            {canShowDirectPath ? (
              <path
                d={getDirectPathD(
                  getStepPositionPercent(directPathFromIndex, steps.length),
                  getStepPositionPercent(directPathToIndex, steps.length),
                )}
                className={
                  shouldEmphasizeDirectPath
                    ? "stroke-[var(--pbp-selected-border)]"
                    : "stroke-[var(--pbp-border)]"
                }
                fill="none"
                opacity={shouldEmphasizeDirectPath ? 1 : 0.78}
                strokeWidth={shouldEmphasizeDirectPath ? 2.4 : 1.45}
                strokeLinecap="round"
                strokeDasharray={shouldEmphasizeDirectPath ? undefined : "4 3"}
                vectorEffect="non-scaling-stroke"
                style={{
                  transition:
                    "opacity 220ms ease-out, stroke-width 220ms ease-out, stroke 220ms ease-out",
                }}
              />
            ) : null}
          </svg>

          <div
            className={`relative z-10 grid ${isCompact ? "gap-1.5" : "gap-2"}`}
            style={{
              gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
            }}
          >
            {steps.map((step) => {
              const fillClassName =
                step.fillClassName ?? "bg-[var(--pbp-selected-border)]";
              const currentTextClassName =
                step.currentTextClassName ?? "pbp-text-primary";
              return (
                <div
                  key={step.key}
                  className={`relative flex flex-col items-center text-center ${isCompact ? "gap-1.5" : "gap-2"}`}
                >
                  <div
                    className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border ${
                      step.isDone
                        ? `${fillClassName} border-transparent`
                        : "border-[var(--pbp-border)] bg-[var(--pbp-surface)]"
                    }`}
                    style={{
                      transform: `scale(${step.isCurrent ? 1.06 : 1})`,
                      transition: "transform 160ms ease-out",
                    }}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${step.isDone ? (step.isCompleted ? "bg-white" : "bg-white/90") : "bg-[var(--pbp-text-subtle)]"}`}
                      style={{
                        opacity: step.isDone || step.isCurrent ? 1 : 0.72,
                        transition: "opacity 160ms ease-out",
                      }}
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
      </div>

      {footer ? (
        <div
          className={`${isCompact ? "mt-2.5 text-[11px]" : "mt-4 text-xs"} flex items-center gap-2 text-[var(--pbp-text-muted)]`}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
