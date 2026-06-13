import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { WaflSidePanelShell, WaflThreePanelWorkspace, WaflWorkspacePanel } from "@/components/common/ui";

type DesktopWorkspaceLayoutProps = {
  appShellRef: RefObject<HTMLDivElement | null>;
  sidebar: ReactNode;
  detail: ReactNode;
  sidePanel: ReactNode;
  topbar?: ReactNode;
  scrollResetKey: string;
};

export default function DesktopWorkspaceLayout({
  appShellRef,
  sidebar,
  detail,
  sidePanel,
  topbar,
  scrollResetKey,
}: DesktopWorkspaceLayoutProps) {
  const detailScrollRef = useRef<HTMLElement | null>(null);
  const sidePanelScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    detailScrollRef.current?.scrollTo({ top: 0, left: 0 });
    sidePanelScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [scrollResetKey]);
  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-bg-app)] p-3 pbp-text-primary sm:p-4 md:p-6 lg:p-8">
      <div ref={appShellRef} className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5">
        {topbar ? <div className="shrink-0">{topbar}</div> : null}
        <div className="min-h-0 flex-1 overflow-hidden">
          <WaflThreePanelWorkspace
            list={(
              <WaflWorkspacePanel as="aside" panelRole="sidebar" className="flex h-full min-h-0 overflow-hidden">
                {sidebar}
              </WaflWorkspacePanel>
            )}
            detail={(
              <WaflWorkspacePanel
                as="section"
                panelRole="detail"
                ref={detailScrollRef}
                className="h-full min-h-0 overflow-y-auto overscroll-contain pb-8 [scrollbar-gutter:stable] xl:pb-10"
              >
                {detail}
              </WaflWorkspacePanel>
            )}
            side={(
              <WaflWorkspacePanel
                as="aside"
                panelRole="side"
                ref={sidePanelScrollRef}
                className="h-full min-h-0 overflow-y-auto overscroll-contain pb-8 [scrollbar-gutter:stable] xl:pb-10"
              >
                <WaflSidePanelShell>{sidePanel}</WaflSidePanelShell>
              </WaflWorkspacePanel>
            )}
          />
        </div>
      </div>
    </main>
  );
}
