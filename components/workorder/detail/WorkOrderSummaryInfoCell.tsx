import type { ReactNode } from "react";

import { WaflButton, WaflSummaryInfoCell } from "@/components/common/ui";

export default function WorkOrderSummaryInfoCell({
  label,
  value,
  onClick,
  disabled = false,
  valueClassName = "",
}: {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  valueClassName?: string;
}) {
  const valueNode = (
    <span className={`block truncate text-sm font-semibold pbp-text-primary ${valueClassName}`}>
      {value}
    </span>
  );

  if (!onClick || disabled) {
    return <WaflSummaryInfoCell label={label}>{valueNode}</WaflSummaryInfoCell>;
  }

  return (
    <WaflSummaryInfoCell label={label}>
      <WaflButton
        type="button"
        variant="ghost"
        size="sm"
        width="full"
        onClick={onClick}
        className="min-w-0 px-1.5 py-1 text-center"
      >
        {valueNode}
      </WaflButton>
    </WaflSummaryInfoCell>
  );
}
