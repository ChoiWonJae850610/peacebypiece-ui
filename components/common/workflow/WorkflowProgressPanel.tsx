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
  disabledReason?: ReactNode;
  title?: string;
  ariaLabel?: string;
  isPrimary?: boolean;
  isProcessing?: boolean;
};

type WorkflowProgressPanelDensity = "default" | "compact";

export type WorkflowProgressPanelLayout = "horizontal" | "vertical";

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
const STEP_DOT_RADIUS_Y = 8.8;
const DIRECT_BRIDGE_Y = 4.2;
const DIRECT_BRIDGE_CORNER_X = 2.4;
const DIRECT_BRIDGE_CORNER_Y = 4.6;

function getStepPositionPercent(index: number, stepCount: number) {
  if (stepCount <= 0) {
    return 50;
  }

  return ((index + 0.5) / stepCount) * TRACK_VIEWBOX_WIDTH;
}

function getWorkflowActionReasonId(actionKey: string) {
  return `workflow-action-${actionKey.replace(/[^a-zA-Z0-9_-]+/g, "-")}-reason`;
}

function getDirectPathD(fromX: number, toX: number) {
  const direction = fromX < toX ? 1 : -1;
  const cornerX = Math.min(
    DIRECT_BRIDGE_CORNER_X,
    Math.abs(toX - fromX) / 4,
  );
  const startCornerX = fromX + cornerX * direction;
  const endCornerX = toX - cornerX * direction;
  const circleTopY = TRACK_CENTER_Y - STEP_DOT_RADIUS_Y;
  const cornerBottomY = DIRECT_BRIDGE_Y + DIRECT_BRIDGE_CORNER_Y;

  return [
    `M ${fromX} ${circleTopY}`,
    `L ${fromX} ${cornerBottomY}`,
    `Q ${fromX} ${DIRECT_BRIDGE_Y} ${startCornerX} ${DIRECT_BRIDGE_Y}`,
    `L ${endCornerX} ${DIRECT_BRIDGE_Y}`,
    `Q ${toX} ${DIRECT_BRIDGE_Y} ${toX} ${cornerBottomY}`,
    `L ${toX} ${circleTopY}`,
  ].join(" ");
}

