"use client";

import {
  ADMIN_FIELD_CONTAINER_CLASS,
  ADMIN_INPUT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import type { MemberPermissionRoleTemplateCode } from "@/lib/permissions";
import type { MemberDirectoryStatusFilter } from "@/components/admin/members/AdminMemberDirectoryTableColumns";

type AdminTranslate = ReturnType<typeof useAdminTranslation>;

type MemberDirectoryRoleFilterOption = {
  id: MemberPermissionRoleTemplateCode;
};

type AdminMemberDirectoryControlsProps = {
  t: AdminTranslate;
  searchQuery: string;
  statusFilter: MemberDirectoryStatusFilter;
  roleFilter: string;
  roleOptions: readonly MemberDirectoryRoleFilterOption[];
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: MemberDirectoryStatusFilter) => void;
  onRoleFilterChange: (value: string) => void;
};

const MEMBER_DIRECTORY_STATUS_FILTERS: readonly MemberDirectoryStatusFilter[] = [
  "all",
  "pending",
  "approved",
  "suspended",
  "withdrawalRequested",
] as const;

export default function AdminMemberDirectoryControls({
  t,
  searchQuery,
  statusFilter,
  roleFilter,
  roleOptions,
  onSearchQueryChange,
  onStatusFilterChange,
  onRoleFilterChange,
}: AdminMemberDirectoryControlsProps) {
  return (
    <div className="mb-4 grid shrink-0 gap-3 rounded-[24px] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] p-3 lg:grid-cols-[minmax(0,1fr)_180px_190px]">
      <label className={ADMIN_FIELD_CONTAINER_CLASS}>
        <span className="text-xs font-semibold pbp-text-muted">
          {t("memberManagement.memberDirectory.filters.search", "검색")}
        </span>
        <input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className={ADMIN_INPUT_CLASS}
          placeholder={t(
            "memberManagement.memberDirectory.filters.searchPlaceholder",
            "이름, 이메일, 연락처 검색",
          )}
        />
      </label>
      <label className={ADMIN_FIELD_CONTAINER_CLASS}>
        <span className="text-xs font-semibold pbp-text-muted">
          {t("memberManagement.memberDirectory.filters.status", "상태")}
        </span>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusFilterChange(event.target.value as MemberDirectoryStatusFilter)
          }
          className={ADMIN_INPUT_CLASS}
        >
          {MEMBER_DIRECTORY_STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {t(`memberManagement.memberDirectory.statusFilters.${status}`, status)}
            </option>
          ))}
        </select>
      </label>
      <label className={ADMIN_FIELD_CONTAINER_CLASS}>
        <span className="text-xs font-semibold pbp-text-muted">
          {t("memberManagement.memberDirectory.filters.role", "권한")}
        </span>
        <select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value)}
          className={ADMIN_INPUT_CLASS}
        >
          <option value="all">
            {t("memberManagement.memberDirectory.roleFilters.all", "전체")}
          </option>
          <option value="none">
            {t("memberManagement.memberDirectory.none", "없음")}
          </option>
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {t(`memberManagement.roles.${role.id}.label`, role.id)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
