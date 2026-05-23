"use client";

type ToastTone = "info" | "success" | "warning" | "danger";

type ToastMessageProps = {
  message: string | null;
  tone?: ToastTone;
};

export default function ToastMessage({ message, tone = "info" }: ToastMessageProps) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[95] flex justify-center px-4 md:bottom-6 md:justify-end md:px-8">
      <div className="pbp-toast inline-flex min-h-11 max-w-[min(92vw,420px)] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold leading-5" data-tone={tone} role="status" aria-live="polite">
        <span className="pbp-toast__mark" aria-hidden="true" />
        <span className="min-w-0 break-keep text-left">{message}</span>
      </div>
    </div>
  );
}
