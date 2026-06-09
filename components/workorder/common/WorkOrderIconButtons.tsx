import { type ButtonHTMLAttributes } from "react";

import { WaflActionButton, type WaflActionButtonSize, type WaflActionButtonTone } from "@/components/common/ui";

export function WorkOrderPlusIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
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

export function WorkOrderEditIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

export function WorkOrderTrashIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
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
  size = "md",
  tone = "neutral",
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel {...props}>
      <WorkOrderPlusIcon className="h-3 w-3" />
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


export function WorkOrderEditIconButton({
  label,
  size = "sm",
  tone = "neutral",
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel {...props}>
      <WorkOrderEditIcon />
    </WaflActionButton>
  );
}

export function WorkOrderDeleteIconButton({
  label,
  size = "sm",
  tone = "dangerSoft",
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel {...props}>
      <WorkOrderTrashIcon />
    </WaflActionButton>
  );
}
