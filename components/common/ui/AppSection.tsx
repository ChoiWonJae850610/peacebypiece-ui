import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import AppCard, { type AppCardPadding, type AppCardVariant } from "./AppCard";

export type AppSectionVariant = AppCardVariant;
export type AppSectionPadding = AppCardPadding;

type AppSectionProps = HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: AppSectionVariant;
  padding?: AppSectionPadding;
  cardClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export default function AppSection({
  title,
  description,
  action,
  children,
  className,
  variant = "surface",
  padding = "lg",
  cardClassName,
  headerClassName,
  bodyClassName,
  ...props
}: AppSectionProps) {
  return (
    <section className={cn("min-w-0", className)} {...props}>
      <AppCard className={cardClassName} variant={variant} padding={padding}>
        {title || description || action ? (
          <div className={cn("mb-4 flex min-w-0 items-start justify-between gap-3", headerClassName)}>
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
