import type { ReactNode } from "react";

export type AdminSectionDensity = "default" | "compact";

type AdminCardProps = {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div" | "header";
};

const cardBaseClassName = "min-w-0 rounded-[28px] pbp-admin-card";

export function AdminCard({ children, className = "", as: Component = "section" }: AdminCardProps) {
  return <Component className={`${cardBaseClassName} ${className}`.trim()}>{children}</Component>;
}

type AdminSectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AdminSectionHeader({ title, description, eyebrow, actions, className = "" }: AdminSectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`.trim()}>
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">{eyebrow}</p> : null}
        <h2 className="text-lg font-semibold tracking-tight pbp-text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 pbp-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
    </div>
  );
}

type AdminSectionProps = AdminSectionHeaderProps & {
  children: ReactNode;
  density?: AdminSectionDensity;
  bodyClassName?: string;
  headerClassName?: string;
};

const sectionPaddingClassNames: Record<AdminSectionDensity, string> = {
  default: "p-4",
  compact: "p-3.5",
};

export function AdminSection({
  title,
  description,
  eyebrow,
  actions,
  children,
  density = "default",
  className = "",
  bodyClassName = "mt-3",
  headerClassName,
}: AdminSectionProps) {
  return (
    <AdminCard className={`${sectionPaddingClassNames[density]} ${className}`.trim()}>
      <AdminSectionHeader
        title={title}
        description={description}
        eyebrow={eyebrow}
        actions={actions}
        className={headerClassName}
      />
      <div className={bodyClassName}>{children}</div>
    </AdminCard>
  );
}
