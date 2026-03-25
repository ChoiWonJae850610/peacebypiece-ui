"use client";

import { useEffect, type RefObject } from "react";

export function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("inert") && !element.getAttribute("aria-hidden"),
  );
}

export function useModalFocusTrap({
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
    const previousActive =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusTimer = window.setTimeout(() => {
      const focusables = getFocusableElements(dialog);
      (focusables[0] ?? dialog).focus();
    }, 0);

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
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [open, dialogRef, onClose]);
}
