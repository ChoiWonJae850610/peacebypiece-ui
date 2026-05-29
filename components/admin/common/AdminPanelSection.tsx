import type { ReactNode } from "react";

import { ADMIN_SURFACE_PANEL_CLASS } from "@/components/admin/common/adminSemanticClassNames";

type AdminPanelSectionProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  headerClassName?: string;
  headerMinClassName?: string;
  contentClassName?: string;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function AdminPanelSection({
  eyebrow,
  title,
  description,
  meta,
  children,
  footer,
  className,
  headerClassName,
  headerMinClassName = "min-h-[104px]",
  contentClassName,
}: AdminPanelSectionProps) {
  return (
    <article
      className={joinClassNames(
        ADMIN_SURFACE_PANEL_CLASS,
        "flex min-h-fit touch-pan-y flex-col overflow-visible overscroll-auto 2xl:min-h-0 2xl:overflow-hidden",
        className,
      )}
    >
      <div
        className={joinClassNames(
          "flex shrink-0 items-start justify-between gap-3 border-b border-[var(--pbp-border)] pb-4",
          headerMinClassName,
          headerClassName,
        )}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] pbp-text-subtle">
              {eyebrow}
            </p>
          ) : null}
          <h3 className={joinClassNames("font-semibold pbp-text-primary", eyebrow ? "mt-2 text-lg" : "text-base")}>
            {title}
          </h3>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 pbp-text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {meta ? <div className="shrink-0 text-xs font-semibold pbp-text-subtle">{meta}</div> : null}
      </div>

      <div className={joinClassNames("min-h-fit 2xl:min-h-0 2xl:flex-1", contentClassName)}>
        {children}
      </div>

      {footer ? <div className="shrink-0">{footer}</div> : null}
    </article>
  );
}
