import { type ButtonHTMLAttributes } from "react";

import { WaflActionButton, type WaflActionButtonSize, type WaflActionButtonTone } from "@/components/common/ui";

export function WorkOrderPlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function WorkOrderMoreHorizontalIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h.01" />
      <path d="M12 12h.01" />
      <path d="M19 12h.01" />
    </svg>
  );
}

type WorkOrderIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  label: string;
  size?: WaflActionButtonSize;
  tone?: WaflActionButtonTone;
};

export function WorkOrderAddIconButton({
  label,
  size = "lg",
  tone = "neutral",
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel {...props}>
      <WorkOrderPlusIcon />
    </WaflActionButton>
  );
}

export function WorkOrderMoreIconButton({
  label,
  size = "lg",
  tone = "neutral",
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel={false} {...props}>
      <WorkOrderMoreHorizontalIcon />
    </WaflActionButton>
  );
}
