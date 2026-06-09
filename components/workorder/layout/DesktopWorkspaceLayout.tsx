import { useEffect, useRef, type ReactNode, type RefObject } from "react";

import { WaflWorkspacePanel } from "@/components/common/ui";

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
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-app-bg)] p-3 pbp-text-primary sm:p-4 md:p-6 lg:p-8">
      <div ref={appShellRef} className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5">
        {topbar ? <div className="shrink-0">{topbar}</div> : null}
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden sm:gap-4">
          <WaflWorkspacePanel as="aside" panelRole="sidebar" className="flex min-h-0 w-[272px] shrink-0 overflow-hidden xl:w-[284px]">
            {sidebar}
          </WaflWorkspacePanel>

          <WaflWorkspacePanel as="section" panelRole="detail" ref={detailScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-8 [scrollbar-gutter:stable] xl:px-5 xl:py-5 xl:pb-10">
            <div className="mx-auto min-h-full w-full max-w-[860px]">
              {detail}
            </div>
          </WaflWorkspacePanel>

          <WaflWorkspacePanel as="aside" panelRole="side" ref={sidePanelScrollRef} className="min-h-0 w-[302px] shrink-0 overflow-y-auto overscroll-contain px-3.5 py-4 pb-8 [scrollbar-gutter:stable] xl:w-[316px] xl:px-4 xl:pb-10">
            {sidePanel}
          </WaflWorkspacePanel>
        </div>
      </div>
    </main>
  );
}
