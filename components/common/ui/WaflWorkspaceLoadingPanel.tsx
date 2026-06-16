import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WAFL_WORKSPACE_SECTION_CARD_CLASS } from "./waflWorkspaceSpacing";
import WaflPanelContentShell from "./WaflPanelContentShell";
import WaflWorkspaceStatePanel from "./WaflWorkspaceStatePanel";

export type WaflWorkspaceLoadingPanelVariant = "detail" | "side";

type WaflWorkspaceLoadingPanelProps = {
  variant?: WaflWorkspaceLoadingPanelVariant;
  title: string;
  description?: string;
  className?: string;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[var(--pbp-surface-muted)] ${className}`} />;
}

function SkeletonCard({ children }: { children: ReactNode }) {
  return <div className={`${WAFL_WORKSPACE_SECTION_CARD_CLASS} p-5`}>{children}</div>;
}

function LoadingContent({
  variant,
  title,
  description,
}: Required<Pick<WaflWorkspaceLoadingPanelProps, "variant" | "title">> &
  Pick<WaflWorkspaceLoadingPanelProps, "description">) {
  if (variant === "side") {
    return (
      <div className={`${WAFL_WORKSPACE_SECTION_CARD_CLASS} flex h-full min-h-0 flex-col gap-4 bg-[var(--pbp-surface-soft)] p-4`}>
        <WaflWorkspaceStatePanel
          title={title}
          description={description}
          kind="loading"
          layout="inline"
        />
        <SkeletonCard>
          <SkeletonLine className="h-4 w-20" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-20 w-full rounded-[var(--pbp-radius-wafl)]" />
            <SkeletonLine className="h-16 w-full rounded-[var(--pbp-radius-wafl)]" />
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine className="h-4 w-24" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-12 w-full rounded-[var(--pbp-radius-wafl)]" />
            <SkeletonLine className="h-12 w-4/5 rounded-[var(--pbp-radius-wafl)]" />
          </div>
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className={`${WAFL_WORKSPACE_SECTION_CARD_CLASS} flex h-full min-h-0 flex-col bg-[var(--pbp-surface-soft)] p-5`}>
      <WaflWorkspaceStatePanel
        title={title}
        description={description}
        kind="loading"
        layout="panel"
        className="mb-5"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard>
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="mt-4 h-4 w-64 max-w-full" />
          <SkeletonLine className="mt-7 h-32 w-full rounded-[var(--pbp-radius-wafl)]" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine className="h-5 w-28" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-10 w-full rounded-[var(--pbp-radius-wafl)]" />
            <SkeletonLine className="h-10 w-11/12 rounded-[var(--pbp-radius-wafl)]" />
            <SkeletonLine className="h-10 w-2/3 rounded-[var(--pbp-radius-wafl)]" />
          </div>
        </SkeletonCard>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SkeletonCard>
          <SkeletonLine className="h-5 w-24" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-8 w-full rounded-[var(--pbp-radius-wafl)]" />
            <SkeletonLine className="h-8 w-5/6 rounded-[var(--pbp-radius-wafl)]" />
            <SkeletonLine className="h-8 w-3/4 rounded-[var(--pbp-radius-wafl)]" />
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine className="h-5 w-28" />
          <SkeletonLine className="mt-5 h-28 w-full rounded-[var(--pbp-radius-wafl)]" />
        </SkeletonCard>
      </div>
    </div>
  );
}

export default function WaflWorkspaceLoadingPanel({
  variant = "detail",
  title,
  description,
  className,
}: WaflWorkspaceLoadingPanelProps) {
  const content = <LoadingContent variant={variant} title={title} description={description} />;

  if (variant === "side") {
    return (
      <div
        data-wafl-component="workspace-loading-panel"
        className={cn("flex min-h-full w-full flex-1 flex-col", className)}
      >
        {content}
      </div>
    );
  }

  return (
    <WaflPanelContentShell
      data-wafl-component="workspace-loading-panel"
      className={cn("box-border flex min-h-full flex-col", className)}
    >
      {content}
    </WaflPanelContentShell>
  );
}
