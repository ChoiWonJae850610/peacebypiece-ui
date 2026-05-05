import type { ReactNode } from "react";

export type WorkOrderLoadingStateVariant = "detail" | "side";

type WorkOrderLoadingStateProps = {
  variant?: WorkOrderLoadingStateVariant;
  title: string;
  description?: string;
};

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-stone-200/80 ${className}`} />;
}

function SkeletonCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">{children}</div>;
}

export default function WorkOrderLoadingState({ variant = "detail", title, description }: WorkOrderLoadingStateProps) {
  if (variant === "side") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4 rounded-[2rem] border border-stone-200 bg-stone-50/80 p-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{title}</div>
              {description ? <div className="mt-1 text-xs leading-5 text-stone-500">{description}</div> : null}
            </div>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" aria-hidden="true" />
          </div>
        </div>
        <SkeletonCard>
          <SkeletonLine className="h-4 w-20" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-20 w-full rounded-2xl" />
            <SkeletonLine className="h-16 w-full rounded-2xl" />
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine className="h-4 w-24" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-12 w-full rounded-xl" />
            <SkeletonLine className="h-12 w-4/5 rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[2rem] border border-stone-200 bg-stone-50/80 p-5">
      <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <div className="text-base font-semibold text-stone-900">{title}</div>
          {description ? <div className="mt-1 text-sm leading-5 text-stone-500">{description}</div> : null}
        </div>
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" aria-hidden="true" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard>
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="mt-4 h-4 w-64 max-w-full" />
          <SkeletonLine className="mt-7 h-32 w-full rounded-2xl" />
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine className="h-5 w-28" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-10 w-full rounded-xl" />
            <SkeletonLine className="h-10 w-11/12 rounded-xl" />
            <SkeletonLine className="h-10 w-2/3 rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SkeletonCard>
          <SkeletonLine className="h-5 w-24" />
          <div className="mt-5 space-y-3">
            <SkeletonLine className="h-8 w-full rounded-xl" />
            <SkeletonLine className="h-8 w-5/6 rounded-xl" />
            <SkeletonLine className="h-8 w-3/4 rounded-xl" />
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <SkeletonLine className="h-5 w-28" />
          <SkeletonLine className="mt-5 h-28 w-full rounded-2xl" />
        </SkeletonCard>
      </div>
    </div>
  );
}
