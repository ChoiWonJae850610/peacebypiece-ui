"use client";

import { useEffect, useRef } from "react";

import {
  showWaflLoadingToast,
  showWaflToast,
  type WaflToastOptions,
  type WaflToastTone,
} from "@/components/common/ui";

export type ToastTone = WaflToastTone;

export type ToastMessageProps = {
  message: string | null;
  tone?: ToastTone;
  eventKey?: string | number | null;
  toastId?: string | number | null;
};

export type { WaflToastOptions };
export { showWaflLoadingToast, showWaflToast };

export default function ToastMessage({ message, tone = "info", eventKey = null, toastId = null }: ToastMessageProps) {
  const lastShownMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      lastShownMessageRef.current = null;
      return;
    }

    const toastKey = `${eventKey ?? "static"}:${tone}:${message}`;
    if (lastShownMessageRef.current === toastKey) return;
    lastShownMessageRef.current = toastKey;
    showWaflToast({ message, tone, id: toastId ?? undefined });
  }, [eventKey, message, toastId, tone]);

  return null;
}
