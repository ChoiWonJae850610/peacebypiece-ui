import type { ReactNode } from "react";

export default function MobileSectionStack({ children }: { children: ReactNode }) {
  return <div data-wafl-device-density="mobile" className="space-y-3.5">{children}</div>;
}
