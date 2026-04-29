export type AdminLegacyPathStatus = "alias-required" | "internal-implementation" | "removed";

export type AdminLegacyPathAuditItem = {
  legacyPath: string;
  standardPath: string;
  status: AdminLegacyPathStatus;
  reason: string;
};

export const ADMIN_LEGACY_PATH_AUDIT_ITEMS: AdminLegacyPathAuditItem[] = [
  {
    legacyPath: "lib/admin/adminFiles.*",
    standardPath: "lib/admin/files/*",
    status: "internal-implementation",
    reason: "files 도메인 wrapper가 기존 구현을 재수출하므로 0.6.6419 범위에서는 유지",
  },
  {
    legacyPath: "lib/admin/partnerMaster.*",
    standardPath: "lib/admin/partner/*",
    status: "removed",
    reason: "import trace 결과 직접 참조가 없어 0.6.6419에서 alias 제거 완료",
  },
  {
    legacyPath: "lib/admin/adminSettings.*",
    standardPath: "lib/admin/settings/*",
    status: "removed",
    reason: "import trace 결과 직접 참조가 없어 0.6.6419에서 alias 제거 완료",
  },
  {
    legacyPath: "lib/admin/companySettings.*",
    standardPath: "lib/admin/settings/company*",
    status: "removed",
    reason: "import trace 결과 직접 참조가 없어 0.6.6419에서 alias 제거 완료",
  },
  {
    legacyPath: "lib/admin/standards.*",
    standardPath: "lib/admin/settings/standards*",
    status: "removed",
    reason: "import trace 결과 직접 참조가 없어 0.6.6419에서 alias 제거 완료",
  },
  {
    legacyPath: "lib/admin/companyScope.ts",
    standardPath: "lib/admin/settings/companyScope.ts",
    status: "alias-required",
    reason: "외부 직접 참조는 settings/companyScope로 이동하고 기존 파일은 호환 alias로 유지",
  },
];

export function selectAdminLegacyPathAuditItems(status?: AdminLegacyPathStatus): AdminLegacyPathAuditItem[] {
  if (!status) return ADMIN_LEGACY_PATH_AUDIT_ITEMS;
  return ADMIN_LEGACY_PATH_AUDIT_ITEMS.filter((item) => item.status === status);
}

export const ADMIN_LEGACY_IMPLEMENTATION_MIGRATION_VERSION = "0.6.6419" as const;
