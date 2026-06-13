import type { ReactNode } from "react";

export default function SidePanelSectionStack({ children }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className="flex min-h-0 flex-col gap-3 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      {children}
    </div>
  );
}