export function WorkflowProgressPanel({
  title,
  steps,
  actions = [],
  footer,
  density = "default",
  layout = "horizontal",
  className = "",
  pathMode = "standard",
  directPath,
}: {
  title: ReactNode;
  steps: WorkflowProgressPanelStep[];
  actions?: WorkflowProgressPanelAction[];
  footer?: ReactNode;
  density?: WorkflowProgressPanelDensity;
  layout?: WorkflowProgressPanelLayout;
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

  if (layout === "vertical") {
    return (
      <div className={`pbp-workflow-panel min-w-0 overflow-hidden rounded-[var(--pbp-radius-wafl)] border p-3.5 sm:p-4 ${className}`}>
        <div className="text-sm font-semibold text-stone-900">{title}</div>
        <ol className="mt-3 grid min-w-0 gap-2">
          {steps.map((step, index) => {
            const fillClassName = step.fillClassName ?? "bg-[var(--pbp-selected-border)]";
            const currentTextClassName = step.currentTextClassName ?? "pbp-text-primary";
            const dotClassName = step.isCurrent
              ? `${fillClassName} text-white`
              : step.isDone
                ? "bg-[var(--pbp-selected-border)] text-white"
                : "bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-muted)]";

            return (
              <li
                key={step.key}
                className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border px-3 py-2.5 text-xs font-medium ${
                  step.isCurrent ? "pbp-workflow-step-current" : "pbp-workflow-step-idle"
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${dotClassName}`}>
                  {index + 1}
                </span>
                <span className={`min-w-0 break-keep ${step.isCurrent ? currentTextClassName : "text-[var(--pbp-text-muted)]"}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        {actions.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {actions.map((action) => {
              const isDisabled = Boolean(action.disabled);
              const helperId = action.disabledReason
                ? getWorkflowActionReasonId(action.key)
                : undefined;

              return (
                <div key={action.key} className="grid gap-1">
                  <button
                    type="button"
                    onClick={action.onClick}
                    disabled={isDisabled}
                    title={action.title}
                    aria-label={action.ariaLabel}
                    aria-describedby={isDisabled ? helperId : undefined}
                    className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--pbp-radius-wafl)] px-3 py-3 text-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${action.isPrimary ? "pbp-action-primary" : "pbp-action-secondary border"}`}
                  >
                    {action.isProcessing ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    ) : null}
                    <span className="min-w-0 break-keep">{action.label}</span>
                  </button>
                  {isDisabled && action.disabledReason ? (
                    <span id={helperId} className="text-center text-[10px] font-medium leading-snug text-[var(--pbp-text-muted)]">
                      {action.disabledReason}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {footer ? (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--pbp-text-muted)]">
            {footer}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`pbp-workflow-panel rounded-[var(--pbp-radius-wafl)] border ${isCompact ? "px-4 py-3" : "p-4"} ${className}`}
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
        {actions.length > 0 && !isCompact ? (
          <div
            className="flex flex-wrap justify-end gap-2"
          >
            {actions.map((action) => {
              const isDisabled = Boolean(action.disabled);
              const helperId = action.disabledReason
                ? getWorkflowActionReasonId(action.key)
                : undefined;

              return (
                <div key={action.key} className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={action.onClick}
                    disabled={isDisabled}
                    title={action.title}
                    aria-label={action.ariaLabel}
                    aria-describedby={isDisabled ? helperId : undefined}
                    className={`inline-flex items-center justify-center gap-2 rounded-[var(--pbp-radius-wafl)] text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
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
                  {isDisabled && action.disabledReason ? (
                    <span id={helperId} className="max-w-[12rem] text-right text-[10px] font-medium leading-snug text-[var(--pbp-text-muted)]">
                      {action.disabledReason}
                    </span>
                  ) : null}
                </div>
              );
            })}
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
            <line
              x1={0}
              y1={TRACK_CENTER_Y}
              x2={TRACK_VIEWBOX_WIDTH}
              y2={TRACK_CENTER_Y}
              className="stroke-[var(--pbp-border)]"
              opacity={0.48}
              strokeWidth={1.15}
              vectorEffect="non-scaling-stroke"
            />
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
                  opacity={isSegmentActive ? 1 : 0.38}
                  strokeWidth={isSegmentActive ? 1.7 : 1.05}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{
                    transition:
                      "opacity 180ms ease-out, stroke-width 180ms ease-out, stroke 180ms ease-out",
                  }}
                />
              );
            })}
            {steps[0] && steps[0].isDone ? (
              <line
                x1={0}
                y1={TRACK_CENTER_Y}
                x2={getStepPositionPercent(0, steps.length)}
                y2={TRACK_CENTER_Y}
                className="stroke-[var(--pbp-selected-border)]"
                opacity={1}
                strokeWidth={1.7}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
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
                opacity={shouldEmphasizeDirectPath ? 1 : 0.18}
                strokeWidth={shouldEmphasizeDirectPath ? 2.2 : 1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={shouldEmphasizeDirectPath ? undefined : "4 4"}
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

      {actions.length > 0 && isCompact ? (
        <div className="mt-3 grid gap-2">
          {actions.map((action) => {
            const isDisabled = Boolean(action.disabled);
            const helperId = action.disabledReason
              ? getWorkflowActionReasonId(action.key)
              : undefined;

            return (
              <div key={action.key} className="grid gap-1">
                <button
                  type="button"
                  onClick={action.onClick}
                  disabled={isDisabled}
                  title={action.title}
                  aria-label={action.ariaLabel}
                  aria-describedby={isDisabled ? helperId : undefined}
                  className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--pbp-radius-wafl)] px-3 py-3 text-center text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${action.isPrimary ? "pbp-action-primary" : "pbp-action-secondary border"}`}
                >
                  {action.isProcessing ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                  ) : null}
                  <span className="min-w-0 break-keep">{action.label}</span>
                </button>
                {isDisabled && action.disabledReason ? (
                  <span id={helperId} className="text-center text-[10px] font-medium leading-snug text-[var(--pbp-text-muted)]">
                    {action.disabledReason}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

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
