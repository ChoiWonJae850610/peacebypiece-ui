import type { ReactNode } from "react";

import { SYSTEM_PAGE_CLASS, SYSTEM_PAGE_WIDE_CLASS } from "@/components/system/systemSemanticClassNames";

type SystemShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

export default function SystemShell({ children, contentClassName = SYSTEM_PAGE_WIDE_CLASS }: SystemShellProps) {
  return (
    <main className={SYSTEM_PAGE_CLASS}>
      <div className={contentClassName}>{children}</div>
    </main>
  );
}
