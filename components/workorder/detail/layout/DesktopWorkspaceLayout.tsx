import type { ReactNode } from "react";

import { WAFL_WORKSPACE_PANEL_PADDING_CLASS, WaflWorkspacePanel } from "@/components/common/ui";

export default function DesktopWorkspaceLayout({ children }: { children: ReactNode }) {
  return <WaflWorkspacePanel panelRole="content" className={WAFL_WORKSPACE_PANEL_PADDING_CLASS}>{children}</WaflWorkspacePanel>;
}
