import type { ReactNode } from "react";

export default function TabletSplitLayout({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
