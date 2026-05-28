import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import AppCard from "./AppCard";

type AppSectionProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  cardClassName?: string;
  bodyClassName?: string;
};

export default function AppSection({
  title,
  description,
  action,
  children,
  className,
  cardClassName,
  bodyClassName,
  ...props
}: AppSectionProps) {
  return (
    <section className={cn("min-w-0", className)} {...props}>
      <AppCard className={cardClassName} padding="lg">
        {title || description || action ? (
          <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? <h3 className="text-sm font-semibold pbp-text-primary">{title}</h3> : null}
              {description ? <p className="mt-1 text-xs leading-5 pbp-text-muted">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        ) : null}
        <div className={cn("min-w-0", bodyClassName)}>{children}</div>
      </AppCard>
    </section>
  );
}
