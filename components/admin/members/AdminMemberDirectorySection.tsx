"use client";

import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import AdminPanelSection from "@/components/admin/common/AdminPanelSection";
import AdminTable from "@/components/admin/common/AdminTable";
import AdminMemberDirectoryControls from "@/components/admin/members/AdminMemberDirectoryControls";
import type { MemberPermissionRoleTemplateCode } from "@/lib/permissions";
import type {
  MemberDirectoryRow,
  MemberDirectoryStatusFilter,
} from "@/components/admin/members/AdminMemberDirectoryTableColumns";

type AdminTranslate = ReturnType<typeof useAdminTranslation>;

type MemberDirectoryRoleFilterOption = {
  id: MemberPermissionRoleTemplateCode;
};

type AdminMemberDirectorySectionProps = {
  t: AdminTranslate;
  memberDirectoryRows: readonly MemberDirectoryRow[];
  filteredMemberDirectoryRows: readonly MemberDirectoryRow[];
  memberDirectoryColumns: AdminTableColumn<MemberDirectoryRow>[];
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
};

const MEMBER_DIRECTORY_PANEL_HEIGHT_CLASS = "min-h-[420px] xl:h-[452px] xl:min-h-[452px]";

export default function AdminMemberDirectorySection({
  t,
  memberDirectoryRows,
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
}: AdminMemberDirectorySectionProps) {
  return (
    <AdminPanelSection
      className={MEMBER_DIRECTORY_PANEL_HEIGHT_CLASS}
      eyebrow={t("memberManagement.memberDirectory.eyebrow", "멤버 관리")}
      title={t("memberManagement.memberDirectory.title", "멤버 관리")}
      description={t(
        "memberManagement.memberDirectory.description",
        "승인 대기와 전체 멤버를 한 목록에서 확인하고 처리합니다.",
      )}
      meta={t(
        "memberManagement.tabs.members.count",
        "대상 {count}명",
      ).replace("{count}", String(memberDirectoryRows.length))}
      contentClassName="flex min-h-0 flex-col pt-4 xl:flex-1"
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
        <p className="mb-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
          {t(
            "memberManagement.loadErrors.members",
            "멤버 목록을 불러오지 못했습니다.",
          )}{" "}
          {memberListLoadError}
        </p>
      ) : null}
      {joinRequestLoadError ? (
        <p className="mb-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
          {t(
            "memberManagement.loadErrors.joinRequests",
            "승인 대기 신청 목록을 불러오지 못했습니다.",
          )}{" "}
          {joinRequestLoadError}
        </p>
      ) : null}
      <AdminTable
        items={filteredMemberDirectoryRows}
        columns={memberDirectoryColumns}
        getRowKey={(row) => row.id}
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
        gridTemplateColumns="minmax(120px,1fr) minmax(160px,1.2fr) 110px 110px 96px 110px 110px 120px 140px"
        rowBaseClassName="grid w-full min-w-[1120px] gap-3 px-4 py-3 text-left text-xs md:items-center"
        headerClassName="hidden min-w-[1120px] gap-3 bg-[var(--pbp-surface-muted)] px-4 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)] xl:grid"
        className="min-h-[320px] xl:min-h-0 xl:flex-1"
        onRowClick={onOpenMemberDetail}
      />
    </AdminPanelSection>
  );
}
