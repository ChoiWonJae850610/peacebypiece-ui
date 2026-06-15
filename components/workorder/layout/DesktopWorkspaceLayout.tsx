import type { ReactNode, RefObject } from "react";

import { WaflDesktopWorkspaceFrame } from "@/components/common/ui";

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
  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-bg-app)] p-3 pbp-text-primary sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto h-full w-full max-w-[1480px] overflow-hidden">
        <WaflDesktopWorkspaceFrame
          appShellRef={appShellRef}
          topbar={topbar}
          list={sidebar}
          detail={detail}
          side={sidePanel}
          scrollResetKey={scrollResetKey}
        />
      </div>
    </main>
  );
}
