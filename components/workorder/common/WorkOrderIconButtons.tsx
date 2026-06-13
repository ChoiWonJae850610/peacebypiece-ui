"use client";

import { type ButtonHTMLAttributes, useEffect, useRef, useState } from "react";

import { WaflActionButton, WaflActionMenuItem, WaflActionMenuPanel, WaflAddActionButton, WaflMoreActionButton, type WaflActionButtonSize, type WaflActionButtonTone } from "@/components/common/ui";
import { cn } from "@/lib/utils";

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

export function WorkOrderReplyIcon({ className = "h-3 w-3" }: { className?: string }) {
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
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
      <path d="M8 10h7" />
      <path d="M12 7l3 3-3 3" />
    </svg>
  );
}

type WorkOrderIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  label: string;
  size?: WaflActionButtonSize;
  tone?: WaflActionButtonTone;
  active?: boolean;
};

const workOrderActiveIconButtonClassName =
  "border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 focus-visible:ring-white/50 focus-visible:ring-offset-stone-950";

export function WorkOrderAddIconButton({
  label,
  size = "md",
  tone = "neutral",
  active = false,
  className,
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflAddActionButton
      label={label}
      size={size}
      tone={tone}
      showSrLabel
      className={cn(active ? workOrderActiveIconButtonClassName : "", className)}
      {...props}
    />
  );
}

export function WorkOrderMoreIconButton({
  label,
  size = "md",
  tone = "neutral",
  active = false,
  className,
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflMoreActionButton
      label={label}
      size={size}
      tone={tone}
      showSrLabel={false}
      className={cn(active ? workOrderActiveIconButtonClassName : "", className)}
      {...props}
    />
  );
}

export function WorkOrderEditIconButton({
  label,
  size = "sm",
  tone = "neutral",
  active = false,
  className,
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel className={cn(active ? workOrderActiveIconButtonClassName : "", className)} {...props}>
      <WorkOrderEditIcon />
    </WaflActionButton>
  );
}

export function WorkOrderDeleteIconButton({
  label,
  size = "sm",
  tone = "dangerSoft",
  active = false,
  className,
  ...props
}: WorkOrderIconButtonProps) {
  return (
    <WaflActionButton label={label} size={size} tone={tone} showSrLabel className={cn(active ? workOrderActiveIconButtonClassName : "", className)} {...props}>
      <WorkOrderTrashIcon />
    </WaflActionButton>
  );
}

export function WorkOrderCardActionMenu({
  menuLabel,
  editLabel,
  editText,
  onEdit,
  replyLabel,
  replyText,
  onReply,
  deleteLabel,
  deleteText,
  onDelete,
  menuPanelClassName,
}: {
  menuLabel: string;
  editLabel?: string;
  editText?: string;
  onEdit?: () => void;
  replyLabel?: string;
  replyText?: string;
  onReply?: () => void;
  deleteLabel?: string;
  deleteText?: string;
  onDelete?: () => void;
  menuPanelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleEdit = () => {
    setOpen(false);
    onEdit?.();
  };
  const handleReply = () => {
    setOpen(false);
    onReply?.();
  };
  const handleDelete = () => {
    setOpen(false);
    onDelete?.();
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <WorkOrderMoreIconButton
        label={menuLabel}
        size="md"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      />
      {open ? (
        <WaflActionMenuPanel className={cn("top-9 min-w-[116px]", menuPanelClassName)}>
          {onEdit && editLabel && editText ? (
            <WaflActionMenuItem onClick={handleEdit} aria-label={editLabel} icon={<WorkOrderEditIcon className="h-3 w-3" />}>
              {editText}
            </WaflActionMenuItem>
          ) : null}
          {onReply && replyLabel && replyText ? (
            <WaflActionMenuItem onClick={handleReply} aria-label={replyLabel} icon={<WorkOrderReplyIcon className="h-3 w-3" />}>
              {replyText}
            </WaflActionMenuItem>
          ) : null}
          {onDelete && deleteLabel && deleteText ? (
            <WaflActionMenuItem onClick={handleDelete} aria-label={deleteLabel} tone="danger" icon={<WorkOrderTrashIcon className="h-3 w-3" />}>
              {deleteText}
            </WaflActionMenuItem>
          ) : null}
        </WaflActionMenuPanel>
      ) : null}
    </div>
  );
}
