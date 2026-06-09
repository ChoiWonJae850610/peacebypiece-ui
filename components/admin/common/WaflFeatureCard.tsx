"use client";

import type { ReactNode } from "react";

type WaflFeatureCardProps = {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  details?: readonly ReactNode[];
  active?: boolean;
  leadingDotClassName?: string;
  onClick?: () => void;
  className?: string;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function WaflFeatureCardInner({
  title,
  description,
  badge,
  details,
  leadingDotClassName,
}: Pick<WaflFeatureCardProps, "title" | "description" | "badge" | "details" | "leadingDotClassName">) {
  return (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className={joinClassNames("h-2.5 w-2.5 shrink-0 rounded-full", leadingDotClassName)} />
            <span className="text-base font-semibold text-[var(--pbp-text-primary)]">{title}</span>
          </span>
          {description ? (
            <span className="mt-2 block text-xs leading-5 text-[var(--pbp-text-muted)]">{description}</span>
          ) : null}
        </span>
        {badge ? <span className="shrink-0">{badge}</span> : null}
      </span>
      {details && details.length > 0 ? (
        <span className="mt-3 flex flex-wrap gap-1.5">
          {details.map((detail, index) => (
            <span
              key={index}
              className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--pbp-text-muted)]"
            >
              {detail}
            </span>
          ))}
        </span>
      ) : null}
    </>
  );
}

export default function WaflFeatureCard({
  title,
  description,
  badge,
  details = [],
  active = false,
  leadingDotClassName = "bg-[var(--pbp-brand-soft)]",
  onClick,
  className = "",
}: WaflFeatureCardProps) {
  const cardClassName = joinClassNames(
    "flex min-h-[132px] w-full min-w-0 flex-col justify-between rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-4 text-left shadow-[var(--pbp-shadow-card)] transition",
    onClick ? "hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-soft)]" : null,
    active ? "ring-2 ring-[var(--pbp-focus-ring)]/20" : null,
    className,
  );

  const content = (
    <WaflFeatureCardInner
      title={title}
      description={description}
      badge={badge}
      details={details}
      leadingDotClassName={leadingDotClassName}
    />
  );

  if (onClick) {
    return (
      <button type="button" data-wafl-component="feature-card" onClick={onClick} className={cardClassName}>
        {content}
      </button>
    );
  }

  return <article data-wafl-component="feature-card" className={cardClassName}>{content}</article>;
}
