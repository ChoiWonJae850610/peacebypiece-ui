import { Ban, Copy, type LucideIcon } from "lucide-react";

import {
  AdminStatusBadge,
  type AdminStatusBadgeTone,
} from "@/components/admin/common/AdminStatusBadge";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export type MemberInvitationSortKey = "status" | "expires" | "createdAt";

export type PendingMemberInvitationRow = {
  id: string;
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
  status: InvitationRecord["status"];
};

type BuildMemberInvitationTableColumnsOptions = {
  t: ReturnType<typeof useAdminTranslation>;
  revokingInviteId: string | null;
  onCopyInviteLink: (inviteUrl: string) => void | Promise<void>;
  onCancelInvitation: (
    invitation: PendingMemberInvitationRow,
  ) => void | Promise<void>;
};

function getPendingInvitationDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getPendingInvitationDateTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getInvitationStatusTone(
  status: PendingMemberInvitationRow["status"],
): AdminStatusBadgeTone {
  if (status === "revoked" || status === "cancelled") return "danger";
  if (status === "expired") return "warning";
  if (status === "accepted") return "neutral";
  return "success";
}

function canCopyInvitation(status: PendingMemberInvitationRow["status"]): boolean {
  return status === "pending" || status === "active";
}

function canCancelInvitation(status: PendingMemberInvitationRow["status"]): boolean {
  return status === "draft" || status === "pending" || status === "active";
}

const INVITATION_ICON_CLASS = "pointer-events-none block h-[15px] w-[15px] shrink-0 stroke-[2.4]";

function InvitationIconActionButton({
  tone,
  disabled,
  title,
  ariaLabel,
  onClick,
  isBusy = false,
  icon: Icon,
}: {
  tone: "copy" | "cancel";
  disabled: boolean;
  title: string;
  ariaLabel: string;
  onClick: () => void;
  isBusy?: boolean;
  icon: LucideIcon;
}) {
  const baseClassName =
    "inline-flex h-7 min-h-7 w-7 min-w-7 shrink-0 items-center justify-center rounded-full border p-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)]";

  const toneClassName =
    tone === "cancel"
      ? disabled
        ? "cursor-not-allowed border-[var(--pbp-action-danger-soft-border)] bg-[var(--pbp-surface-muted)] text-[color-mix(in_srgb,var(--pbp-action-danger-soft-text)_58%,var(--pbp-text-muted))]"
        : "border-[var(--pbp-action-danger-soft-border)] bg-[var(--pbp-action-danger-soft-surface)] text-[var(--pbp-action-danger-soft-text)] hover:bg-[color-mix(in_srgb,var(--pbp-action-danger-soft-surface)_70%,var(--pbp-action-danger-soft-border))]"
      : disabled
        ? "cursor-not-allowed border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]"
        : "border-[var(--pbp-border-strong)] bg-[var(--pbp-action-secondary-surface)] text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-action-secondary-surface-hover)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`${baseClassName} ${toneClassName}`}
    >
      {isBusy ? (
        <span className="text-[12px] font-bold leading-none" aria-hidden="true">…</span>
      ) : (
        <Icon className={INVITATION_ICON_CLASS} aria-hidden="true" />
      )}
    </button>
  );
}

export function buildMemberInvitationTableColumns({
  t,
  revokingInviteId,
  onCopyInviteLink,
  onCancelInvitation,
}: BuildMemberInvitationTableColumnsOptions): AdminTableColumn<PendingMemberInvitationRow, MemberInvitationSortKey>[] {
  return [
    {
      key: "status",
      sortKey: "status",
      label: t("memberManagement.tables.invitations.columns.status", "상태"),
      className: "whitespace-nowrap",
      render: (invitation) => (
        <AdminStatusBadge tone={getInvitationStatusTone(invitation.status)}>
          {t(
            `memberManagement.invitationStatuses.${invitation.status}`,
            invitation.status,
          )}
        </AdminStatusBadge>
      ),
    },
    {
      key: "createdAt",
      sortKey: "createdAt",
      label: t(
        "memberManagement.tables.invitations.columns.createdAt",
        "생성일",
      ),
      className: "whitespace-nowrap",
      render: (invitation) => (
        <span className="pbp-text-muted">
          {getPendingInvitationDateTimeLabel(invitation.createdAt)}
        </span>
      ),
    },
    {
      key: "expires",
      sortKey: "expires",
      label: t(
        "memberManagement.tables.invitations.columns.expires",
        "만료일",
      ),
      className: "whitespace-nowrap",
      render: (invitation) => (
        <span className="pbp-text-muted">
          {getPendingInvitationDateLabel(invitation.expiresAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("memberManagement.tables.invitations.columns.actions", "작업"),
      headerClassName: "text-center",
      className: "flex min-w-0 justify-center gap-1.5 whitespace-nowrap",
      render: (invitation) => {
        const copyEnabled = canCopyInvitation(invitation.status);
        const cancelEnabled = canCancelInvitation(invitation.status);
        const isRevoking = revokingInviteId === invitation.id;

        return (
          <>
            <InvitationIconActionButton
              tone="copy"
              onClick={() => void onCopyInviteLink(invitation.inviteUrl)}
              disabled={!copyEnabled}
              title={copyEnabled
                ? t("memberManagement.inviteBuilder.actions.copy", "링크 복사")
                : t("memberManagement.inviteBuilder.actions.copyDisabled", "사용할 수 없는 초대는 링크를 복사할 수 없습니다.")}
              ariaLabel={t("memberManagement.inviteBuilder.actions.copy", "링크 복사")}
              icon={Copy}
            />
            <InvitationIconActionButton
              tone="cancel"
              onClick={() => void onCancelInvitation(invitation)}
              disabled={revokingInviteId !== null || !cancelEnabled}
              title={cancelEnabled
                ? t("memberManagement.inviteBuilder.actions.cancel", "초대 취소")
                : t("memberManagement.inviteBuilder.actions.cancelDisabled", "이미 완료되었거나 사용할 수 없는 초대입니다.")}
              ariaLabel={t("memberManagement.inviteBuilder.actions.cancel", "초대 취소")}
              isBusy={isRevoking}
              icon={Ban}
            />
          </>
        );
      },
    },
  ];
}
