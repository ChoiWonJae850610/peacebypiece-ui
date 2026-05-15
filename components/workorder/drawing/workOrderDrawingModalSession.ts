"use client";

const DESIGN_DRAWING_MODAL_OPEN_STORAGE_KEY = "peacebypiece.workorder.designDrawingModalOpen";

export function readDesignDrawingModalOpenState() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DESIGN_DRAWING_MODAL_OPEN_STORAGE_KEY) === "true";
}

export function writeDesignDrawingModalOpenState(open: boolean) {
  if (typeof window === "undefined") return;
  if (open) {
    window.sessionStorage.setItem(DESIGN_DRAWING_MODAL_OPEN_STORAGE_KEY, "true");
    return;
  }
  window.sessionStorage.removeItem(DESIGN_DRAWING_MODAL_OPEN_STORAGE_KEY);
}
