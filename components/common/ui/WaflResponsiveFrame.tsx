import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ResponsiveDevice = "mobile" | "tablet" | "desktop";

type WaflResponsiveWorkspaceProps = HTMLAttributes<HTMLDivElement> & {
  device: ResponsiveDevice;
};

const workspaceClassMap: Record<ResponsiveDevice, string> = {
  mobile: "min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-1",
  tablet: "min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-1",
  desktop: "min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-1",
};

export function WaflResponsiveWorkspace({ device, className, ...props }: WaflResponsiveWorkspaceProps) {
  return <div className={cn(workspaceClassMap[device], className)} {...props} />;
}

type WaflResponsiveSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  device: Exclude<ResponsiveDevice, "desktop">;
  children: ReactNode;
};

const surfaceClassMap: Record<Exclude<ResponsiveDevice, "desktop">, string> = {
  mobile: "min-w-0 overflow-x-hidden wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 shadow-none sm:p-4",
  tablet: "min-w-0 overflow-x-hidden wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-5 shadow-none",
};

export function WaflResponsiveSurface({ device, className, ...props }: WaflResponsiveSurfaceProps) {
  return <div className={cn(surfaceClassMap[device], className)} {...props} />;
}
