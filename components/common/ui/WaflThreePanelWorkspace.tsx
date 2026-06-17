import type { CSSProperties, ReactNode } from "react";

import { RESPONSIVE_BREAKPOINTS } from "@/lib/responsive/responsiveLayoutPolicy";
import { cn } from "@/lib/utils";

const {
  workspaceThreePanelListMin,
  workspaceThreePanelDetailMin,
  workspaceThreePanelSideMin,
  workspacePanelGap,
} = RESPONSIVE_BREAKPOINTS;

export const WAFL_THREE_PANEL_MIN_WIDTH =
  workspaceThreePanelListMin +
  workspaceThreePanelDetailMin +
  workspaceThreePanelSideMin +
  workspacePanelGap * 2;

export const WAFL_THREE_PANEL_GRID_STYLE = {
  gridTemplateColumns: `minmax(${workspaceThreePanelListMin}px, 0.8fr) minmax(${workspaceThreePanelDetailMin}px, 1.35fr) minmax(${workspaceThreePanelSideMin}px, 0.78fr)`,
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
  minWidthClassName,
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
      style={{ minWidth: WAFL_THREE_PANEL_MIN_WIDTH, ...style }}
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
