"use client";

import { useRef, type ReactNode, type RefObject } from "react";

import { useWorkspaceScrollReset } from "@/lib/hooks/workspace/useWorkspaceScrollReset";
import { cn } from "@/lib/utils";
import { WaflResponsiveWorkspace } from "./WaflResponsiveFrame";
import WaflDetailWorkspacePanel from "./WaflDetailWorkspacePanel";
import { WaflMobileListDrawer } from "./WaflMobileShell";
import WaflSideWorkspacePanel from "./WaflSideWorkspacePanel";
import WaflTwoPanelWorkspace from "./WaflTwoPanelWorkspace";
import { WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS } from "./waflWorkspaceSpacing";
import {
  WAFL_WORKSPACE_TOPBAR_SLOT_CLASS,
  WAFL_TABLET_LIST_DRAWER_CLASS,
  WAFL_WORKSPACE_LIST_DRAWER_BODY_CLASS,
  WAFL_WORKSPACE_LIST_DRAWER_CONTENT_CLASS,
} from "./waflWorkspaceChrome";

type WaflTabletWorkspaceFrameProps = {
  appShellRef?: RefObject<HTMLDivElement | null>;
  topbar: ReactNode;
  listDrawerOpen: boolean;
  onCloseListDrawer: () => void;
  listDrawerTitle: string;
  listDrawerTitleId: string;
  listDrawerCloseAria: string;
  list: ReactNode;
  detail: ReactNode;
  side: ReactNode;
  scrollResetKey?: string;
  workspaceOverlay?: ReactNode;
  className?: string;
};

export default function WaflTabletWorkspaceFrame({
  appShellRef,
  topbar,
  listDrawerOpen,
  onCloseListDrawer,
  listDrawerTitle,
  listDrawerTitleId,
  listDrawerCloseAria,
  list,
  detail,
  side,
  scrollResetKey = "",
  workspaceOverlay,
  className,
}: WaflTabletWorkspaceFrameProps) {
  const detailScrollRef = useRef<HTMLElement | null>(null);
  const sideScrollRef = useRef<HTMLElement | null>(null);

  useWorkspaceScrollReset(scrollResetKey, [detailScrollRef, sideScrollRef]);

  return (
    <div
      ref={appShellRef}
      data-wafl-component="tablet-workspace-frame"
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden",
        WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS,
        className,
      )}
    >
      <div className={WAFL_WORKSPACE_TOPBAR_SLOT_CLASS}>{topbar}</div>
      <WaflMobileListDrawer
        open={listDrawerOpen}
        onClose={onCloseListDrawer}
        title={listDrawerTitle}
        closeLabel="닫기"
        closeOverlayAria={listDrawerCloseAria}
        titleId={listDrawerTitleId}
        showHeader={false}
        className={WAFL_TABLET_LIST_DRAWER_CLASS}
        bodyClassName={WAFL_WORKSPACE_LIST_DRAWER_BODY_CLASS}
      >
        <div className={WAFL_WORKSPACE_LIST_DRAWER_CONTENT_CLASS}>{list}</div>
      </WaflMobileListDrawer>
      <WaflResponsiveWorkspace device="tablet">
        {workspaceOverlay}
        <WaflTwoPanelWorkspace
          detail={(
            <WaflDetailWorkspacePanel ref={detailScrollRef}>
              {detail}
            </WaflDetailWorkspacePanel>
          )}
          side={(
            <WaflSideWorkspacePanel ref={sideScrollRef}>
              {side}
            </WaflSideWorkspacePanel>
          )}
        />
      </WaflResponsiveWorkspace>
    </div>
  );
}
