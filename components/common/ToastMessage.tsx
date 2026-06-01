"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { toast } from "sonner";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastMessageProps = {
  message: string | null;
  tone?: ToastTone;
  eventKey?: string | number | null;
};

type WaflToastContentProps = {
  message: string;
  tone: ToastTone;
};

const toneLabel: Record<ToastTone, string> = {
  info: "안내",
  success: "완료",
  warning: "주의",
  danger: "오류",
};

const toneMark: Record<ToastTone, ReactNode> = {
  info: null,
  success: null,
  warning: null,
  danger: null,
};

function WaflToastContent({ message, tone }: WaflToastContentProps) {
  return (
    <div className="pbp-toast pbp-toast--floating" data-tone={tone} role={tone === "danger" ? "alert" : "status"} aria-live={tone === "danger" ? "assertive" : "polite"}>
      <span className="pbp-toast__mark" aria-hidden="true">
        {toneMark[tone]}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-bold leading-4 tracking-[0.12em] pbp-toast__eyebrow">{toneLabel[tone]}</span>
        <span className="mt-0.5 block text-sm font-semibold leading-5 pbp-toast__message">{message}</span>
      </span>
    </div>
  );
}

function showToast(message: string, tone: ToastTone) {
  toast.custom(() => <WaflToastContent message={message} tone={tone} />, {
    duration: tone === "danger" ? 4200 : 2800,
  });
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
    showToast(message, tone);
  }, [eventKey, message, tone]);

  return null;
}
