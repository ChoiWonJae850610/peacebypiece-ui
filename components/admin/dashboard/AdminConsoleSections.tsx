"use client";

import Link from "next/link";
import { AdminSection, AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES,
  getVisibleAdminHomePrimaryCards,
  type AdminWorkspaceCard,
  type AdminWorkspaceCardStatus,
} from "@/lib/admin/adminWorkspaceCards";
import type { MemberPermissionCode } from "@/lib/permissions";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function getStatusTone(status: AdminWorkspaceCardStatus) {
  if (status === "available") return "success";
  return "neutral";
}

function useWorkspaceCardText() {
  const t = useAdminTranslation();

  return (item: AdminWorkspaceCard) => ({
    label: t(`adminConsole.links.${item.id}.label`, item.label),
    description: t(`adminConsole.links.${item.id}.description`, item.description),
    statusLabel: t(`adminConsole.statuses.${item.status}`, item.statusLabel),
    openLabel: t("adminConsole.actions.open", "화면 열기"),
    preparingLabel: t("adminConsole.statuses.planned", "준비중"),
  });
}

function WorkspaceCardIcon({ index, featured }: { index: number; featured: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={featured
        ? "inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/20 bg-white/10 text-sm font-semibold text-white"
        : "inline-flex h-11 w-11 items-center justify-center rounded-[18px] bg-[var(--pbp-surface-soft)] text-sm font-semibold pbp-text-primary ring-1 ring-[var(--pbp-border)]"
      }
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

function AdminWorkspaceCardView({ item, index }: { item: AdminWorkspaceCard; index: number }) {
  const translateItem = useWorkspaceCardText();
  const text = translateItem(item);
  const featured = item.id === "workorder-entry";

  const content = (
    <AdminCard
      as="article"
      className={`${featured ? "border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] text-[var(--pbp-text-inverse)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface-base)]"} group flex h-full min-h-[188px] overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-[var(--pbp-shadow-elevated)] ${featured ? "xl:col-span-2" : ""}`.trim()}
    >
      <div className="relative flex h-full min-w-0 flex-1 flex-col justify-between gap-6 p-5 sm:p-6">
        {featured ? (
          <>
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          </>
        ) : null}
        <div className="relative min-w-0">
          <div className="flex items-start justify-between gap-4">
            <WorkspaceCardIcon index={index} featured={featured} />
            <AdminStatusBadge tone={featured ? "inverse" : getStatusTone(item.status)}>
              {text.statusLabel}
            </AdminStatusBadge>
          </div>

          <h2 className={`mt-6 text-xl font-semibold tracking-[-0.03em] ${featured ? "text-white" : "pbp-text-primary"}`}>
            {text.label}
          </h2>
          <p className={`mt-3 text-sm leading-6 ${featured ? "text-white/68" : "pbp-text-muted"}`}>
            {text.description}
          </p>
        </div>

        <div className="relative flex items-center justify-between gap-3">
          {item.href ? (
            <span className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold ${featured ? "border-white/20 bg-white text-[var(--pbp-brand-primary)]" : "pbp-action-secondary"}`}>
              {text.openLabel}
            </span>
          ) : (
            <span className="inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold pbp-action-secondary">
              {text.preparingLabel}
            </span>
          )}
          <span className={`text-lg transition group-hover:translate-x-1 ${featured ? "text-white/70" : "pbp-text-muted"}`} aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </AdminCard>
  );

  if (!item.href) return content;

  return (
    <Link href={item.href} className={`block h-full min-w-0 ${featured ? "xl:col-span-2" : ""}`} prefetch={false}>
      {content}
    </Link>
  );
}

type AdminConsoleSectionsProps = {
  permissionCodes?: readonly MemberPermissionCode[] | null;
};

export default function AdminConsoleSections({ permissionCodes }: AdminConsoleSectionsProps) {
  const t = useAdminTranslation();
  const cardAccessInput = { permissionCodes: permissionCodes ?? ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES };
  const primaryCards = getVisibleAdminHomePrimaryCards(cardAccessInput);

  return (
    <AdminSection
      eyebrow={t("adminConsole.managementCards.eyebrow", "Workspace")}
      title={t("adminConsole.managementCards.title", "업무 바로가기")}
      description={t(
        "adminConsole.managementCards.description",
        "고객사 관리자가 자주 사용하는 화면을 화면 단위 카드로 정리했습니다.",
      )}
      actions={
        <AdminStatusBadge tone="neutral">
          {t("adminConsole.managementCards.cardCount", "{count}개 화면").replace("{count}", String(primaryCards.length))}
        </AdminStatusBadge>
      }
      className="overflow-hidden p-5 sm:p-6"
      bodyClassName="mt-5"
      headerClassName="max-w-4xl"
    >
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {primaryCards.map((item, index) => (
          <AdminWorkspaceCardView key={item.id} item={item} index={index} />
        ))}
      </div>
    </AdminSection>
  );
}
