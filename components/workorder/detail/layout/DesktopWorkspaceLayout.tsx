import type { ReactNode } from "react";

export default function DesktopWorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">{children}</div>;
}
