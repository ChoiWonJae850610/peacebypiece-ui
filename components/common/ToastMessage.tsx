"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type ToastTone = "info" | "success" | "warning" | "danger" | "loading";

export type ToastMessageProps = {
  message: string | null;
  tone?: ToastTone;
  eventKey?: string | number | null;
};

type WaflToastContentProps = {
  message: string;
  tone: ToastTone;
};

export type WaflToastOptions = {
  message: string;
  tone?: ToastTone;
  duration?: number;
};

const toneIcon: Record<ToastTone, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  danger: "❌",
  loading: "⏳",
};

const defaultDurationByTone: Record<ToastTone, number> = {
  info: 2600,
  success: 2800,
  warning: 3400,
  danger: 4400,
  loading: 1800,
};

function WaflToastContent({ message, tone }: WaflToastContentProps) {
  const isAlert = tone === "danger";

  return (
    <div className="pbp-toast pbp-toast--floating" data-tone={tone} role={isAlert ? "alert" : "status"} aria-live={isAlert ? "assertive" : "polite"}>
      <span className="pbp-toast__mark" aria-hidden="true">
        {toneIcon[tone]}
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold leading-5 pbp-toast__message">{message}</span>
    </div>
  );
}

export function showWaflToast({ message, tone = "info", duration }: WaflToastOptions) {
  if (!message.trim()) return;

  toast.custom(() => <WaflToastContent message={message} tone={tone} />, {
    duration: duration ?? defaultDurationByTone[tone],
  });
}

export function showWaflLoadingToast(message = "화면을 여는 중입니다.") {
  showWaflToast({ message, tone: "loading", duration: defaultDurationByTone.loading });
}

export default function ToastMessage({ message, tone = "info", eventKey = null }: ToastMessageProps) {
  const lastShownMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) {
      lastShownMessageRef.current = null;
      return;
    }

    const toastKey = `${eventKey ?? "static"}:${tone}:${message}`;
    if (lastShownMessageRef.current === toastKey) return;
    lastShownMessageRef.current = toastKey;
    showWaflToast({ message, tone });
  }, [eventKey, message, tone]);

  return null;
}
