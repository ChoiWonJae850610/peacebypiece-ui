import SystemAuditLogsDesignPage from "@/components/system/audit/SystemAuditLogsDesignPage";
import { getSystemAuditLogPageData } from "@/lib/system/audit/pageData";
import type {
  ListSystemAuditLogsInput,
  SystemAuditLogEventType,
  SystemAuditLogFilter,
  SystemAuditSeverity,
  SystemAuditTargetType,
} from "@/lib/system/audit/types";

type SystemAuditLogsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const TARGET_TYPES = new Set<SystemAuditTargetType>([
  "company",
  "member",
  "invitation",
  "plan",
  "storage",
  "material",
  "work_order",
  "file",
  "memo",
  "settings",
  "auth",
  "system",
]);

const SEVERITIES = new Set<SystemAuditSeverity>([
  "low",
  "medium",
  "high",
  "critical",
]);

function getParam(params: Record<string, string | string[] | undefined>, key: string): string | null {
  const value = params[key];
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof firstValue === "string" ? firstValue.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

function getLimit(params: Record<string, string | string[] | undefined>): number {
  const value = Number(getParam(params, "limit") || 200);
  if (!Number.isFinite(value)) return 200;
  return Math.min(Math.max(Math.trunc(value), 1), 500);
}

function getTargetType(params: Record<string, string | string[] | undefined>): SystemAuditTargetType | null {
  const value = getParam(params, "targetType");
  if (!value || value === "all") return null;
  return TARGET_TYPES.has(value as SystemAuditTargetType) ? (value as SystemAuditTargetType) : null;
}

function getSeverity(params: Record<string, string | string[] | undefined>): SystemAuditSeverity | null {
  const value = getParam(params, "severity");
  if (!value || value === "all") return null;
  return SEVERITIES.has(value as SystemAuditSeverity) ? (value as SystemAuditSeverity) : null;
}

function toListInput(params: Record<string, string | string[] | undefined>): ListSystemAuditLogsInput {
  return {
    companyId: getParam(params, "companyId"),
    targetType: getTargetType(params),
    eventType: (getParam(params, "eventType") as SystemAuditLogEventType | null) || null,
    severity: getSeverity(params),
    limit: getLimit(params),
  };
}

function toUiFilter(params: Record<string, string | string[] | undefined>): SystemAuditLogFilter {
  return {
    query: getParam(params, "query") || undefined,
    companyId: getParam(params, "companyId") || undefined,
    targetType: getTargetType(params) || "all",
    severity: getSeverity(params) || "all",
  };
}

export default async function SystemAuditLogsPage({ searchParams }: SystemAuditLogsPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const filter = toUiFilter(resolvedSearchParams);
  const pageData = await getSystemAuditLogPageData({
    listInput: toListInput(resolvedSearchParams),
    filter,
  });

  return (
    <SystemAuditLogsDesignPage
      activeFilter={filter}
      auditLogViewModels={pageData.viewModels}
    />
  );
}
