"use client";

import { useState } from "react";

type WorkOrderSidePanelMobileAccordionSectionProps = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  collapseLabel: string;
  children: React.ReactNode;
};

export default function WorkOrderSidePanelMobileAccordionSection({
  title,
  count,
  defaultOpen = false,
  collapseLabel,
  children,
}: WorkOrderSidePanelMobileAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="min-w-0 overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-sm sm:rounded-[22px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full min-w-0 items-center justify-between gap-3 px-3.5 py-3 text-left sm:px-4"
      >
        <div className="min-w-0">
          <div className="break-keep text-sm font-semibold text-stone-900">{title}</div>
          {typeof count === "number" ? <div className="mt-0.5 text-[11px] text-stone-500">{count}</div> : null}
        </div>
        <span className="text-sm text-stone-500">{open ? collapseLabel : "+"}</span>
      </button>
      {open ? <div className="min-w-0 overflow-x-hidden border-t border-stone-200 p-2 sm:p-2.5">{children}</div> : null}
    </section>
  );
}
