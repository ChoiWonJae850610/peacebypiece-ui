import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WaflSurface } from "./WaflSurface";

export const WORKORDER_PANEL_CARD_CLASS = "p-4";

export default function WorkOrderPanelCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <WaflSurface
      component="panel-card"
      tone="surface"
      className={cn(WORKORDER_PANEL_CARD_CLASS, className)}
    >
      {children}
    </WaflSurface>
  );
}
