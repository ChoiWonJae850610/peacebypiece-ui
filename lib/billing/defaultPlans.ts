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
      maxStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.LITE,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.TRIAL,
      maxMembers: DEFAULT_PLAN_MEMBER_LIMITS.LITE,
      allowMemberOverride: true,
    },
    features: defaultFeatures,
  },
  {
    id: "plan-lite",
    code: DEFAULT_PLAN_CODES.LITE,
    name: "Lite",
    status: "active",
    billingCycle: "monthly",
    priceKrw: 9900,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.LITE,
      maxStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.FLOW,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.LITE,
      maxMembers: DEFAULT_PLAN_MEMBER_LIMITS.FLOW,
      allowMemberOverride: true,
    },
    features: defaultFeatures,
  },
  {
    id: "plan-flow",
    code: DEFAULT_PLAN_CODES.FLOW,
    name: "Flow",
    status: "active",
    billingCycle: "monthly",
    priceKrw: 19900,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.FLOW,
      maxStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.STUDIO,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.FLOW,
      maxMembers: DEFAULT_PLAN_MEMBER_LIMITS.STUDIO,
      allowMemberOverride: true,
    },
    features: {
      ...defaultFeatures,
      advancedStatsEnabled: true,
    },
  },
  {
    id: "plan-studio",
    code: DEFAULT_PLAN_CODES.STUDIO,
    name: "Studio",
    status: "active",
    billingCycle: "monthly",
    priceKrw: 39900,
    storage: {
      includedStorageBytes: DEFAULT_PLAN_STORAGE_LIMITS.STUDIO,
      maxStorageBytes: null,
      allowStorageOverride: true,
    },
    members: {
      includedMembers: DEFAULT_PLAN_MEMBER_LIMITS.STUDIO,
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
