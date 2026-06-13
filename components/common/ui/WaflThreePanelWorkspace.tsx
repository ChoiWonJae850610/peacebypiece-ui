import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const WAFL_THREE_PANEL_GRID_STYLE = {
  gridTemplateColumns:
    "minmax(300px, 0.8fr) minmax(0, 1.35fr) minmax(286px, 0.78fr)",
} satisfies CSSProperties;

type WaflThreePanelWorkspaceProps = {
  list: ReactNode;
  detail: ReactNode;
  side: ReactNode;
  className?: string;
  minWidthClassName?: string;
  style?: CSSProperties;
};

export default function WaflThreePanelWorkspace({
  list,
  detail,
  side,
  className,
  minWidthClassName = "min-w-[1080px]",
  style = WAFL_THREE_PANEL_GRID_STYLE,
}: WaflThreePanelWorkspaceProps) {
  return (
    <div
      data-wafl-component="three-panel-workspace"
      className={cn(
        "grid h-full min-h-0 w-full gap-3 overflow-hidden",
        minWidthClassName,
        className,
      )}
      style={style}
    >
      <div data-wafl-slot="list" className="min-h-0 min-w-0 overflow-hidden">
        {list}
      </div>
      <div data-wafl-slot="detail" className="min-h-0 min-w-0 overflow-hidden">
        {detail}
      </div>
      <div data-wafl-slot="side" className="min-h-0 min-w-0 overflow-hidden">
        {side}
      </div>
    </div>
  );
}
