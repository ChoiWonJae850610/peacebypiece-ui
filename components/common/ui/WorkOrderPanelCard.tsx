import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const WORKORDER_PANEL_CARD_CLASS = "rounded-[24px] border border-stone-200 bg-white p-4 shadow-sm";

export default function WorkOrderPanelCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(WORKORDER_PANEL_CARD_CLASS, className)}>{children}</div>;
}
