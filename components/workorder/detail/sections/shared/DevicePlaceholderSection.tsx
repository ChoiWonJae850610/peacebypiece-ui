import { WaflSurface } from "@/components/common/ui";

export default function DevicePlaceholderSection({
  title,
  description,
  compact = false,
}: {
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <WaflSurface
      as="section"
      component="device-placeholder-section"
      shape="control"
      tone="empty"
      className={compact ? "p-3" : "p-4"}
    >
      <div className="text-sm font-medium text-[var(--pbp-text-primary)]">{title}</div>
      {description ? <div className="mt-2 text-xs text-[var(--pbp-text-muted)]">{description}</div> : null}
    </WaflSurface>
  );
}
