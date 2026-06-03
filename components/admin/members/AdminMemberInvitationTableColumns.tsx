import { Ban, Copy, Share2, type LucideIcon } from "lucide-react";

import { AdminIconActionButton, type AdminIconActionButtonTone } from "@/components/admin/common/AdminIconActionButton";

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
  onShareInviteLink: (inviteUrl: string) => void | Promise<void>;
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

const INVITATION_ICON_CLASS = "pointer-events-none block h-[14px] w-[14px] shrink-0 stroke-[2.5]";

const INVITATION_ACTION_TONE_MAP: Record<"copy" | "share" | "cancel", AdminIconActionButtonTone> = {
  copy: "neutral",
  share: "primary",
  cancel: "dangerSoft",
};

function InvitationIconActionButton({
  tone,
  disabled,
  title,
  ariaLabel,
  onClick,
  isBusy = false,
  icon: Icon,
  className = "",
}: {
  tone: "copy" | "share" | "cancel";
  disabled: boolean;
  title: string;
  ariaLabel: string;
  onClick: () => void;
  isBusy?: boolean;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <AdminIconActionButton
      tone={INVITATION_ACTION_TONE_MAP[tone]}
      onClick={onClick}
      disabled={disabled}
      title={title}
      label={ariaLabel}
      className={className}
    >
      {isBusy ? (
        <span className="text-[12px] font-bold leading-none" aria-hidden="true">…</span>
      ) : (
        <Icon className={INVITATION_ICON_CLASS} aria-hidden="true" />
      )}
    </AdminIconActionButton>
  );
}


export function buildMemberInvitationTableColumns({
  t,
  revokingInviteId,
  onCopyInviteLink,
  onShareInviteLink,
  onCancelInvitation,
}: BuildMemberInvitationTableColumnsOptions): AdminTableColumn<PendingMemberInvitationRow, MemberInvitationSortKey>[] {
  return [
    {
      key: "status",
      sortKey: "status",
      label: t("memberManagement.tables.invitations.columns.status", "상태"),
      className: "wafl-member-invite-status-cell whitespace-nowrap",
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
      className: "wafl-member-invite-created-cell whitespace-nowrap text-center",
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
      className: "wafl-member-invite-expires-cell whitespace-nowrap text-center",
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
      className: "wafl-member-invite-action-cell",
      render: (invitation) => {
        const copyEnabled = canCopyInvitation(invitation.status);
        const cancelEnabled = canCancelInvitation(invitation.status);
        const isRevoking = revokingInviteId === invitation.id;

        return (
          <>
            <InvitationIconActionButton
              tone="share"
              onClick={() => void onShareInviteLink(invitation.inviteUrl)}
              disabled={!copyEnabled}
              title={copyEnabled
                ? t("memberManagement.inviteBuilder.actions.share", "초대 링크 공유")
                : t("memberManagement.inviteBuilder.actions.shareDisabled", "사용할 수 없는 초대는 공유할 수 없습니다.")}
              ariaLabel={t("memberManagement.inviteBuilder.actions.share", "초대 링크 공유")}
              icon={Share2}
              className="wafl-member-invite-action-share"
            />
            <InvitationIconActionButton
              tone="copy"
              onClick={() => void onCopyInviteLink(invitation.inviteUrl)}
              disabled={!copyEnabled}
              title={copyEnabled
                ? t("memberManagement.inviteBuilder.actions.copy", "링크 복사")
                : t("memberManagement.inviteBuilder.actions.copyDisabled", "사용할 수 없는 초대는 링크를 복사할 수 없습니다.")}
              ariaLabel={t("memberManagement.inviteBuilder.actions.copy", "링크 복사")}
              icon={Copy}
              className="wafl-member-invite-action-copy-touch"
            />
            <InvitationIconActionButton
              tone="copy"
              onClick={() => undefined}
              disabled
              title={t(
                "memberManagement.inviteBuilder.actions.copyDesktopDisabled",
                "PC 화면에서는 초대 링크 복사를 비활성화합니다.",
              )}
              ariaLabel={t(
                "memberManagement.inviteBuilder.actions.copyDesktopDisabled",
                "PC 화면에서는 초대 링크 복사를 비활성화합니다.",
              )}
              icon={Copy}
              className="wafl-member-invite-action-copy-pc"
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
