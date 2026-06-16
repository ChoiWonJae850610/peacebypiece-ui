"use client";

import { useRef, type ReactNode, type RefObject } from "react";

import { useWorkspaceScrollReset } from "@/lib/hooks/workspace/useWorkspaceScrollReset";
import { cn } from "@/lib/utils";
import { AppResponsiveWorkspace } from "./AppResponsiveFrame";
import WaflDetailWorkspacePanel from "./WaflDetailWorkspacePanel";
import WaflListWorkspacePanel from "./WaflListWorkspacePanel";
import WaflSideWorkspacePanel from "./WaflSideWorkspacePanel";
import WaflThreePanelWorkspace from "./WaflThreePanelWorkspace";
import { WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS } from "./waflWorkspaceSpacing";

type WaflDesktopWorkspaceFrameProps = {
  appShellRef?: RefObject<HTMLDivElement | null>;
  topbar: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  side: ReactNode;
  scrollResetKey?: string;
  beforeWorkspace?: ReactNode;
  workspaceOverlay?: ReactNode;
  className?: string;
};

export default function WaflDesktopWorkspaceFrame({
  appShellRef,
  topbar,
  list,
  detail,
  side,
  scrollResetKey = "",
  beforeWorkspace,
  workspaceOverlay,
  className,
}: WaflDesktopWorkspaceFrameProps) {
  const detailScrollRef = useRef<HTMLElement | null>(null);
  const sidePanelScrollRef = useRef<HTMLElement | null>(null);

  useWorkspaceScrollReset(scrollResetKey, [detailScrollRef, sidePanelScrollRef]);

  return (
    <div
      ref={appShellRef}
      data-wafl-component="desktop-workspace-frame"
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden",
        WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS,
        className,
      )}
    >
      <div className="shrink-0">{topbar}</div>
      {beforeWorkspace}
      <AppResponsiveWorkspace device="desktop">
        {workspaceOverlay}
        <WaflThreePanelWorkspace
          list={<WaflListWorkspacePanel>{list}</WaflListWorkspacePanel>}
          detail={(
            <WaflDetailWorkspacePanel ref={detailScrollRef}>
              {detail}
            </WaflDetailWorkspacePanel>
          )}
          side={(
            <WaflSideWorkspacePanel ref={sidePanelScrollRef}>
              {side}
            </WaflSideWorkspacePanel>
          )}
        />
      </AppResponsiveWorkspace>
    </div>
  );
}
