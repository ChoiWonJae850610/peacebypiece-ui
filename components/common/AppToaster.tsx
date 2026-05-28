"use client";

import { Toaster } from "sonner";

export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] shadow-[var(--pbp-shadow-elevated)]",
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
