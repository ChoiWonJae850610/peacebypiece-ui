import { Ban, Copy } from "lucide-react";

import { AdminButton } from "@/components/admin/common/AdminButton";
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

const INVITATION_ICON_BUTTON_CLASS =
  "h-8 min-h-8 w-8 min-w-8 rounded-full p-0 shadow-sm [&_svg]:h-4 [&_svg]:w-4 [&_svg]:stroke-[2.25]";

const INVITATION_ICON_BUTTON_DISABLED_CLASS =
  "disabled:border-[var(--pbp-border)] disabled:bg-[var(--pbp-surface-muted)] disabled:text-[var(--pbp-text-subtle)] disabled:opacity-100";

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
      className: "flex justify-center gap-2 whitespace-nowrap",
      render: (invitation) => {
        const copyEnabled = canCopyInvitation(invitation.status);
        const cancelEnabled = canCancelInvitation(invitation.status);
        const isRevoking = revokingInviteId === invitation.id;

        return (
          <>
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void onCopyInviteLink(invitation.inviteUrl)}
              disabled={!copyEnabled}
              title={copyEnabled
                ? t("memberManagement.inviteBuilder.actions.copy", "링크 복사")
                : t("memberManagement.inviteBuilder.actions.copyDisabled", "사용할 수 없는 초대는 링크를 복사할 수 없습니다.")}
              aria-label={t("memberManagement.inviteBuilder.actions.copy", "링크 복사")}
              className={`${INVITATION_ICON_BUTTON_CLASS} ${INVITATION_ICON_BUTTON_DISABLED_CLASS} border border-[var(--pbp-border-strong)] text-[var(--pbp-text-primary)]`}
            >
              <Copy aria-hidden="true" />
            </AdminButton>
            <AdminButton
              type="button"
              variant={cancelEnabled ? "danger" : "secondary"}
              size="sm"
              onClick={() => void onCancelInvitation(invitation)}
              disabled={revokingInviteId !== null || !cancelEnabled}
              title={cancelEnabled
                ? t("memberManagement.inviteBuilder.actions.cancel", "초대 취소")
                : t("memberManagement.inviteBuilder.actions.cancelDisabled", "이미 완료되었거나 사용할 수 없는 초대입니다.")}
              aria-label={t("memberManagement.inviteBuilder.actions.cancel", "초대 취소")}
              className={`${INVITATION_ICON_BUTTON_CLASS} ${INVITATION_ICON_BUTTON_DISABLED_CLASS} border`}
            >
              {isRevoking ? (
                <span className="text-[11px] font-bold leading-none" aria-hidden="true">…</span>
              ) : (
                <Ban aria-hidden="true" />
              )}
            </AdminButton>
          </>
        );
      },
    },
  ];
}
