"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from "react";

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
  useNativeTouchInteractions?: boolean;
  centerWithoutTransform?: boolean;
  blockBackdropScroll?: boolean;
  useSimpleInteractionLayer?: boolean;
  syncVisualViewport?: boolean;
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
  useNativeTouchInteractions = false,
  centerWithoutTransform = false,
  blockBackdropScroll = false,
  useSimpleInteractionLayer = false,
  syncVisualViewport = false,
}: BaseModalProps) {
  const [viewportStyle, setViewportStyle] = useState<CSSProperties | undefined>(undefined);

  useEffect(() => {
    if (!open || !syncVisualViewport || typeof window === "undefined") {
      setViewportStyle(undefined);
      return;
    }

    let frame = 0;
    const updateViewport = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const viewport = window.visualViewport;
        if (!viewport) {
          setViewportStyle(undefined);
          return;
        }

        setViewportStyle({
          top: `${viewport.offsetTop}px`,
          left: `${viewport.offsetLeft}px`,
          width: `${viewport.width}px`,
          height: `${viewport.height}px`,
          right: "auto",
          bottom: "auto",
        });
      });
    };

    const refreshAfterFocusChange = () => {
      updateViewport();
      window.setTimeout(updateViewport, 60);
      window.setTimeout(updateViewport, 180);
      window.setTimeout(updateViewport, 360);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", refreshAfterFocusChange);
    document.addEventListener("focusin", refreshAfterFocusChange, true);
    document.addEventListener("focusout", refreshAfterFocusChange, true);
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", refreshAfterFocusChange);
      document.removeEventListener("focusin", refreshAfterFocusChange, true);
      document.removeEventListener("focusout", refreshAfterFocusChange, true);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, [open, syncVisualViewport]);

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
      style={viewportStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className={`absolute inset-0 pointer-events-auto pbp-overlay-enter ${blockBackdropScroll ? "touch-none" : ""} ${overlayClassName}`.trim()}
        aria-hidden="true"
        onClick={handleBackdropClick}
      />
      <div
        className={[
          "absolute inset-0 md:p-6",
          useSimpleInteractionLayer ? "pointer-events-auto touch-auto" : "pointer-events-none",
          centerWithoutTransform ? "sm:flex sm:items-center sm:justify-center" : "",
        ].join(" ").trim()}
        onClick={useSimpleInteractionLayer ? handleBackdropClick : undefined}
      >
        <div
          ref={dialogRef}
          tabIndex={-1}
          onPointerDown={useNativeTouchInteractions ? undefined : (event) => event.stopPropagation()}
          onTouchStart={useNativeTouchInteractions ? undefined : (event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          data-wafl-component="modal-panel"
          className={[
            `absolute inset-x-0 bottom-0 flex ${syncVisualViewport ? "h-full max-h-full" : "h-[100dvh] max-h-[100dvh]"} flex-col overflow-hidden outline-none overscroll-contain pointer-events-auto select-text pbp-mobile-sheet-enter pbp-modal-panel ${useNativeTouchInteractions ? "touch-auto" : "touch-pan-y"}`,
            centerWithoutTransform
              ? "border-0 sm:relative sm:inset-auto sm:w-[calc(100vw-2rem)] sm:translate-x-0 sm:translate-y-0 sm:rounded-3xl sm:border"
              : "border-0 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border",
            syncVisualViewport ? "sm:h-auto sm:max-h-[92%]" : "sm:h-auto sm:max-h-[min(92dvh,960px)]",
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
