import type { ReactNode } from "react";

import WaflFilterBar from "@/components/admin/common/WaflFilterBar";

type AdminFilterBarProps = {
  children: ReactNode;
  className?: string;
  layoutClassName?: string;
};

export default function AdminFilterBar({
  children,
  className = "",
  layoutClassName = "flex flex-wrap items-center gap-2",
}: AdminFilterBarProps) {
  return (
    <WaflFilterBar className={className} layoutClassName={layoutClassName}>
      {children}
    </WaflFilterBar>
  );
}
