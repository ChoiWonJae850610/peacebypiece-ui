import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS, WaflDetailWorkspacePanel, WaflListWorkspacePanel, WaflSideWorkspacePanel, WaflThreePanelWorkspace } from "@/components/common/ui";

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
      <div ref={appShellRef} className={`mx-auto flex h-full w-full max-w-[1480px] flex-col overflow-hidden ${WAFL_WORKSPACE_PAGE_STACK_GAP_CLASS}`}>
        {topbar ? <div className="shrink-0">{topbar}</div> : null}
        <div className="min-h-0 flex-1 overflow-hidden">
          <WaflThreePanelWorkspace
            list={(
              <WaflListWorkspacePanel>{sidebar}</WaflListWorkspacePanel>
            )}
            detail={(
              <WaflDetailWorkspacePanel ref={detailScrollRef}>
                {detail}
              </WaflDetailWorkspacePanel>
            )}
            side={(
              <WaflSideWorkspacePanel ref={sidePanelScrollRef}>
                {sidePanel}
              </WaflSideWorkspacePanel>
            )}
          />
        </div>
      </div>
    </main>
  );
}
