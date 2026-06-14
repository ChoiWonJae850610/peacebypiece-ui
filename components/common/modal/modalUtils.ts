"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";

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
  bodyPositionLocked: boolean;
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
  bodyPositionLocked: false,
};

const modalStack: string[] = [];

function pushModalStack(id: string) {
  modalStack.push(id);
}

function removeModalStack(id: string) {
  const index = modalStack.lastIndexOf(id);
  if (index >= 0) {
    modalStack.splice(index, 1);
  }
}

function isTopModal(id: string) {
  return modalStack[modalStack.length - 1] === id;
}

export function shouldUseTouchModalFocusPolicy() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024;
}

export function blurActiveModalElement(container?: HTMLElement | null) {
  if (typeof document === "undefined") return;
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return;
  if (container && !container.contains(activeElement)) return;
  activeElement.blur();
}

export function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("inert") && !element.getAttribute("aria-hidden"));
}

function lockDocumentScroll({ lockBodyPosition = true }: { lockBodyPosition?: boolean } = {}) {
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
    body.style.width = "100%";
    // Do not force touch-action:none on document.body. The modal already
    // contains scrolling, and iPad Safari can retain a stale hit-test state
    // after the software keyboard closes when body touch actions are disabled.
    modalLockState.bodyPositionLocked = lockBodyPosition;

    if (lockBodyPosition) {
      body.style.position = "fixed";
      body.style.top = `-${modalLockState.scrollY}px`;
    }

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

  if (modalLockState.bodyPositionLocked) {
    window.scrollTo(0, modalLockState.scrollY);
  }

  modalLockState.bodyPositionLocked = false;
}

export function useModalEnvironment({
  open,
  dialogRef,
  onClose,
  lockBodyPosition = true,
}: {
  open: boolean;
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  lockBodyPosition?: boolean;
}) {
  const modalId = useMemo(() => `modal-${Math.random().toString(36).slice(2, 11)}`, []);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const useTouchFocusPolicy = shouldUseTouchModalFocusPolicy();
    const previousActive = !useTouchFocusPolicy && document.activeElement instanceof HTMLElement ? document.activeElement : null;

    pushModalStack(modalId);
    lockDocumentScroll({ lockBodyPosition });

    const focusTimer = window.setTimeout(() => {
      if (!isTopModal(modalId)) return;

      if (useTouchFocusPolicy) {
        dialog.focus({ preventScroll: true });
        return;
      }

      const focusables = getFocusableElements(dialog);
      (focusables[0] ?? dialog).focus({ preventScroll: true });
    }, 24);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal(modalId)) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (useTouchFocusPolicy || event.key !== "Tab") return;
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

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown, true);
      removeModalStack(modalId);
      unlockDocumentScroll();
      blurActiveModalElement(dialog);
      if (!useTouchFocusPolicy && previousActive && document.contains(previousActive)) {
        previousActive.focus();
      }
    };
  }, [open, dialogRef, modalId, lockBodyPosition]);
}

export const useModalFocusTrap = useModalEnvironment;
