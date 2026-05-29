"use client";

import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import AdminPanelSection from "@/components/admin/common/AdminPanelSection";
import AdminTable from "@/components/admin/common/AdminTable";
import AdminMemberInviteBuilderPanel from "@/components/admin/members/AdminMemberInviteBuilderPanel";
import type { PendingMemberInvitationRow } from "@/components/admin/members/AdminMemberInvitationTableColumns";

type AdminTranslate = ReturnType<typeof useAdminTranslation>;

type AdminMemberInvitationSectionProps = {
  t: AdminTranslate;
  invitations: readonly PendingMemberInvitationRow[];
  invitationTableColumns: AdminTableColumn<PendingMemberInvitationRow>[];
  expiresInDays: string;
  inviteError: string | null;
  isCreatingInvite: boolean;
  canSubmitInvite: boolean;
  onExpiresInDaysChange: (value: string) => void;
  onCreateInvite: () => void;
};

const MEMBER_INVITE_PANEL_HEIGHT_CLASS = "min-h-[360px] touch-pan-y xl:h-[452px] xl:min-h-[452px]";
const MEMBER_INVITE_PANEL_CONTENT_CLASS = "flex min-h-0 flex-col pt-4 xl:flex-1";
const MEMBER_INVITATION_TABLE_CONTENT_CLASS =
  "flex min-h-0 flex-col pt-4 xl:flex-1";
const MEMBER_INVITATION_TABLE_VIEWPORT_CLASS = "min-h-[260px] touch-pan-y xl:min-h-0 xl:flex-1";

export default function AdminMemberInvitationSection({
  t,
  invitations,
  invitationTableColumns,
  expiresInDays,
  inviteError,
  isCreatingInvite,
  canSubmitInvite,
  onExpiresInDaysChange,
  onCreateInvite,
}: AdminMemberInvitationSectionProps) {
  return (
    <section
      id="member-invite-builder"
      className="grid items-stretch gap-5 xl:grid-cols-[0.95fr_1.05fr]"
    >
      <AdminMemberInviteBuilderPanel
        t={t}
        className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
        contentClassName={MEMBER_INVITE_PANEL_CONTENT_CLASS}
        expiresInDays={expiresInDays}
        inviteError={inviteError}
        isCreatingInvite={isCreatingInvite}
        canSubmitInvite={canSubmitInvite}
        onExpiresInDaysChange={onExpiresInDaysChange}
        onCreateInvite={onCreateInvite}
      />

      <AdminPanelSection
        className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
        title={t(
          "memberManagement.sections.invitations",
          "초대 링크 목록",
        )}
        description={t(
          "memberManagement.sections.invitationsDescription",
          "사용 가능, 사용됨, 만료됨, 취소됨 상태를 확인하고 링크를 복사하거나 취소합니다.",
        )}
        meta={t(
          "memberManagement.tabs.invite.count",
          "초대 {count}건",
        ).replace("{count}", String(invitations.length))}
        contentClassName={MEMBER_INVITATION_TABLE_CONTENT_CLASS}
      >
        <AdminTable
          items={invitations}
          columns={invitationTableColumns}
          getRowKey={(invitation) => invitation.id}
          emptyLabel={t(
            "memberManagement.empty.invitations.title",
            "생성된 초대가 없습니다",
          )}
          emptyDescription={t(
            "memberManagement.empty.invitations.description",
            "초대를 생성하면 이 목록에서 링크 복사, 만료일 확인, 취소를 처리할 수 있습니다.",
          )}
          gridTemplateColumns="84px minmax(180px,1fr) 90px 90px 140px"
          headerClassName="hidden shrink-0 gap-2 bg-[var(--pbp-surface-muted)] px-3 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)] xl:grid"
          rowBaseClassName="grid w-full min-w-0 gap-2 px-3 py-2.5 text-left text-[11px] md:items-center"
          className={MEMBER_INVITATION_TABLE_VIEWPORT_CLASS}
        />
      </AdminPanelSection>
    </section>
  );
}
