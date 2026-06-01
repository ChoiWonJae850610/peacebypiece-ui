"use client";

import { useEffect, useRef, type ReactNode } from "react";
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

const toneLabel: Record<ToastTone, string> = {
  info: "안내",
  success: "완료",
  warning: "주의",
  danger: "오류",
  loading: "처리중",
};

const toneMark: Record<ToastTone, ReactNode> = {
  info: null,
  success: null,
  warning: null,
  danger: null,
  loading: <span className="pbp-toast__spinner" aria-hidden="true" />,
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
      {tone === "loading" ? (
        <span className="pbp-toast__loading-mark" aria-hidden="true">
          {toneMark.loading}
        </span>
      ) : (
        <span className="pbp-toast__mark" aria-hidden="true">
          {toneMark[tone]}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold leading-4 tracking-[0.12em] pbp-toast__eyebrow">{toneLabel[tone]}</span>
        <span className="mt-0.5 block text-sm font-semibold leading-5 pbp-toast__message">{message}</span>
      </span>
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
