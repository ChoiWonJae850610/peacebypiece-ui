export type AdminLegacyPathStatus = "alias-required" | "internal-implementation" | "delete-candidate";

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
    reason: "files 도메인 wrapper가 기존 구현을 재수출하므로 즉시 삭제하면 빌드 영향 가능성이 큼",
  },
  {
    legacyPath: "lib/admin/partnerMaster.*",
    standardPath: "lib/admin/partner/*",
    status: "internal-implementation",
    reason: "partner 도메인 wrapper의 실제 구현 원본으로 남아 있어 단계적 이동 필요",
  },
  {
    legacyPath: "lib/admin/adminSettings.*",
    standardPath: "lib/admin/settings/*",
    status: "internal-implementation",
    reason: "settings actionFlow/presentation wrapper가 참조하는 구현 원본",
  },
  {
    legacyPath: "lib/admin/companySettings.*",
    standardPath: "lib/admin/settings/company*",
    status: "internal-implementation",
    reason: "company 설정 repository/type/default 구현 원본",
  },
  {
    legacyPath: "lib/admin/standards.*",
    standardPath: "lib/admin/settings/standards*",
    status: "internal-implementation",
    reason: "standards repository/type/default 구현 원본",
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
