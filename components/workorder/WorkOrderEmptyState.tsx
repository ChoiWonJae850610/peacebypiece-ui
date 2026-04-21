"use client";

import { useI18n } from "@/lib/i18n";

export default function WorkOrderEmptyState() {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.emptyWorkspace;

  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white p-6 text-center shadow-sm md:min-h-[520px] md:p-10">
      <div className="max-w-md">
        <div className="text-lg font-semibold text-stone-900 md:text-xl">{copy.title}</div>
        <p className="mt-2 text-sm leading-6 text-stone-500 md:text-base">{copy.description}</p>
      </div>
    </div>
  );
}
