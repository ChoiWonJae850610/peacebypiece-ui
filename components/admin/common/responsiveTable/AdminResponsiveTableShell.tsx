import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ADMIN_RESPONSIVE_TABLE_SHELL_CLASS } from "@/components/admin/common/responsiveTable/adminResponsiveTableStyles";

type AdminResponsiveTableShellProps = {
  children: ReactNode;
  className?: string;
};

export function AdminResponsiveTableShell({ children, className }: AdminResponsiveTableShellProps) {
  return (
    <section className={cn(ADMIN_RESPONSIVE_TABLE_SHELL_CLASS, className)}>
      {children}
    </section>
  );
}
