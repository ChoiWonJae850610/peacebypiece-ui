"use client";

import type { MouseEvent, ReactNode, RefObject } from "react";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
  titleId: string;
  children: ReactNode;
  maxWidthClassName?: string;
  panelClassName?: string;
  overlayClassName?: string;
  closeOnBackdrop?: boolean;
};

export default function BaseModal({
  open,
  onClose,
  dialogRef,
  titleId,
  children,
  maxWidthClassName = "md:max-w-2xl",
  panelClassName = "",
  overlayClassName = "bg-black/45",
  closeOnBackdrop = true,
}: BaseModalProps) {
  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />
      <div className="absolute inset-0" onClick={handleBackdropClick}>
        <div
          ref={dialogRef}
          tabIndex={-1}
          className={`absolute inset-x-0 bottom-0 top-0 flex h-[100dvh] flex-col overflow-hidden rounded-none border border-stone-200 bg-white shadow-2xl outline-none overscroll-contain md:left-1/2 md:top-1/2 md:bottom-auto md:h-auto md:max-h-[92vh] md:w-full md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl ${maxWidthClassName} ${panelClassName}`.trim()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
