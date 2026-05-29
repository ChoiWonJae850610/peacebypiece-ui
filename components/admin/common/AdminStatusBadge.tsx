import type { ReactNode } from "react";

import { AppBadge, type AppBadgeSize, type AppBadgeTone } from "@/components/common/ui";

export type AdminStatusBadgeTone =
  | "neutral"
  | "brand"
  | "primary"
  | "workorder"
  | "design"
  | "document"
  | "memo"
  | "file"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "maintenance"
  | "inverse";
export type AdminStatusBadgeSize = "xs" | "sm";

type AdminStatusBadgeProps = {
  children: ReactNode;
  tone?: AdminStatusBadgeTone;
  size?: AdminStatusBadgeSize;
  className?: string;
  title?: string;
};

const toneMap: Record<AdminStatusBadgeTone, AppBadgeTone> = {
  neutral: "neutral",
  brand: "brand",
  primary: "brand",
  workorder: "workorder",
  design: "design",
  document: "document",
  memo: "memo",
  file: "file",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  maintenance: "info",
  inverse: "inverse",
};

const sizeMap: Record<AdminStatusBadgeSize, AppBadgeSize> = {
  xs: "xs",
  sm: "sm",
};

export function AdminStatusBadge({
  children,
  tone = "neutral",
  size = "sm",
  className = "",
  title,
}: AdminStatusBadgeProps) {
  return (
    <AppBadge title={title} tone={toneMap[tone]} size={sizeMap[size]} className={className}>
      {children}
    </AppBadge>
  );
}
