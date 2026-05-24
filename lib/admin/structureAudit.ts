import { ADMIN_DOMAIN_STRUCTURE, type AdminDomainKey, type AdminDomainLayerKey } from "@/lib/admin/domainRegistry";
import { getAdminDbIntegrationPoint } from "@/lib/admin/dbIntegration";
import { ADMIN_LEGACY_PATH_AUDIT_ITEMS, type AdminLegacyPathAuditItem } from "@/lib/admin/legacyPathAudit";

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
  { key: "stats", routePath: "app/(workspace)/workspace/stats/page.tsx", uiPath: "components/admin/dashboard", legacyPaths: ["lib/admin/adminDashboard.presentation.ts", "lib/admin/adminStats.repository.ts"] },
  { key: "history", routePath: "app/(workspace)/workspace/history/page.tsx", uiPath: "components/admin/history", legacyPaths: ["lib/admin/historyPresentation.ts"] },
  { key: "files", routePath: "app/(workspace)/workspace/files/page.tsx", uiPath: "components/admin/files", legacyPaths: ["lib/admin/adminFiles.*"] },
  { key: "partner", routePath: "app/(workspace)/workspace/partners/page.tsx", uiPath: "components/admin/partnerMaster", legacyPaths: [] },
  { key: "settings", routePath: "app/(workspace)/workspace/settings/page.tsx", uiPath: "components/admin/settings", legacyPaths: [] },
];

const DOMAIN_READY_LAYER_MINIMUMS: Record<AdminDomainKey, AdminDomainLayerKey[]> = {
  common: ["types", "ui"],
  stats: ["types", "selector", "actionFlow", "presentation", "repository"],
  history: ["types", "selector", "actionFlow", "presentation", "repository"],
  files: ["types", "selector", "actionFlow", "presentation", "adapter"],
  partner: ["types", "selector", "actionFlow", "presentation", "repository"],
  settings: ["types", "selector", "actionFlow", "presentation", "repository"],
};

function getDomainDbNote(domainKey: AdminDomainKey): string {
  if (domainKey === "common") return "db 영향 없음";

  const dbPoint = getAdminDbIntegrationPoint(domainKey);
  return dbPoint ? `db=${dbPoint.state}; tables=${dbPoint.tables.join(",")}` : "db 영향 없음";
}

export function buildAdminDomainAuditItems(): AdminDomainAuditItem[] {
  return ADMIN_DOMAIN_STRUCTURE.map((domain) => {
    const requiredLayers = DOMAIN_READY_LAYER_MINIMUMS[domain.key];
    const missingLayers = requiredLayers.filter((layer) => !domain.layers.includes(layer));
    const route = ADMIN_ROUTE_AUDIT_ITEMS.find((item) => item.key === domain.key);
    const notes = [
      route ? `route=${route.routePath}` : "route 없음",
      route ? `ui=${route.uiPath}` : "ui 없음",
      missingLayers.length ? `누락 계층=${missingLayers.join(", ")}` : "필수 계층 충족",
      getDomainDbNote(domain.key),
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

export function getAdminLegacyPathAuditItems(): AdminLegacyPathAuditItem[] {
  return ADMIN_LEGACY_PATH_AUDIT_ITEMS;
}

export function getAdminLegacyDeleteCandidates(): AdminLegacyPathAuditItem[] {
  return ADMIN_LEGACY_PATH_AUDIT_ITEMS.filter((item) => item.status === "removed");
}

export { getAdminDbIntegrationPoints, getAdminDbIntegrationPoint } from "@/lib/admin/dbIntegration";
export { getAdminDbCompletionSummary } from "@/lib/admin/dbCompletionAudit";
export type { AdminDbIntegrationPoint, AdminDbConnectionState } from "@/lib/admin/dbIntegration";
export type { AdminDbCompletionSummary, AdminDbScreenAuditItem, AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";
