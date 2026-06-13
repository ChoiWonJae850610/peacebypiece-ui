import type { ReactNode } from "react";

import { WAFL_WORKSPACE_PANEL_PADDING_CLASS } from "@/components/common/ui";

export default function DesktopWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className={`min-h-full w-full ${WAFL_WORKSPACE_PANEL_PADDING_CLASS}`}>{children}</div>;
}
