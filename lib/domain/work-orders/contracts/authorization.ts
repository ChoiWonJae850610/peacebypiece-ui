import type { CompanyId, CompanyMemberId, CorrelationId } from "@/lib/domain/work-orders/contracts/primitives";

export type TenantMemberScope = {
  readonly mode: "tenant_member";
  readonly companyId: CompanyId;
  readonly companyMemberId: CompanyMemberId;
  readonly permissionCodes: readonly string[];
  readonly correlationId: CorrelationId;
};

export type PrivilegedSystemScope = {
  readonly mode: "privileged_system";
  readonly systemActorId: string;
  readonly targetCompanyId: CompanyId;
  readonly reason: string;
  readonly auditRequired: true;
  readonly correlationId: CorrelationId;
};

export type WorkOrderAuthorizationScope = TenantMemberScope | PrivilegedSystemScope;

export type RlsSessionClaims = {
  readonly companyId: CompanyId | null;
  readonly companyMemberId: CompanyMemberId | null;
  readonly privilegedSystemAccess: boolean;
  readonly correlationId: CorrelationId;
};
