import type { ReactNode } from "react";

export default function DesktopWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl p-6 pbp-card">{children}</div>;
}
