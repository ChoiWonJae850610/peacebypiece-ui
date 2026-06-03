import type { ReactNode } from "react";

import { WaflStateBlock, type WaflStateTone } from "@/components/common/ui";
import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

type AdminEmptyStateTone = "neutral" | "danger" | "warning";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: AdminEmptyStateTone;
  className?: string;
};

const toneMap: Record<AdminEmptyStateTone, WaflStateTone> = {
  neutral: "neutral",
  danger: "danger",
  warning: "warning",
};

export function AdminEmptyState({ title, description, action, tone = "neutral", className = "" }: AdminEmptyStateProps) {
  return (
    <WaflStateBlock
      title={title}
      description={description}
      action={action}
      kind={tone === "danger" ? "error" : "empty"}
      tone={toneMap[tone]}
      minHeightClassName="min-h-[140px]"
      className={joinAdminClassNames("shadow-[var(--pbp-shadow-card)]", className)}
    />
  );
}
