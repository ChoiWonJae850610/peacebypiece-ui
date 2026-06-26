"use client";

import Link from "next/link";
import { showWaflLoadingToast } from "@/components/common/ToastMessage";
import { AdminSection } from "@/components/admin/common/AdminSection";
import { getWaflButtonClassName, WaflSurface } from "@/components/common/ui";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import {
  ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES,
  getVisibleAdminHomeMemberCards,
  getVisibleAdminHomePrimaryCards,
  type AdminWorkspaceCard,
  type AdminWorkspaceCardStatus,
  type AdminWorkspaceRole,
} from "@/lib/admin/adminWorkspaceCards";
import type { MemberPermissionCode } from "@/lib/permissions";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function getStatusTone(status: AdminWorkspaceCardStatus) {
  return status === "planned" ? "warning" : "neutral";
}

function useWorkspaceCardText() {
  const t = useAdminTranslation();

  return (item: AdminWorkspaceCard) => ({
    label: t(`adminConsole.links.${item.id}.label`, item.label),
    description: t(
      `adminConsole.links.${item.id}.description`,
      item.description,
    ),
    statusLabel: t(`adminConsole.statuses.${item.status}`, item.statusLabel),
    openLabel: t("adminConsole.actions.open", "화면 열기"),
    preparingLabel: t("adminConsole.statuses.planned", "준비중"),
  });
}

function WorkspaceCardIcon({ index }: { index: number }) {
  return (
    <span
      data-wafl-component="workspace-card-index"
      aria-hidden="true"
      className="inline-flex h-9 w-9 items-center justify-center wafl-shape-icon bg-[var(--pbp-surface-soft)] text-xs font-semibold pbp-text-primary ring-1 ring-[var(--pbp-border)]"
    >
      {String(index + 1).padStart(2, "0")}
    </span>
  );
}

function AdminWorkspaceCardView({
  item,
  index,
}: {
  item: AdminWorkspaceCard;
  index: number;
}) {
  const translateItem = useWorkspaceCardText();
  const text = translateItem(item);
  const content = (
    <WaflSurface
      as="article"
      component="admin-workspace-card"
      className="group flex h-full min-h-[112px] overflow-hidden bg-[var(--pbp-surface-base)] p-0 transition hover:border-[var(--pbp-border-strong)]"
    >
      <div className="relative flex h-full min-w-0 flex-1 flex-col justify-between gap-2.5 p-3.5">
        <div className="relative min-w-0">
          <div className="flex items-start justify-between gap-4">
            <WorkspaceCardIcon index={index} />
            {item.status === "planned" ? (
              <AdminStatusBadge tone={getStatusTone(item.status)}>미완성</AdminStatusBadge>
            ) : null}
          </div>

          <h2 className="mt-2.5 text-sm font-semibold pbp-text-primary">
            {text.label}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-5 pbp-text-muted">
            {text.description}
          </p>
        </div>

        <div className="relative flex items-center justify-between gap-3">
          {item.href ? (
            <span data-wafl-component="workspace-card-open-button" data-wafl-foundation="control" className={getWaflButtonClassName({ size: "sm", variant: "secondary", className: "pointer-events-none px-4" })}>
              {text.openLabel}
            </span>
          ) : (
            <span data-wafl-component="workspace-card-open-button" data-wafl-foundation="control" className={getWaflButtonClassName({ size: "sm", variant: "secondary", className: "pointer-events-none px-4" })}>
              {text.preparingLabel}
            </span>
          )}
          <span
            className="text-lg transition group-hover:translate-x-1 pbp-text-muted"
            aria-hidden="true"
          >
            →
          </span>
        </div>
      </div>
    </WaflSurface>
  );

  if (!item.href) return content;

  return (
    <Link
      href={item.href}
      className="block h-full min-w-0"
      prefetch={false}
      onClick={() =>
        showWaflLoadingToast(`${text.label} 화면을 여는 중입니다.`)
      }
    >
      {content}
    </Link>
  );
}

type AdminConsoleSectionsProps = {
  permissionCodes?: readonly MemberPermissionCode[] | null;
  role?: AdminWorkspaceRole | null;
};

export default function AdminConsoleSections({
  permissionCodes,
  role,
}: AdminConsoleSectionsProps) {
  const t = useAdminTranslation();
  const cardAccessInput = {
    permissionCodes:
      permissionCodes ?? ADMIN_WORKSPACE_PREVIEW_PERMISSION_CODES,
    role,
  };
  const primaryCards = [
    ...getVisibleAdminHomePrimaryCards(cardAccessInput),
    ...(role === "member"
      ? getVisibleAdminHomeMemberCards(cardAccessInput)
      : []),
  ];

  return (
    <AdminSection
      eyebrow={t("adminConsole.managementCards.eyebrow", "Workspace")}
      title={t("adminConsole.managementCards.title", "업무 바로가기")}
      description={t(
        "adminConsole.managementCards.description",
        "자주 사용하는 업무와 관리 화면으로 이동합니다.",
      )}
      actions={null}
      className="overflow-hidden p-4 sm:p-5"
      bodyClassName="mt-4"
      headerClassName="max-w-4xl"
    >
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {primaryCards.map((item, index) => (
          <AdminWorkspaceCardView key={item.id} item={item} index={index} />
        ))}
      </div>
    </AdminSection>
  );
}
