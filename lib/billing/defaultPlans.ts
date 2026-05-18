import type { PlanDefinition } from "./planTypes";
import {
  DEFAULT_PLAN_CODES,
  DEFAULT_PLAN_MEMBER_LIMITS,
  DEFAULT_PLAN_STORAGE_LIMITS,
} from "./planPolicy";

const defaultFeatures = {
  workorderLimitEnabled: false,
  inventoryEnabled: true,
  systemStatsEnabled: false,
  advancedStatsEnabled: false,
  invitationEnabled: true,
  storageManagementEnabled: true,
};

export const DEFAULT_PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "plan-trial",
    code: DEFAULT_PLAN_CODES.TRIAL,
    name: "Trial",
    status: "active",
    billingCycle: "monthly",
    priceKrw: 0,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.TRIAL,
      maxStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.STARTER,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.TRIAL,
      maxMembers: DEFAULT_PLAN_MEMBER_LIMITS.STARTER,
      allowMemberOverride: true,
    },
    features: defaultFeatures,
  },
  {
    id: "plan-starter",
    code: DEFAULT_PLAN_CODES.STARTER,
    name: "Starter",
    status: "draft",
    billingCycle: "monthly",
    priceKrw: 29000,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.STARTER,
      maxStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.TEAM,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.STARTER,
      maxMembers: DEFAULT_PLAN_MEMBER_LIMITS.TEAM,
      allowMemberOverride: true,
    },
    features: defaultFeatures,
  },
  {
    id: "plan-team",
    code: DEFAULT_PLAN_CODES.TEAM,
    name: "Team",
    status: "draft",
    billingCycle: "monthly",
    priceKrw: 79000,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.TEAM,
      maxStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.BUSINESS,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.TEAM,
      maxMembers: DEFAULT_PLAN_MEMBER_LIMITS.BUSINESS,
      allowMemberOverride: true,
    },
    features: {
      ...defaultFeatures,
      advancedStatsEnabled: true,
    },
  },
  {
    id: "plan-business",
    code: DEFAULT_PLAN_CODES.BUSINESS,
    name: "Business",
    status: "draft",
    billingCycle: "monthly",
    priceKrw: 199000,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.BUSINESS,
      maxStorageBytes: null,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.BUSINESS,
      maxMembers: null,
      allowMemberOverride: true,
    },
    features: {
      ...defaultFeatures,
      systemStatsEnabled: true,
      advancedStatsEnabled: true,
    },
  },
];
