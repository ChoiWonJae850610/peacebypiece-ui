import {
  createElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import {
  getWaflPrimitiveClassName,
  waflInteractiveClass,
  waflToneClassMap,
  type WaflPrimitiveShape,
} from "./WaflPrimitive";

export type WaflSurfaceTone =
  | "default"
  | "surface"
  | "selected"
  | "muted"
  | "empty"
  | "warning"
  | "danger"
  | "info";
type WaflSurfaceElement = "div" | "section" | "article" | "header" | "aside";
export type WaflEmptyDensity = "compact" | "default" | "spacious";

const emptyDensityClassMap: Record<WaflEmptyDensity, string> = {
  compact: "min-h-12 px-3 py-3 text-xs sm:min-h-14 sm:px-4",
  default: "min-h-14 px-4 py-4 text-sm sm:min-h-16",
  spacious: "min-h-20 px-4 py-5 text-sm sm:min-h-24",
};

const addCardDensityClassMap: Record<WaflEmptyDensity, string> = {
  compact: "min-h-12 px-3 py-3 sm:min-h-14",
  default: "min-h-14 px-4 py-4 sm:min-h-16",
  spacious: "min-h-20 px-4 py-5 sm:min-h-24",
};

const surfaceToneClassMap: Record<WaflSurfaceTone, string> = {
  default: waflToneClassMap.surface,
  surface: waflToneClassMap.surface,
  selected: waflToneClassMap.selected,
  muted: waflToneClassMap.muted,
  empty: waflToneClassMap.empty,
  warning: waflToneClassMap.warning,
  danger: waflToneClassMap.danger,
  info: waflToneClassMap.info,
};

export function WaflSurface({
  as: Component = "div",
  children,
  className,
  component = "surface",
  tone = "surface",
  shape = "surface",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: WaflSurfaceElement;
  children?: ReactNode;
  component?: string;
  tone?: WaflSurfaceTone;
  shape?: Extract<WaflPrimitiveShape, "surface" | "control">;
}) {
  return createElement(
    Component,
    {
      "data-wafl-component": component,
      "data-wafl-foundation": shape,
      "data-wafl-tone": tone,
      className: getWaflPrimitiveClassName({
        shape,
        tone: tone === "default" ? "surface" : tone,
        className,
      }),
      ...props,
    },
    children,
  );
}

export function WaflInfoRow({
  children,
  className,
  component = "info-row",
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  component?: string;
  tone?: WaflSurfaceTone;
  shape?: Extract<WaflPrimitiveShape, "surface" | "control">;
}) {
  return (
    <div
      data-wafl-component={component}
      data-wafl-foundation="control"
      data-wafl-tone="surface"
      className={cn(
        getWaflPrimitiveClassName({
          shape: "control",
          tone: tone === "default" ? "surface" : tone,
          className: "flex items-center justify-between gap-4 px-3 py-2",
        }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WaflSurfaceButton({
  children,
  className,
  component = "surface-button",
  selected = false,
  tone = "surface",
  shape = "surface",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  component?: string;
  selected?: boolean;
  tone?: WaflSurfaceTone;
  shape?: Extract<WaflPrimitiveShape, "surface" | "control">;
}) {
  return (
    <button
      type={type}
      data-wafl-component={component}
      data-wafl-foundation={shape}
      data-wafl-tone={selected ? "selected" : tone}
      data-wafl-state={selected ? "selected" : "normal"}
      className={cn(
        cn(
          "pbp-interactive-card min-w-0 border p-3 text-left shadow-none disabled:cursor-not-allowed disabled:opacity-45",
          shape === "control" ? "wafl-shape-control" : "wafl-shape-surface",
          waflInteractiveClass,
        ),
        selected ? surfaceToneClassMap.selected : surfaceToneClassMap[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function WaflEmptyCard({
  children,
  className,
  component = "empty-card",
  density = "default",
  shape = "control",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  component?: string;
  density?: WaflEmptyDensity;
  shape?: Extract<WaflPrimitiveShape, "surface" | "control">;
}) {
  return (
    <div
      data-wafl-component={component}
      data-wafl-foundation={shape}
      data-wafl-tone="empty"
      data-wafl-state="empty"
      data-wafl-density={density}
      className={cn(
        getWaflPrimitiveClassName({
          shape,
          tone: "empty",
          className: cn("flex min-w-0 flex-col items-center justify-center text-center", emptyDensityClassMap[density]),
        }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WaflAddCard({
  children,
  className,
  component = "add-card",
  density = "default",
  shape = "control",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  component?: string;
  density?: WaflEmptyDensity;
  shape?: Extract<WaflPrimitiveShape, "surface" | "control">;
}) {
  return (
    <div
      data-wafl-component={component}
      data-wafl-foundation={shape}
      data-wafl-tone="empty"
      data-wafl-state="empty"
      data-wafl-density={density}
      className={cn(
        getWaflPrimitiveClassName({
          shape,
          tone: "empty",
          className: cn(
            "flex items-center justify-center",
            addCardDensityClassMap[density],
          ),
        }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WaflAddCardButton({
  children,
  className,
  component = "add-card-button",
  density = "default",
  description,
  icon,
  label,
  shape = "control",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  component?: string;
  density?: WaflEmptyDensity;
  description?: ReactNode;
  icon?: ReactNode;
  label?: ReactNode;
  shape?: Extract<WaflPrimitiveShape, "surface" | "control">;
}) {
  const content = children ?? (
    <>
      {icon ?? <WaflAddIconBubble />}
      {label ? (
        <span className="text-sm font-bold text-[var(--pbp-text-primary)]">
          {label}
        </span>
      ) : null}
      {description ? (
        <span className="text-center text-xs leading-5 text-[var(--pbp-text-muted)]">
          {description}
        </span>
      ) : null}
    </>
  );

  return (
    <button
      type={type}
      data-wafl-component={component}
      data-wafl-primitive="add-card-button"
      data-wafl-foundation={shape}
      data-wafl-tone="empty"
      data-wafl-state="empty"
      data-wafl-density={density}
      className={cn(
        cn(
          getWaflPrimitiveClassName({
            shape,
            tone: "empty",
            className: cn(
              "pbp-interactive-button group flex flex-col items-center justify-center gap-2 text-center disabled:cursor-not-allowed disabled:opacity-45",
              addCardDensityClassMap[density],
            ),
          }),
          "hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]",
          waflInteractiveClass,
        ),
        className,
      )}
      {...props}
    >
      {content}
    </button>
  );
}

export type WaflAddIconBubbleSize = "sm" | "md" | "lg";

const addIconBubbleSizeClassMap: Record<WaflAddIconBubbleSize, string> = {
  sm: "h-7 w-7 [&>svg]:h-3 [&>svg]:w-3",
  md: "h-8 w-8 [&>svg]:h-3 [&>svg]:w-3",
  lg: "h-9 w-9 [&>svg]:h-3.5 [&>svg]:w-3.5",
};

export function WaflAddIconBubble({
  className,
  component = "add-card-button-icon",
  size = "md",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  component?: string;
  size?: WaflAddIconBubbleSize;
}) {
  return (
    <span
      data-wafl-component={component}
      data-wafl-primitive="add-card-button-icon"
      data-wafl-foundation="icon"
      className={cn(
        "pbp-sidepanel-preview-surface inline-flex shrink-0 items-center justify-center wafl-shape-icon border border-[var(--pbp-border)] bg-[var(--pbp-action-secondary-surface)] text-[var(--pbp-text-muted)] shadow-none transition group-hover:border-[var(--pbp-border-strong)] group-hover:bg-[var(--pbp-action-secondary-surface-hover)]",
        addIconBubbleSizeClassMap[size],
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </span>
  );
}

export function WaflFileCard({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
}) {
  return (
    <WaflSurface
      component="file-card"
      tone="surface"
      shape="control"
      className={cn(
        "pbp-sidepanel-item pbp-interactive-card relative p-3",
        className,
      )}
      {...props}
    >
      {children}
    </WaflSurface>
  );
}

export function WaflPlainButton({
  children,
  className,
  component = "button",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  component?: string;
}) {
  return (
    <button
      type={type}
      data-wafl-component={component}
      data-wafl-foundation="control"
      data-wafl-tone="surface"
      className={cn(
        cn(
          getWaflPrimitiveClassName({
            shape: "control",
            tone: "surface",
            className:
              "pbp-interactive-button disabled:cursor-not-allowed disabled:opacity-45",
          }),
          "hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]",
          waflInteractiveClass,
        ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
