import type { ReactNode } from "react";

type AdminActionBarProps = {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  actionsClassName?: string;
};

export default function AdminActionBar({
  title,
  description,
  children,
  className = "",
  actionsClassName = "",
}: AdminActionBarProps) {
  return (
    <div className={["flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:justify-between", className].filter(Boolean).join(" ")}>
      {title || description ? (
        <div className="min-w-0">
          {title ? <h2 className="text-base font-semibold tracking-tight text-[var(--pbp-text-primary)]">{title}</h2> : null}
          {description ? <p className="mt-1 text-xs font-medium text-[var(--pbp-text-muted)]">{description}</p> : null}
        </div>
      ) : <span />}
      {children ? (
        <div
          className={[
            "flex flex-wrap items-center gap-1.5",
            actionsClassName,
          ].filter(Boolean).join(" ")}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
