"use client";

import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { AdminTableColumn, AdminTableSortState } from "@/lib/admin/common/types";
import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminPanelSection from "@/components/admin/common/AdminPanelSection";
import AdminTable from "@/components/admin/common/AdminTable";
import { AppSelect } from "@/components/common/ui";
import {
  ADMIN_FIELD_CONTAINER_CLASS,
  ADMIN_INPUT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { MemberInvitationSortKey, PendingMemberInvitationRow } from "@/components/admin/members/AdminMemberInvitationTableColumns";

type AdminTranslate = ReturnType<typeof useAdminTranslation>;

type AdminMemberInvitationSectionProps = {
  t: AdminTranslate;
  invitations: readonly PendingMemberInvitationRow[];
  invitationTableColumns: AdminTableColumn<PendingMemberInvitationRow, MemberInvitationSortKey>[];
  expiresInDays: string;
  inviteError: string | null;
  isCreatingInvite: boolean;
  canSubmitInvite: boolean;
  onExpiresInDaysChange: (value: string) => void;
  onCreateInvite: () => void;
  invitationSortState: AdminTableSortState<MemberInvitationSortKey>;
  onInvitationSort: (sortKey: MemberInvitationSortKey) => void;
};

const MEMBER_INVITATION_COMPACT_CONTENT_CLASS =
  "grid min-h-fit gap-4 overflow-visible overscroll-auto pt-4";
const MEMBER_INVITATION_TABLE_VIEWPORT_CLASS = "min-h-fit touch-pan-y";

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
  invitationSortState,
  onInvitationSort,
}: AdminMemberInvitationSectionProps) {
  return (
    <AdminPanelSection
      title={t(
        "memberManagement.sections.invitationManagement",
        "초대 관리",
      )}
      description={t(
        "memberManagement.sections.invitationManagementDescription",
        "필요할 때만 초대 링크를 생성하고 최근 초대 상태를 확인합니다.",
      )}
      meta={t(
        "memberManagement.tabs.invite.count",
        "초대 {count}건",
      ).replace("{count}", String(invitations.length))}
      className="min-h-fit"
      headerMinClassName="min-h-0"
      contentClassName={MEMBER_INVITATION_COMPACT_CONTENT_CLASS}
    >
      <div className="rounded-[22px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(180px,240px)_160px_minmax(0,1fr)] lg:items-end">
          <label className={ADMIN_FIELD_CONTAINER_CLASS}>
            <span className="text-xs font-semibold pbp-text-muted">
              {t("memberManagement.inviteBuilder.fields.expires", "초대 만료")}
            </span>
            <AppSelect
              value={expiresInDays}
              onValueChange={onExpiresInDaysChange}
              options={[
                {
                  value: "3d",
                  label: t("memberManagement.inviteBuilder.expires.3d", "3일"),
                },
                {
                  value: "7d",
                  label: t("memberManagement.inviteBuilder.expires.7d", "7일"),
                },
                {
                  value: "14d",
                  label: t("memberManagement.inviteBuilder.expires.14d", "14일"),
                },
              ]}
              ariaLabel={t("memberManagement.inviteBuilder.fields.expires", "초대 만료")}
              triggerClassName={ADMIN_INPUT_CLASS}
            />
          </label>
          <AdminButton
            onClick={onCreateInvite}
            variant="primary"
            disabled={!canSubmitInvite}
            className="h-10 w-full"
          >
            {isCreatingInvite
              ? t("memberManagement.inviteBuilder.actions.creating", "생성 중")
              : t("memberManagement.inviteBuilder.actions.create", "링크 생성")}
          </AdminButton>
          <div className="min-w-0 text-xs leading-5 pbp-text-muted lg:pb-1">
            {t(
              "memberManagement.inviteBuilder.sendPolicy.compact",
              "링크는 복사해서 전달합니다. 이메일/SMS 직접 발송은 후속 기능에서 연결합니다.",
            )}
            {inviteError ? (
              <p className="mt-1 font-semibold text-[var(--pbp-danger)]">
                {inviteError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

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
        gridTemplateColumns="72px minmax(150px,1fr) 112px 76px"
        headerClassName="hidden shrink-0 gap-2 bg-[var(--pbp-surface-muted)] px-3 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)] xl:grid"
        rowBaseClassName="grid w-full min-w-0 gap-2 px-3 py-2.5 text-left text-[11px] md:items-center"
        className={MEMBER_INVITATION_TABLE_VIEWPORT_CLASS}
        scrollMode="page"
        sortState={invitationSortState}
        onSort={onInvitationSort}
      />
    </AdminPanelSection>
  );
}
