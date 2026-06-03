import type { ReactNode } from "react";

import { WaflStateBlock, type WaflStateKind, type WaflStateTone } from "@/components/common/ui";
import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

export type AdminTableStateTone = "neutral" | "danger";

type AdminTableStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: AdminTableStateTone;
  kind?: WaflStateKind;
  className?: string;
  minHeightClassName?: string;
};

const toneMap: Record<AdminTableStateTone, WaflStateTone> = {
  neutral: "neutral",
  danger: "danger",
};

export function AdminTableState({
  title,
  description,
  action,
  tone = "neutral",
  kind,
  className = "",
  minHeightClassName = "min-h-[240px]",
}: AdminTableStateProps) {
  return (
    <WaflStateBlock
      title={title}
      description={description}
      action={action}
      kind={kind ?? (tone === "danger" ? "error" : "empty")}
      tone={toneMap[tone]}
      size="md"
      minHeightClassName={minHeightClassName}
      className={joinAdminClassNames("rounded-none border-0", className)}
    />
  );
}
