"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { adminSurfaceVariantClassNames, joinAdminClassNames, type AdminSurfaceVariant } from "@/components/admin/common/adminComponentVariants";
import { AppBadge, AppCard, type AppCardVariant } from "@/components/common/ui";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminCardProps = {
  children: ReactNode;
  className?: string;
  variant?: AdminSurfaceVariant;
};

const adminCardAppVariantMap: Record<AdminSurfaceVariant, AppCardVariant> = {
  base: "surface",
  soft: "subtle",
  selected: "surface",
  warning: "surface",
  danger: "surface",
};

export function AdminCard({ children, className = "", variant = "base" }: AdminCardProps) {
  const variantClassName = variant === "base" ? "pbp-admin-card" : adminSurfaceVariantClassNames[variant];

  return (
    <AppCard
      as="section"
      variant={adminCardAppVariantMap[variant]}
      padding="lg"
      className={joinAdminClassNames(variantClassName, className)}
    >
      {children}
    </AppCard>
  );
}

type AdminStatCardProps = {
  label: string;
  value: string;
  description?: string;
  href?: string | null;
  accent?: string;
};

export function AdminStatCard({ label, value, description, href, accent = "pbp-admin-soft-badge" }: AdminStatCardProps) {
  const t = useAdminTranslation();
  const interactiveClassName = href ? "h-full pbp-admin-card-interactive" : "h-full";

  const content = (
    <AdminCard className={interactiveClassName}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight pbp-text-primary">{value}</p>
        </div>
        <AppBadge size="sm" className={accent}>{t("common.summary", "요약")}</AppBadge>
      </div>
      {description ? <p className="mt-4 text-xs leading-5 pbp-text-muted">{description}</p> : null}
    </AdminCard>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block h-full min-w-0">
      {content}
    </Link>
  );
}

type AdminActionTileProps = {
  label: string;
  description: string;
  icon: string;
  href?: string | null;
  statusLabel?: string;
};

export function AdminActionTile({ label, description, icon, href, statusLabel }: AdminActionTileProps) {
  const t = useAdminTranslation();
  const resolvedStatusLabel = statusLabel ?? t("common.move", "이동");
  const content = (
    <div className="group flex min-h-[112px] items-start gap-4 wafl-shape-surface p-4 text-left transition hover:-translate-y-0.5 pbp-admin-action-tile">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center wafl-shape-icon text-lg pbp-admin-icon-tile">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold pbp-text-primary">{label}</h3>
          <AppBadge size="xs" className="pbp-admin-soft-badge">{href ? resolvedStatusLabel : t("common.preparing", "준비중")}</AppBadge>
        </div>
        <p className="mt-2 text-xs leading-5 pbp-text-muted">{description}</p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block min-w-0">
      {content}
    </Link>
  );
}
