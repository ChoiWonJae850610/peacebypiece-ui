import type { ReactNode } from "react";

export type WaflSaveStatusValue = "idle" | "dirty" | "saving" | "saved" | "error";

type WaflSaveStatusProps = {
  status: WaflSaveStatusValue;
  message?: ReactNode;
  savedAt?: string | null;
  className?: string;
  align?: "left" | "center" | "right";
  showDirty?: boolean;
};

const DEFAULT_MESSAGE: Record<Exclude<WaflSaveStatusValue, "idle">, string> = {
  dirty: "저장되지 않은 변경사항이 있습니다.",
  saving: "저장 중입니다...",
  saved: "저장되었습니다.",
  error: "저장하지 못했습니다.",
};

export default function WaflSaveStatus({
  status,
  message,
  savedAt,
  className = "",
  align = "right",
  showDirty = true,
}: WaflSaveStatusProps) {
  if (status === "idle" || (status === "dirty" && !showDirty)) return null;

  const toneClass = status === "error"
    ? "text-[var(--pbp-danger-text)]"
    : status === "saving" || status === "dirty"
      ? "text-[var(--pbp-text-muted)]"
      : "text-[var(--pbp-text-subtle)]";
  const alignClass = align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right";
  const label = message ?? DEFAULT_MESSAGE[status];
  void savedAt;

  return (
    <p
      data-wafl-component="save-status"
      data-save-status={status}
      className={`min-h-5 text-xs font-medium leading-5 ${toneClass} ${alignClass} ${className}`.trim()}
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {label}
    </p>
  );
}
