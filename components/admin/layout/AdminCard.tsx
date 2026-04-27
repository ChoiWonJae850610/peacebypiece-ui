import Link from "next/link";
import type { ReactNode } from "react";

type AdminCardProps = {
  children: ReactNode;
  className?: string;
};

export function AdminCard({ children, className = "" }: AdminCardProps) {
  return <section className={`rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

type AdminStatCardProps = {
  label: string;
  value: string;
  description?: string;
  href?: string | null;
  accent?: string;
};

export function AdminStatCard({ label, value, description, href, accent = "bg-stone-100 text-stone-700" }: AdminStatCardProps) {
  const content = (
    <AdminCard className="h-full transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">{value}</p>
        </div>
        <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ${accent}`}>요약</span>
      </div>
      {description ? <p className="mt-4 text-xs leading-5 text-stone-500">{description}</p> : null}
    </AdminCard>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block h-full">
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

export function AdminActionTile({ label, description, icon, href, statusLabel = "이동" }: AdminActionTileProps) {
  const content = (
    <div className="group flex min-h-[112px] items-start gap-4 rounded-3xl border border-stone-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-sm">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-lg text-stone-700">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-950">{label}</h3>
          <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">{href ? statusLabel : "준비중"}</span>
        </div>
        <p className="mt-2 text-xs leading-5 text-stone-500">{description}</p>
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
