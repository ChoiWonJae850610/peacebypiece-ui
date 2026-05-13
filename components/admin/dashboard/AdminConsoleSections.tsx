"use client";

import { AdminSection, AdminCard } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES,
  getVisibleAdminWorkspaceCards,
  type AdminWorkspaceCard,
  type AdminWorkspaceCardStatus,
} from "@/lib/admin/adminWorkspaceCards";
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

function AdminWorkspaceCardView({ item }: { item: AdminWorkspaceCard }) {
  const translateItem = useWorkspaceCardText();
  const text = translateItem(item);

  const content = (
    <AdminCard as="article" className="h-full p-3 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:p-3.5">
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone-950">{text.label}</h2>
            <AdminStatusBadge tone={getStatusTone(item.status)}>{text.statusLabel}</AdminStatusBadge>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-600">{text.description}</p>
        </div>

        {item.href ? (
          <AdminStatusBadge tone="primary" className="rounded-xl px-3 py-1.5 text-xs">
            {text.openLabel}
          </AdminStatusBadge>
        ) : (
          <AdminStatusBadge tone="neutral" className="rounded-xl px-3 py-1.5 text-xs text-stone-400">
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
  const managementCards = getVisibleAdminWorkspaceCards({ permissionCodes: ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES });
  return (
    <>
      <AdminSection title={t("adminConsole.managementCards.title", "운영 관리")}>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {managementCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </AdminSection>
    </>
  );
}
