import type { ReactNode } from "react";

import { WaflWorkspacePanel } from "@/components/common/ui";

export default function DesktopWorkspaceLayout({ children }: { children: ReactNode }) {
  return <WaflWorkspacePanel panelRole="content" className="p-6">{children}</WaflWorkspacePanel>;
}
