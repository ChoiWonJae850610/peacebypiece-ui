import type { ReactNode } from "react";

import { WaflLoadingState } from "@/components/common/ui";

export type WorkOrderLoadingStateVariant = "detail" | "side";

type WorkOrderLoadingStateProps = {
  variant?: WorkOrderLoadingStateVariant;
  title: string;
  description?: string;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-[var(--pbp-surface-muted)] ${className}`} />;
}

function SkeletonCard({ children }: { children: ReactNode }) {
  return <div className="rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5">{children}</div>;
}

export default function WorkOrderLoadingState({ variant = "detail", title, description }: WorkOrderLoadingStateProps) {
  if (variant === "side") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
        <WaflLoadingState
          title={title}
          description={description}
          size="sm"
          minHeightClassName="min-h-[96px]"
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
    <div className="flex h-full min-h-0 flex-col rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-5">
      <WaflLoadingState
        title={title}
        description={description}
        minHeightClassName="min-h-[120px]"
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
