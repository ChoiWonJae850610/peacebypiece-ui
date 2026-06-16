import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import WaflCard, { type WaflCardPadding, type WaflCardVariant } from "./WaflCard";

export type WaflSectionVariant = WaflCardVariant;
export type WaflSectionPadding = WaflCardPadding;

type WaflSectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  variant?: WaflSectionVariant;
  padding?: WaflSectionPadding;
  cardClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export default function WaflSection({
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
}: WaflSectionProps) {
  return (
    <section data-wafl-component="section" className={cn("min-w-0", className)} {...props}>
      <WaflCard className={cardClassName} variant={variant} padding={padding}>
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
      </WaflCard>
    </section>
  );
}
