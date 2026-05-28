"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ToastTone = "info" | "success" | "warning" | "danger";

type ToastMessageProps = {
  message: string | null;
  tone?: ToastTone;
};

function showToast(message: string, tone: ToastTone) {
  if (tone === "success") {
    toast.success(message);
    return;
  }

  if (tone === "warning") {
    toast.warning(message);
    return;
  }

  if (tone === "danger") {
    toast.error(message);
    return;
  }

  toast(message);
}

export default function ToastMessage({ message, tone = "info" }: ToastMessageProps) {
  const lastShownMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      lastShownMessageRef.current = null;
      return;
    }

    const toastKey = `${tone}:${message}`;
    if (lastShownMessageRef.current === toastKey) return;
    lastShownMessageRef.current = toastKey;
    showToast(message, tone);
  }, [message, tone]);

  return null;
}
