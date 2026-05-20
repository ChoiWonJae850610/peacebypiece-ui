import type { ReactNode } from "react";
import { adminToneClassNames, joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

export type AdminStatusBadgeTone = "neutral" | "brand" | "primary" | "info" | "success" | "warning" | "danger" | "maintenance" | "inverse";
export type AdminStatusBadgeSize = "xs" | "sm";

type AdminStatusBadgeProps = {
  children: ReactNode;
  tone?: AdminStatusBadgeTone;
  size?: AdminStatusBadgeSize;
  className?: string;
  title?: string;
};

const toneClassNames: Record<AdminStatusBadgeTone, string> = {
  ...adminToneClassNames,
  primary: adminToneClassNames.brand,
  maintenance: adminToneClassNames.info,
};

const sizeClassNames: Record<AdminStatusBadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-[11px]",
};

export function AdminStatusBadge({ children, tone = "neutral", size = "sm", className = "", title }: AdminStatusBadgeProps) {
  return (
    <span title={title} className={joinAdminClassNames("inline-flex w-fit shrink-0 items-center justify-center rounded-full border font-semibold leading-none", sizeClassNames[size], toneClassNames[tone], className)}>
      {children}
    </span>
  );
}
