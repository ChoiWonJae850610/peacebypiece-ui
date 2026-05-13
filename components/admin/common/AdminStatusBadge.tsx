import type { ReactNode } from "react";

export type AdminStatusBadgeTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "maintenance" | "inverse";
export type AdminStatusBadgeSize = "xs" | "sm";

type AdminStatusBadgeProps = {
  children: ReactNode;
  tone?: AdminStatusBadgeTone;
  size?: AdminStatusBadgeSize;
  className?: string;
  title?: string;
};

const toneClassNames: Record<AdminStatusBadgeTone, string> = {
  neutral: "border-stone-200 bg-stone-50 text-stone-600",
  primary: "border-stone-900 bg-stone-950 text-white",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  maintenance: "border-blue-200 bg-white text-blue-700",
  inverse: "border-white/20 bg-white/10 text-white",
};

const sizeClassNames: Record<AdminStatusBadgeSize, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-[11px]",
};

export function AdminStatusBadge({ children, tone = "neutral", size = "sm", className = "", title }: AdminStatusBadgeProps) {
  return (
    <span title={title} className={`inline-flex w-fit shrink-0 items-center justify-center rounded-full border font-semibold leading-none ${sizeClassNames[size]} ${toneClassNames[tone]} ${className}`}>
      {children}
    </span>
  );
}
