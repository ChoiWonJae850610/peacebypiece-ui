"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { cn } from "@/lib/utils";
import { AppResponsiveWorkspace } from "./AppResponsiveFrame";
import WaflDetailWorkspacePanel from "./WaflDetailWorkspacePanel";
import { WaflMobileListDrawer } from "./WaflMobileShell";
import WaflSideWorkspacePanel from "./WaflSideWorkspacePanel";
import WaflTwoPanelWorkspace from "./WaflTwoPanelWorkspace";
import { WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS } from "./waflWorkspaceSpacing";

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

  useEffect(() => {
    detailScrollRef.current?.scrollTo({ top: 0, left: 0 });
    sideScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [scrollResetKey]);

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
      <div className="shrink-0">{topbar}</div>
      <WaflMobileListDrawer
        open={listDrawerOpen}
        onClose={onCloseListDrawer}
        title={listDrawerTitle}
        closeLabel="닫기"
        closeOverlayAria={listDrawerCloseAria}
        titleId={listDrawerTitleId}
        showHeader={false}
        bodyClassName="!px-0 !py-0"
      >
        <div className="min-h-[72dvh] min-w-0">{list}</div>
      </WaflMobileListDrawer>
      <AppResponsiveWorkspace device="tablet">
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
      </AppResponsiveWorkspace>
    </div>
  );
}
