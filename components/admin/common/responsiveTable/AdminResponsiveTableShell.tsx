import type { ReactNode } from "react";

import { WaflDataTableShell } from "@/components/admin/common/WaflDataTable";

type AdminResponsiveTableShellProps = {
  children: ReactNode;
  className?: string;
};

export function AdminResponsiveTableShell({ children, className }: AdminResponsiveTableShellProps) {
  return <WaflDataTableShell className={className}>{children}</WaflDataTableShell>;
}
