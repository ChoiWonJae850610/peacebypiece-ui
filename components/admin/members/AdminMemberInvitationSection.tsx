"use client";

import { useMemo, useState } from "react";
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
const MEMBER_INVITATION_TABLE_VIEWPORT_CLASS = "wafl-member-invite-table min-h-fit touch-pan-y";
const MEMBER_INVITATION_PREVIEW_LIMIT = 5;

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
  const [isInvitationListExpanded, setIsInvitationListExpanded] = useState(false);
  const hasInvitationOverflow = invitations.length > MEMBER_INVITATION_PREVIEW_LIMIT;
  const visibleInvitations = useMemo(
    () => isInvitationListExpanded
      ? invitations
      : invitations.slice(0, MEMBER_INVITATION_PREVIEW_LIMIT),
    [invitations, isInvitationListExpanded],
  );

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
      <div className="rounded-[22px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-3 sm:p-4 2xl:hidden">
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
              "모바일/태블릿에서는 기기 공유창으로 초대 링크를 전달할 수 있습니다.",
            )}
            {inviteError ? (
              <p className="mt-1 font-semibold text-[var(--pbp-danger)]">
                {inviteError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="hidden rounded-[22px] border border-dashed border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-3 text-xs leading-5 pbp-text-muted 2xl:block">
        {t(
          "memberManagement.inviteBuilder.desktopNotice",
          "PC 화면에서는 초대 링크 상태와 취소만 관리합니다. 초대 링크 생성과 공유는 모바일/태블릿 화면에서 사용합니다.",
        )}
      </div>

      <AdminTable
        items={visibleInvitations}
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
        gridTemplateColumns="88px 178px 118px 104px"
        headerClassName="wafl-member-invite-table-header shrink-0 gap-1 bg-[var(--pbp-surface-muted)] px-3 py-2 text-center text-[10px] font-semibold text-[var(--pbp-text-muted)]"
        rowBaseClassName="wafl-member-invite-table-row w-full min-w-0 gap-1 px-3 py-2 text-center text-[11px]"
        responsiveGridClassName="wafl-member-invite-table-row-layout"
        className={MEMBER_INVITATION_TABLE_VIEWPORT_CLASS}
        scrollMode="page"
        sortState={invitationSortState}
        onSort={onInvitationSort}
      />
      {hasInvitationOverflow ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 py-2 text-xs font-semibold pbp-text-muted transition hover:bg-[var(--pbp-surface-soft)]"
            onClick={() => setIsInvitationListExpanded((current) => !current)}
          >
            {isInvitationListExpanded
              ? t("memberManagement.inviteBuilder.actions.collapseList", "초대 링크 접기")
              : t("memberManagement.inviteBuilder.actions.expandList", "초대 링크 더 보기")}
          </button>
        </div>
      ) : null}
    </AdminPanelSection>
  );
}
