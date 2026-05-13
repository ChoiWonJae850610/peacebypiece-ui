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
    <AdminCard
      as="article"
      className="flex h-full min-h-[160px] p-5 transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md sm:min-h-[190px] sm:p-6 lg:min-h-[220px] lg:p-7"
    >
      <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <h2 className="text-base font-semibold tracking-tight text-stone-950 sm:text-lg">{text.label}</h2>
            <AdminStatusBadge tone={getStatusTone(item.status)}>{text.statusLabel}</AdminStatusBadge>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{text.description}</p>
        </div>

        {item.href ? (
          <AdminStatusBadge tone="primary" className="w-fit rounded-2xl px-4 py-2 text-sm">
            {text.openLabel}
          </AdminStatusBadge>
        ) : (
          <AdminStatusBadge tone="neutral" className="w-fit rounded-2xl px-4 py-2 text-sm text-stone-400">
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
      <AdminSection
        title={t("adminConsole.managementCards.title", "운영 관리")}
        className="flex min-h-[calc(100vh-260px)] flex-col sm:min-h-[calc(100vh-280px)]"
        bodyClassName="mt-5 flex flex-1"
      >
        <div className="grid flex-1 auto-rows-fr gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {managementCards.map((item) => (
            <AdminWorkspaceCardView key={item.id} item={item} />
          ))}
        </div>
      </AdminSection>
    </>
  );
}
