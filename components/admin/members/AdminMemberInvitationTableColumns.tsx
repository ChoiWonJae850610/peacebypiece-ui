import { AdminButton } from "@/components/admin/common/AdminButton";
import {
  AdminStatusBadge,
  type AdminStatusBadgeTone,
} from "@/components/admin/common/AdminStatusBadge";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

export type MemberInvitationSortKey = "status" | "link" | "expires" | "createdAt";

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

function getInvitationStatusTone(
  status: PendingMemberInvitationRow["status"],
): AdminStatusBadgeTone {
  if (status === "revoked" || status === "cancelled") return "danger";
  if (status === "expired") return "warning";
  if (status === "accepted") return "neutral";
  return "success";
}

function canCancelInvitation(status: PendingMemberInvitationRow["status"]): boolean {
  return status !== "accepted" && status !== "revoked" && status !== "cancelled";
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
      key: "link",
      sortKey: "link",
      sortAlign: "left",
      label: t(
        "memberManagement.tables.invitations.columns.link",
        "초대 링크",
      ),
      className: "min-w-0",
      render: (invitation) => (
        <span
          className="block truncate font-semibold pbp-text-primary"
          title={invitation.inviteUrl}
        >
          {invitation.inviteUrl}
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
      key: "createdAt",
      sortKey: "createdAt",
      label: t(
        "memberManagement.tables.invitations.columns.createdAt",
        "생성일",
      ),
      className: "whitespace-nowrap",
      render: (invitation) => (
        <span className="pbp-text-muted">
          {getPendingInvitationDateLabel(invitation.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: t("memberManagement.tables.invitations.columns.actions", "작업"),
      headerClassName: "text-center",
      className: "flex justify-center gap-2",
      render: (invitation) => (
        <>
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void onCopyInviteLink(invitation.inviteUrl)}
          >
            {t("memberManagement.inviteBuilder.actions.copy", "복사")}
          </AdminButton>
          <AdminButton
            type="button"
            variant="danger"
            size="sm"
            onClick={() => void onCancelInvitation(invitation)}
            disabled={revokingInviteId !== null || !canCancelInvitation(invitation.status)}
          >
            {revokingInviteId === invitation.id
              ? "…"
              : t("memberManagement.inviteBuilder.actions.cancel", "취소")}
          </AdminButton>
        </>
      ),
    },
  ];
}
