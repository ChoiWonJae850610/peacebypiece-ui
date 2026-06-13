import type { ReactNode } from "react";

import { WaflPanelContentShell } from "@/components/common/ui";

export default function DesktopWorkspaceLayout({ children }: { children: ReactNode }) {
  return <WaflPanelContentShell>{children}</WaflPanelContentShell>;
}
