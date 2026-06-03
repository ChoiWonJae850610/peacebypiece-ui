"use client";

import { AlertTriangle, CheckCircle2, Info, LoaderCircle, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export type WaflToastTone = "info" | "success" | "warning" | "danger" | "loading";

export type WaflToastOptions = {
  message: string;
  tone?: WaflToastTone;
  duration?: number;
  id?: string | number;
};

export type WaflToastContentProps = {
  message: string;
  tone?: WaflToastTone;
  className?: string;
};

type WaflToastToneConfig = {
  icon: LucideIcon;
  duration: number;
  role: "status" | "alert";
  ariaLive: "polite" | "assertive";
};

const toastToneConfig: Record<WaflToastTone, WaflToastToneConfig> = {
  info: {
    icon: Info,
    duration: 2600,
    role: "status",
    ariaLive: "polite",
  },
  success: {
    icon: CheckCircle2,
    duration: 2800,
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    icon: AlertTriangle,
    duration: 3600,
    role: "status",
    ariaLive: "polite",
  },
  danger: {
    icon: XCircle,
    duration: 4600,
    role: "alert",
    ariaLive: "assertive",
  },
  loading: {
    icon: LoaderCircle,
    duration: 1800,
    role: "status",
    ariaLive: "polite",
  },
};

export const waflToastDefaultDurationByTone: Record<WaflToastTone, number> = {
  info: toastToneConfig.info.duration,
  success: toastToneConfig.success.duration,
  warning: toastToneConfig.warning.duration,
  danger: toastToneConfig.danger.duration,
  loading: toastToneConfig.loading.duration,
};

export function WaflToastContent({ message, tone = "info", className }: WaflToastContentProps) {
  const config = toastToneConfig[tone];
  const ToastIcon = config.icon;

  return (
    <div
      className={cn("pbp-toast pbp-toast--floating", className)}
      data-tone={tone}
      role={config.role}
      aria-live={config.ariaLive}
    >
      <span className="pbp-toast__mark" aria-hidden="true">
        <ToastIcon className={tone === "loading" ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
      </span>
      <span className="pbp-toast__message min-w-0 flex-1 text-sm font-semibold leading-5">{message}</span>
    </div>
  );
}

export function WaflProcessingToast({ message, className }: { message: string; className?: string }) {
  return <WaflToastContent message={message} tone="loading" className={cn("pbp-toast--processing", className)} />;
}

export function showWaflToast({ message, tone = "info", duration, id }: WaflToastOptions) {
  if (!message.trim()) return;

  toast.custom(() => <WaflToastContent message={message} tone={tone} />, {
    id,
    duration: duration ?? waflToastDefaultDurationByTone[tone],
  });
}

export function showWaflLoadingToast(message = "화면을 여는 중입니다.") {
  showWaflToast({ message, tone: "loading", duration: waflToastDefaultDurationByTone.loading });
}
