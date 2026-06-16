"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { WaflSheet, WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS, WaflButton, WaflSidePanelShell, WaflWorkspacePanel } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type TabletSplitLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  sidebar: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  topbar?: ReactNode;
  scrollResetKey: string;
};

export default function TabletSplitLayout({
  appShellRef,
  sidebar,
  detail,
  sidePanel,
  topbar,
  scrollResetKey,
}: TabletSplitLayoutProps) {
  const { i18n } = useI18n();
  const contentScrollRef = useRef<HTMLElement | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const sidePanelTitle = i18n.workorder.ui.attachmentPanel.title;

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ top: 0, left: 0 });
    setSidePanelOpen(false);
  }, [scrollResetKey]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-bg-app)] p-3 text-[var(--pbp-text-primary)] sm:p-4 md:p-6 lg:p-8">
      <div ref={appShellRef} className={`mx-auto flex h-full w-full max-w-[1480px] flex-col overflow-hidden ${WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS}`}>
        {topbar ? <div className="shrink-0">{topbar}</div> : null}
        <WaflWorkspacePanel panelRole="shell" className="grid min-h-0 flex-1 grid-cols-12 overflow-hidden">
          <WaflWorkspacePanel as="aside" panelRole="sidebar" className="col-span-4 min-h-0 rounded-none border-0 border-r border-[var(--pbp-border)] bg-transparent">
            {sidebar}
          </WaflWorkspacePanel>

          <WaflWorkspacePanel
            as="section"
            panelRole="detail"
            ref={contentScrollRef}
            className="col-span-8 min-h-0 overflow-y-auto rounded-none border-0 bg-transparent pb-[calc(7rem+env(safe-area-inset-bottom))]"
          >
            <div className="grid min-h-full grid-cols-1 gap-4">
              <div>{detail}</div>
            </div>
          </WaflWorkspacePanel>
        </WaflWorkspacePanel>

        <WaflWorkspacePanel panelRole="toolbar" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[calc(33.333333%+2rem)] right-8 z-30 p-3 backdrop-blur">
          <WaflButton variant="primary" width="full" size="lg" onClick={() => setSidePanelOpen(true)}>
            {sidePanelTitle}
          </WaflButton>
        </WaflWorkspacePanel>

        <WaflSheet
          open={sidePanelOpen}
          onOpenChange={setSidePanelOpen}
          title={sidePanelTitle}
          description={i18n.workorder.ui.emptyWorkspace.sideDescription}
          side="right"
          size="lg"
          contentClassName="p-0 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <WaflSidePanelShell>{sidePanel}</WaflSidePanelShell>
        </WaflSheet>
      </div>
    </main>
  );
}
