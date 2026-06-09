import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const WORKORDER_PANEL_CARD_CLASS = "rounded-[var(--pbp-radius-wafl)] p-4 pbp-card";

export default function WorkOrderPanelCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(WORKORDER_PANEL_CARD_CLASS, className)}>{children}</div>;
}
