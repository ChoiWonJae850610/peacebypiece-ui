import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const WAFL_TWO_PANEL_GRID_STYLE = {
  gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.46fr)",
} satisfies CSSProperties;

type WaflTwoPanelWorkspaceProps = {
  detail: ReactNode;
  side: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function WaflTwoPanelWorkspace({
  detail,
  side,
  className,
  style = WAFL_TWO_PANEL_GRID_STYLE,
}: WaflTwoPanelWorkspaceProps) {
  return (
    <div
      data-wafl-component="two-panel-workspace"
      className={cn(
        "grid h-full min-h-0 min-w-0 gap-3 overflow-hidden",
        className,
      )}
      style={style}
    >
      <div data-wafl-slot="detail" className="min-h-0 min-w-0 overflow-hidden">
        {detail}
      </div>
      <div data-wafl-slot="side" className="min-h-0 min-w-0 overflow-hidden">
        {side}
      </div>
    </div>
  );
}
