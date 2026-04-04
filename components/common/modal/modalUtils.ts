"use client";

import { useEffect, type RefObject } from "react";

type LockState = {
  count: number;
  scrollY: number;
  previousHtmlOverflow: string;
  previousHtmlOverscrollBehavior: string;
  previousBodyOverflow: string;
  previousBodyOverscrollBehavior: string;
  previousBodyPosition: string;
  previousBodyTop: string;
  previousBodyWidth: string;
  previousBodyTouchAction: string;
};

const modalLockState: LockState = {
  count: 0,
  scrollY: 0,
  previousHtmlOverflow: "",
  previousHtmlOverscrollBehavior: "",
  previousBodyOverflow: "",
  previousBodyOverscrollBehavior: "",
  previousBodyPosition: "",
  previousBodyTop: "",
  previousBodyWidth: "",
  previousBodyTouchAction: "",
};

export function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("inert") && !element.getAttribute("aria-hidden"));
}

function lockDocumentScroll() {
  const html = document.documentElement;
  const body = document.body;

  if (modalLockState.count === 0) {
    modalLockState.scrollY = window.scrollY;
    modalLockState.previousHtmlOverflow = html.style.overflow;
    modalLockState.previousHtmlOverscrollBehavior = html.style.overscrollBehavior;
    modalLockState.previousBodyOverflow = body.style.overflow;
    modalLockState.previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    modalLockState.previousBodyPosition = body.style.position;
    modalLockState.previousBodyTop = body.style.top;
    modalLockState.previousBodyWidth = body.style.width;
    modalLockState.previousBodyTouchAction = body.style.touchAction;

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.top = `-${modalLockState.scrollY}px`;
    body.style.width = "100%";
    body.style.touchAction = "none";
    body.dataset.pbpOverlayOpen = "true";
  }

  modalLockState.count += 1;
}

function unlockDocumentScroll() {
  const html = document.documentElement;
  const body = document.body;

  modalLockState.count = Math.max(0, modalLockState.count - 1);
  if (modalLockState.count > 0) return;

  html.style.overflow = modalLockState.previousHtmlOverflow;
  html.style.overscrollBehavior = modalLockState.previousHtmlOverscrollBehavior;
  body.style.overflow = modalLockState.previousBodyOverflow;
  body.style.overscrollBehavior = modalLockState.previousBodyOverscrollBehavior;
  body.style.position = modalLockState.previousBodyPosition;
  body.style.top = modalLockState.previousBodyTop;
  body.style.width = modalLockState.previousBodyWidth;
  body.style.touchAction = modalLockState.previousBodyTouchAction;
  delete body.dataset.pbpOverlayOpen;
  window.scrollTo(0, modalLockState.scrollY);
}

export function useModalEnvironment({
  open,
  dialogRef,
  onClose,
}: {
  open: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    lockDocumentScroll();

    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(dialog);
      (focusables[0] ?? dialog).focus();
    }, 24);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = getFocusableElements(dialog);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      unlockDocumentScroll();
      previousActive?.focus();
    };
  }, [open, dialogRef, onClose]);
}

export const useModalFocusTrap = useModalEnvironment;
