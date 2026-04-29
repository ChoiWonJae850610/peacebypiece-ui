export type AdminDomainKey = "common" | "stats" | "history" | "files" | "partner" | "settings";

export type AdminDomainLayerKey = "types" | "ui" | "selector" | "actionFlow" | "presentation" | "repository" | "adapter";

export type AdminDomainStructureItem = {
  key: AdminDomainKey;
  label: string;
  basePath: `lib/admin/${AdminDomainKey}`;
  layers: AdminDomainLayerKey[];
};

export const ADMIN_DOMAIN_STRUCTURE: AdminDomainStructureItem[] = [
  { key: "common", label: "관리자 공통 레이어", basePath: "lib/admin/common", layers: ["types", "ui"] },
  { key: "stats", label: "통계정보", basePath: "lib/admin/stats", layers: ["types", "selector", "presentation", "repository"] },
  { key: "history", label: "히스토리", basePath: "lib/admin/history", layers: ["types", "selector", "presentation", "repository"] },
  { key: "files", label: "저장소 관리", basePath: "lib/admin/files", layers: ["types", "selector", "actionFlow", "presentation", "adapter"] },
  { key: "partner", label: "협력업체 관리", basePath: "lib/admin/partner", layers: ["types", "selector", "actionFlow", "presentation", "repository"] },
  { key: "settings", label: "환경설정", basePath: "lib/admin/settings", layers: ["types", "selector", "actionFlow", "presentation", "repository"] },
];

export function getAdminDomainStructureItem(key: AdminDomainKey): AdminDomainStructureItem | undefined {
  return ADMIN_DOMAIN_STRUCTURE.find((item) => item.key === key);
}
