"use client";

import { useI18n } from "@/lib/i18n";

type WorkOrderEmptyStateProps = {
  variant?: "workspace" | "detail" | "side";
};

export default function WorkOrderEmptyState({ variant = "workspace" }: WorkOrderEmptyStateProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.emptyWorkspace;
  const title = variant === "detail" ? copy.detailTitle : variant === "side" ? copy.sideTitle : copy.title;
  const description = variant === "detail" ? copy.detailDescription : variant === "side" ? copy.sideDescription : copy.description;
  const isSide = variant === "side";

  return (
    <div className={isSide ? "flex min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-5 text-center shadow-sm" : "flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-6 text-center shadow-sm md:min-h-[520px] md:p-10"}>
      <div className="max-w-md">
        <div className={isSide ? "text-sm font-semibold text-stone-900" : "text-lg font-semibold text-stone-900 md:text-xl"}>{title}</div>
        <p className={isSide ? "mt-2 text-xs leading-5 text-stone-500" : "mt-2 text-sm leading-6 text-stone-500 md:text-base"}>{description}</p>
      </div>
    </div>
  );
}
