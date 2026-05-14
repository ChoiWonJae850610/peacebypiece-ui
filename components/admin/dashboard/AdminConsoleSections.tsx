"use client";

import { AdminSection, AdminCard } from "@/components/admin/common/AdminSection";
import { ADMIN_SURFACE_ITEM_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES,
  getVisibleAdminWorkspaceManagementCards,
  type AdminWorkspaceCard,
  type AdminWorkspaceCardStatus,
} from "@/lib/admin/adminWorkspaceCards";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

const ADMIN_CONSOLE_VISIBLE_CARD_IDS = new Set(["partners", "files", "stats", "member-management"]);

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

function AdminWorkspaceCardView({ item }: { item: AdminWorkspaceCard }) {
  const translateItem = useWorkspaceCardText();
  const text = translateItem(item);

  const content = (
    <AdminCard
      as="article"
      className={`${ADMIN_SURFACE_ITEM_CLASS} flex h-full min-h-[150px] p-5 transition hover:-translate-y-0.5 hover:border-[var(--pbp-border-strong)] hover:shadow-md sm:min-h-[162px] sm:p-6 lg:min-h-[174px]`}
    >
      <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight pbp-text-primary">{text.label}</h2>
            <AdminStatusBadge tone={getStatusTone(item.status)}>{text.statusLabel}</AdminStatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 pbp-text-muted">{text.description}</p>
        </div>

        {item.href ? (
          <AdminStatusBadge tone="primary" className="w-fit rounded-2xl px-3.5 py-1.5 text-xs">
            {text.openLabel}
          </AdminStatusBadge>
        ) : (
          <AdminStatusBadge tone="neutral" className="w-fit rounded-2xl px-3.5 py-1.5 text-xs pbp-text-subtle">
            {text.preparingLabel}
          </AdminStatusBadge>
        )}
      </div>
    </AdminCard>
  );

  if (!item.href) return content;

  return (
    <a href={item.href} className="block h-full min-w-0">
      {content}
    </a>
  );
}

export default function AdminConsoleSections() {
  const t = useAdminTranslation();
  const managementCards = getVisibleAdminWorkspaceManagementCards({ permissionCodes: ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES }).filter((item) =>
    ADMIN_CONSOLE_VISIBLE_CARD_IDS.has(item.id),
  );

  return (
    <>
      <AdminSection title={t("adminConsole.managementCards.title", "운영 관리")} bodyClassName="mt-4">
        <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {managementCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </AdminSection>
    </>
  );
}
