import type { ReactNode } from "react";
import { AlertTriangle, Ban, Inbox, LoaderCircle, SearchX, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type WaflStateTone = "neutral" | "info" | "warning" | "danger";
export type WaflStateKind = "empty" | "loading" | "error" | "forbidden" | "search";
export type WaflStateSize = "sm" | "md" | "lg";

export type WaflStateBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  kind?: WaflStateKind;
  tone?: WaflStateTone;
  size?: WaflStateSize;
  centered?: boolean;
  className?: string;
  minHeightClassName?: string;
};

const stateIconMap: Record<WaflStateKind, LucideIcon> = {
  empty: Inbox,
  loading: LoaderCircle,
  error: AlertTriangle,
  forbidden: Ban,
  search: SearchX,
};

const toneClassMap: Record<WaflStateTone, string> = {
  neutral: "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-surface)] text-[var(--pbp-status-info-fg)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
};

const iconToneClassMap: Record<WaflStateTone, string> = {
  neutral: "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-subtle)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
};

const sizeClassMap: Record<WaflStateSize, string> = {
  sm: "px-4 py-6 text-sm",
  md: "px-5 py-10 text-sm",
  lg: "px-6 py-14 text-base",
};

const iconSizeClassMap: Record<WaflStateSize, string> = {
  sm: "h-8 w-8 [&>svg]:h-4 [&>svg]:w-4",
  md: "h-10 w-10 [&>svg]:h-5 [&>svg]:w-5",
  lg: "h-12 w-12 [&>svg]:h-5 [&>svg]:w-5",
};

const titleClassMap: Record<WaflStateSize, string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base md:text-lg",
};

export function WaflStateBlock({
  title,
  description,
  action,
  kind = "empty",
  tone = kind === "error" ? "danger" : kind === "forbidden" ? "warning" : "neutral",
  size = "md",
  centered = true,
  className,
  minHeightClassName = "min-h-[220px]",
}: WaflStateBlockProps) {
  const StateIcon = stateIconMap[kind];
  const isLoading = kind === "loading";

  return (
    <section
      className={cn(
        "flex w-full min-w-0 items-center rounded-[22px] border",
        centered ? "justify-center text-center" : "justify-start text-left",
        sizeClassMap[size],
        minHeightClassName,
        toneClassMap[tone],
        className,
      )}
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
    >
      <div className={cn("max-w-md", centered ? "mx-auto" : "") }>
        <div className={cn("mx-auto mb-3 flex items-center justify-center rounded-full border", iconToneClassMap[tone], iconSizeClassMap[size], centered ? "" : "ml-0") } aria-hidden="true">
          <StateIcon className={isLoading ? "animate-spin" : ""} />
        </div>
        <p className={cn("font-semibold text-[var(--pbp-text)]", titleClassMap[size])}>{title}</p>
        {description ? <p className="mt-1 text-xs leading-5 opacity-80">{description}</p> : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </section>
  );
}

export function WaflEmptyState(props: Omit<WaflStateBlockProps, "kind">) {
  return <WaflStateBlock kind="empty" {...props} />;
}

export function WaflLoadingState(props: Omit<WaflStateBlockProps, "kind">) {
  return <WaflStateBlock kind="loading" {...props} />;
}

export function WaflErrorState(props: Omit<WaflStateBlockProps, "kind" | "tone"> & { tone?: WaflStateTone }) {
  return <WaflStateBlock {...props} kind="error" tone={props.tone ?? "danger"} />;
}

export function WaflForbiddenState(props: Omit<WaflStateBlockProps, "kind" | "tone"> & { tone?: WaflStateTone }) {
  return <WaflStateBlock {...props} kind="forbidden" tone={props.tone ?? "warning"} />;
}
