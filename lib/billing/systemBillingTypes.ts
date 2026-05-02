import type {
  CompanyId,
  CompanyPlanAssignment,
  PlanDefinition,
  StorageUsageSnapshot,
} from "./planTypes";

export interface SystemBillingCompanySummary {
  id: CompanyId;
  name: string;
  isActive: boolean;
  billingStatus?: string | null;
  assignedPlan?: CompanyPlanAssignment | null;
  plan?: PlanDefinition | null;
  storageUsage?: StorageUsageSnapshot | null;
  storageUsageRatio: number;
  effectiveStorageLimitBytes?: number | null;
  effectiveMemberLimit?: number | null;
  effectivePriceKrw?: number | null;
  memberCount: number;
}

export interface SystemBillingOverview {
  plans: PlanDefinition[];
  companies: SystemBillingCompanySummary[];
  generatedAt: string;
}
