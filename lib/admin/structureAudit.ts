import { ADMIN_DOMAIN_STRUCTURE, type AdminDomainKey, type AdminDomainLayerKey } from "@/lib/admin/domainRegistry";

export type AdminRouteAuditItem = {
  key: AdminDomainKey;
  routePath: string;
  uiPath: string;
  legacyPaths: string[];
};

export type AdminDomainAuditItem = {
  key: AdminDomainKey;
  label: string;
  basePath: string;
  layers: AdminDomainLayerKey[];
  status: "ready" | "partial";
  notes: string[];
};

export const ADMIN_ROUTE_AUDIT_ITEMS: AdminRouteAuditItem[] = [
  { key: "stats", routePath: "app/admin/dashboard/page.tsx", uiPath: "components/admin/dashboard", legacyPaths: ["lib/admin/adminDashboard.presentation.ts", "lib/admin/adminStats.repository.ts"] },
  { key: "history", routePath: "app/admin/history/page.tsx", uiPath: "components/admin/history", legacyPaths: ["lib/admin/historyPresentation.ts", "lib/admin/useAdminHistoryTools.ts"] },
  { key: "files", routePath: "app/admin/files/page.tsx", uiPath: "components/admin/files", legacyPaths: ["lib/admin/adminFiles.*"] },
  { key: "partner", routePath: "app/admin/partners/page.tsx", uiPath: "components/admin/partnerMaster", legacyPaths: ["lib/admin/partnerMaster.*"] },
  { key: "settings", routePath: "app/admin/settings/page.tsx", uiPath: "components/admin/settings", legacyPaths: ["lib/admin/adminSettings.*", "lib/admin/companySettings.*", "lib/admin/standards.*"] },
];

const DOMAIN_READY_LAYER_MINIMUMS: Record<AdminDomainKey, AdminDomainLayerKey[]> = {
  common: ["types", "ui"],
  stats: ["selector", "presentation", "repository"],
  history: ["types", "selector", "presentation", "repository"],
  files: ["types", "selector", "actionFlow", "presentation", "adapter"],
  partner: ["types", "selector", "actionFlow", "presentation", "repository"],
  settings: ["types", "selector", "actionFlow", "presentation", "repository"],
};

export function buildAdminDomainAuditItems(): AdminDomainAuditItem[] {
  return ADMIN_DOMAIN_STRUCTURE.map((domain) => {
    const requiredLayers = DOMAIN_READY_LAYER_MINIMUMS[domain.key];
    const missingLayers = requiredLayers.filter((layer) => !domain.layers.includes(layer));
    const route = ADMIN_ROUTE_AUDIT_ITEMS.find((item) => item.key === domain.key);
    const notes = [
      route ? `route=${route.routePath}` : "route 없음",
      route ? `ui=${route.uiPath}` : "ui 없음",
      missingLayers.length ? `누락 계층=${missingLayers.join(", ")}` : "필수 계층 충족",
    ];

    return {
      key: domain.key,
      label: domain.label,
      basePath: domain.basePath,
      layers: domain.layers,
      status: missingLayers.length ? "partial" : "ready",
      notes,
    };
  });
}

export function getAdminLegacyCleanupCandidates(): string[] {
  return ADMIN_ROUTE_AUDIT_ITEMS.flatMap((item) => item.legacyPaths);
}
