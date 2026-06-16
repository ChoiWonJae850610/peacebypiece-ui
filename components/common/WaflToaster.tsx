"use client";

import { Toaster } from "sonner";

export default function WaflToaster() {
  return (
    <Toaster
      position="bottom-center"
      gap={10}
      offset={28}
      toastOptions={{
        classNames: {
          toast: "pbp-toast-host border-0 bg-transparent p-0 shadow-none",
          title: "text-sm font-semibold leading-5",
          description: "text-xs text-[var(--pbp-text-muted)]",
          actionButton:
            "rounded-full bg-[var(--pbp-brand-primary)] px-3 py-1 text-xs font-semibold text-white",
          cancelButton:
            "rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--pbp-text-secondary)]",
        },
      }}
    />
  );
}
