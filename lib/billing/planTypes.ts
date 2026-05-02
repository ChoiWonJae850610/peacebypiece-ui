export type PlanId = string;
export type CompanyId = string;

export type BillingCycle = "monthly" | "yearly";
export type PlanStatus = "draft" | "active" | "archived";
export type CompanyPlanAssignmentStatus = "active" | "scheduled" | "expired";

export interface StorageLimitPolicy {
  includedStorageBytes: number;
  maxStorageBytes?: number | null;
  allowStorageOverride: boolean;
}

export interface MemberLimitPolicy {
  includedMembers: number;
  maxMembers?: number | null;
  allowMemberOverride: boolean;
}

export interface PlanFeatureFlags {
  workorderLimitEnabled: boolean;
  inventoryEnabled: boolean;
  systemStatsEnabled: boolean;
  advancedStatsEnabled: boolean;
  invitationEnabled: boolean;
  storageManagementEnabled: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  code: string;
  name: string;
  status: PlanStatus;
  billingCycle: BillingCycle;
  priceKrw: number;
  storage: StorageLimitPolicy;
  members: MemberLimitPolicy;
  features: PlanFeatureFlags;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CompanyPlanOverride {
  storageLimitBytes?: number | null;
  memberLimit?: number | null;
  priceKrw?: number | null;
  memo?: string | null;
}

export interface CompanyPlanAssignment {
  id: string;
  companyId: CompanyId;
  planId: PlanId;
  status: CompanyPlanAssignmentStatus;
  override?: CompanyPlanOverride | null;
  startsAt: string;
  endsAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ResolvedCompanyPlanPolicy {
  companyId: CompanyId;
  planId: PlanId;
  planCode: string;
  planName: string;
  storageLimitBytes: number;
  memberLimit: number;
  priceKrw: number;
  features: PlanFeatureFlags;
  source: {
    storage: "plan" | "override";
    member: "plan" | "override";
    price: "plan" | "override";
  };
}

export interface StorageUsageSnapshot {
  id: string;
  companyId: CompanyId;
  usedBytes: number;
  attachmentCount: number;
  measuredAt: string;
  source: "db_attachment_metadata" | "r2_inventory" | "manual";
}
