"use client";

import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { AdminTableColumn, AdminTableSortState } from "@/lib/admin/common/types";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
import { AdminFeedbackMessage } from "@/components/admin/common/AdminFeedbackMessage";
import AdminMemberDirectoryControls from "@/components/admin/members/AdminMemberDirectoryControls";
import AdminMemberDirectoryResponsiveRows from "@/components/admin/members/AdminMemberDirectoryResponsiveRows";
import type { MemberPermissionRoleTemplateCode } from "@/lib/permissions";
import type {
  MemberDirectoryRow,
  MemberDirectoryStatusFilter,
  MemberDirectorySortKey,
} from "@/components/admin/members/AdminMemberDirectoryTableColumns";

type AdminTranslate = ReturnType<typeof useAdminTranslation>;

type MemberDirectoryRoleFilterOption = {
  id: MemberPermissionRoleTemplateCode;
};

type AdminMemberDirectorySectionProps = {
  t: AdminTranslate;
  filteredMemberDirectoryRows: readonly MemberDirectoryRow[];
  memberDirectoryColumns: AdminTableColumn<MemberDirectoryRow, MemberDirectorySortKey>[];
  memberSearchQuery: string;
  memberStatusFilter: MemberDirectoryStatusFilter;
  memberRoleFilter: string;
  inviteRoleOptions: readonly MemberDirectoryRoleFilterOption[];
  memberListLoadError: string | null;
  joinRequestLoadError: string | null;
  isLoading: boolean;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: MemberDirectoryStatusFilter) => void;
  onRoleFilterChange: (value: string) => void;
  onOpenMemberDetail: (row: MemberDirectoryRow) => void;
  memberDirectorySortState: AdminTableSortState<MemberDirectorySortKey>;
  onMemberDirectorySort: (sortKey: MemberDirectorySortKey) => void;
};

const MEMBER_DIRECTORY_PANEL_CLASS = "min-h-fit touch-pan-y overflow-visible overscroll-auto";

export default function AdminMemberDirectorySection({
  t,
  filteredMemberDirectoryRows,
  memberDirectoryColumns,
  memberSearchQuery,
  memberStatusFilter,
  memberRoleFilter,
  inviteRoleOptions,
  memberListLoadError,
  joinRequestLoadError,
  isLoading,
  onSearchQueryChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onOpenMemberDetail,
  memberDirectorySortState,
  onMemberDirectorySort,
}: AdminMemberDirectorySectionProps) {
  return (
    <WaflSectionPanel
      className={MEMBER_DIRECTORY_PANEL_CLASS}
      eyebrow={t("memberManagement.memberDirectory.eyebrow", "MEMBER LIST")}
      title={t("memberManagement.memberDirectory.title", "멤버 목록")}
      description={t(
        "memberManagement.memberDirectory.description",
        "가입 승인, 재직 상태, 역할과 권한을 한 목록에서 확인합니다.",
      )}
      bodyClassName="flex min-h-fit touch-pan-y flex-col overflow-visible overscroll-auto pt-3 pb-3"
    >
      <AdminMemberDirectoryControls
        t={t}
        searchQuery={memberSearchQuery}
        statusFilter={memberStatusFilter}
        roleFilter={memberRoleFilter}
        roleOptions={inviteRoleOptions}
        onSearchQueryChange={onSearchQueryChange}
        onStatusFilterChange={onStatusFilterChange}
        onRoleFilterChange={onRoleFilterChange}
      />

      {memberListLoadError ? (
        <AdminFeedbackMessage
          className="mb-3"
          tone="danger"
          message={
            <>
              {t(
                "memberManagement.loadErrors.members",
                "멤버 목록을 불러오지 못했습니다.",
              )}{" "}
              {memberListLoadError}
            </>
          }
        />
      ) : null}
      {joinRequestLoadError ? (
        <AdminFeedbackMessage
          className="mb-3"
          tone="danger"
          message={
            <>
              {t(
                "memberManagement.loadErrors.joinRequests",
                "승인 대기 신청 목록을 불러오지 못했습니다.",
              )}{" "}
              {joinRequestLoadError}
            </>
          }
        />
      ) : null}
      <AdminMemberDirectoryResponsiveRows
        items={filteredMemberDirectoryRows}
        columns={memberDirectoryColumns}
        emptyLabel={t(
          "memberManagement.empty.memberDirectory.title",
          "표시할 멤버가 없습니다",
        )}
        emptyDescription={t(
          "memberManagement.empty.memberDirectory.description",
          "승인 대기 신청 또는 등록된 멤버가 생성되면 이 목록에 표시됩니다.",
        )}
        isLoading={isLoading}
        loadingLabel={t(
          "memberManagement.loading.memberDirectory.title",
          "멤버 목록을 불러오는 중입니다",
        )}
        onOpenMemberDetail={onOpenMemberDetail}
        sortState={memberDirectorySortState}
        onSort={onMemberDirectorySort}
        expandListLabel={t(
          "memberManagement.memberDirectory.actions.expandList",
          "멤버 목록 더 보기",
        )}
        collapseListLabel={t(
          "memberManagement.memberDirectory.actions.collapseList",
          "멤버 목록 접기",
        )}
      />
    </WaflSectionPanel>
  );
}
