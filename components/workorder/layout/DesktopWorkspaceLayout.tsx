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
    <WaflDesktopWorkspaceFrame
      appShellRef={appShellRef}
      topbar={topbar}
      list={sidebar}
      detail={detail}
      side={sidePanel}
      scrollResetKey={scrollResetKey}
    />
  );
}
