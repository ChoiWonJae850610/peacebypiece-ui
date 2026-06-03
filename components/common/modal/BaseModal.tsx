"use client";

import { createPortal } from "react-dom";
import type { MouseEvent, ReactNode, RefObject } from "react";

import { WAFL_MODAL_OVERLAY_CLASS } from "@/components/common/ui";

type BaseModalProps = {
  open: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
  titleId: string;
  descriptionId?: string;
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
  descriptionId,
  children,
  maxWidthClassName = "md:max-w-2xl",
  panelClassName = "",
  overlayClassName = WAFL_MODAL_OVERLAY_CLASS,
  closeOnBackdrop = true,
}: BaseModalProps) {
  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[90]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className={`absolute inset-0 pbp-overlay-enter ${overlayClassName}`} aria-hidden="true" />
      <div className="absolute inset-0 md:p-6" onClick={handleBackdropClick}>
        <div
          ref={dialogRef}
          tabIndex={-1}
          className={[
            "absolute inset-0 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden outline-none overscroll-contain pbp-mobile-sheet-enter pbp-modal-panel",
            "border-0 md:left-1/2 md:top-1/2 md:bottom-auto md:h-auto md:max-h-[min(92dvh,960px)] md:w-full md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border",
            maxWidthClassName,
            panelClassName,
          ].join(" ").trim()}
        >
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return modalContent;

  return createPortal(modalContent, document.body);
}
