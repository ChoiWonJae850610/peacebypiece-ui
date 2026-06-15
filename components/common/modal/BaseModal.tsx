"use client";

import { createPortal } from "react-dom";
import { type MouseEvent, type ReactNode, type RefObject } from "react";

import { WAFL_MODAL_OVERLAY_CLASS } from "@/components/common/ui";
import { getWaflModalPortalRoot } from "@/components/common/modal/modalUtils";

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
  rootClassName?: string;
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
  closeOnBackdrop = false,
  rootClassName = "",
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
      className={`pbp-mobile-no-zoom fixed inset-0 z-[3000] pointer-events-auto ${rootClassName}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className={`absolute inset-0 pointer-events-auto pbp-overlay-enter ${overlayClassName}`.trim()}
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      <div
        className="pointer-events-none absolute inset-0 md:p-6"
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          data-wafl-component="modal-panel"
          className={[
            "pointer-events-auto absolute inset-x-0 bottom-0 flex h-[100dvh] max-h-[100dvh] touch-pan-y select-text flex-col overflow-hidden border-0 outline-none overscroll-contain pbp-mobile-sheet-enter pbp-modal-panel sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:h-auto sm:max-h-[min(92dvh,960px)] sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border",
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

  const portalRoot = getWaflModalPortalRoot();
  return createPortal(modalContent, portalRoot ?? document.body);
}
