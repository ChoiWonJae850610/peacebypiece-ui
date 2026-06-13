import type { ReactNode } from "react";

export type DetailSectionGroupProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  summary?: string;
  children: ReactNode;
};

export default function DetailSectionGroup({
  eyebrow,
  title,
  description,
  summary,
  children,
}: DetailSectionGroupProps) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              {eyebrow}
            </div>
          ) : null}
          <h3
            className={
              eyebrow
                ? "mt-1 text-sm font-semibold leading-5 text-stone-900"
                : "text-sm font-semibold leading-5 text-stone-900"
            }
          >
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 max-w-[44rem] text-[11px] leading-4 text-stone-500">
              {description}
            </p>
          ) : null}
        </div>
        {summary ? (
          <div className="shrink-0 pb-0.5 text-right text-[11px] font-medium leading-4 text-stone-500 md:text-xs">
            {summary}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}
