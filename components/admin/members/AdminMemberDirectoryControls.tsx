"use client";

import WaflFilterBar, {
  WAFL_FILTER_FIELD_CLASS,
  WAFL_FILTER_INPUT_CLASS,
  WAFL_FILTER_LABEL_CLASS,
  WAFL_FILTER_SELECT_TRIGGER_CLASS,
} from "@/components/admin/common/WaflFilterBar";
import { AppSelect, WaflInput } from "@/components/common/ui";
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

const MEMBER_DIRECTORY_STATUS_FILTERS: readonly MemberDirectoryStatusFilter[] =
  ["all", "pending", "approved", "suspended", "withdrawalRequested"] as const;

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
    <WaflFilterBar
      className="mb-3 shrink-0"
      layoutClassName="grid w-full min-w-0 gap-3 min-[720px]:grid-cols-[minmax(0,1fr)_minmax(140px,180px)_minmax(140px,180px)] min-[720px]:items-end"
    >
      <label
        data-wafl-component="filter-field"
        className={WAFL_FILTER_FIELD_CLASS}
      >
        <span className={WAFL_FILTER_LABEL_CLASS}>
          {t("memberManagement.memberDirectory.filters.search", "검색")}
        </span>
        <WaflInput
          data-wafl-component="search-input"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          fieldSize="sm"
          className={WAFL_FILTER_INPUT_CLASS}
          placeholder={t(
            "memberManagement.memberDirectory.filters.searchPlaceholder",
            "이름, 이메일, 연락처 검색",
          )}
        />
      </label>
      <label
        data-wafl-component="filter-field"
        className={WAFL_FILTER_FIELD_CLASS}
      >
        <span className={WAFL_FILTER_LABEL_CLASS}>
          {t("memberManagement.memberDirectory.filters.status", "상태")}
        </span>
        <AppSelect
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as MemberDirectoryStatusFilter)
          }
          options={MEMBER_DIRECTORY_STATUS_FILTERS.map((status) => ({
            value: status,
            label: t(
              `memberManagement.memberDirectory.statusFilters.${status}`,
              status,
            ),
          }))}
          size="sm"
          triggerClassName={WAFL_FILTER_SELECT_TRIGGER_CLASS}
          ariaLabel={t(
            "memberManagement.memberDirectory.filters.status",
            "상태",
          )}
        />
      </label>
      <label
        data-wafl-component="filter-field"
        className={WAFL_FILTER_FIELD_CLASS}
      >
        <span className={WAFL_FILTER_LABEL_CLASS}>
          {t("memberManagement.memberDirectory.filters.role", "권한")}
        </span>
        <AppSelect
          value={roleFilter}
          onValueChange={onRoleFilterChange}
          options={[
            {
              value: "all",
              label: t(
                "memberManagement.memberDirectory.roleFilters.all",
                "전체",
              ),
            },
            {
              value: "none",
              label: t("memberManagement.memberDirectory.none", "없음"),
            },
            ...roleOptions.map((role) => ({
              value: role.id,
              label: t(`memberManagement.roles.${role.id}.label`, role.id),
            })),
          ]}
          size="sm"
          triggerClassName={WAFL_FILTER_SELECT_TRIGGER_CLASS}
          ariaLabel={t("memberManagement.memberDirectory.filters.role", "권한")}
        />
      </label>
    </WaflFilterBar>
  );
}
