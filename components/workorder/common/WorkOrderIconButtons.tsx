"use client";

import { type ButtonHTMLAttributes, useEffect, useRef, useState } from "react";

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

export function WorkOrderCardActionMenu({
  menuLabel,
  editLabel,
  editText,
  onEdit,
  deleteLabel,
  deleteText,
  onDelete,
}: {
  menuLabel: string;
  editLabel?: string;
  editText?: string;
  onEdit?: () => void;
  deleteLabel?: string;
  deleteText?: string;
  onDelete?: () => void;
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
  const handleDelete = () => {
    setOpen(false);
    onDelete?.();
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <WorkOrderMoreIconButton
        label={menuLabel}
        size="sm"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      />
      {open ? (
        <div className="absolute right-0 top-9 z-30 min-w-[116px] overflow-hidden rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-1.5 text-xs font-semibold">
          {onEdit && editLabel && editText ? (
            <button
              type="button"
              onClick={handleEdit}
              className="pbp-interactive-button flex w-full items-center gap-2 wafl-shape-control px-3 py-2 text-left text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-surface-muted)]"
              aria-label={editLabel}
            >
              <WorkOrderEditIcon className="h-3 w-3" />
              <span>{editText}</span>
            </button>
          ) : null}
          {onDelete && deleteLabel && deleteText ? (
            <button
              type="button"
              onClick={handleDelete}
              className="pbp-interactive-button flex w-full items-center gap-2 wafl-shape-control px-3 py-2 text-left text-[var(--pbp-action-danger-soft-text)] hover:bg-[var(--pbp-action-danger-soft-surface)]"
              aria-label={deleteLabel}
            >
              <WorkOrderTrashIcon className="h-3 w-3" />
              <span>{deleteText}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
