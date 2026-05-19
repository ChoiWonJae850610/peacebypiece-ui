export type CompanyThemeColor = "blue" | "emerald" | "violet" | "stone";
export type CompanyLanguage = "ko" | "en";

export type CompanyOnboardingStatus =
  | "profile_required"
  | "approval_pending"
  | "active"
  | "rejected";

export type CompanySubscriptionStatus =
  | "trialing"
  | "trial_expired"
  | "active"
  | "past_due"
  | "canceled";

export type CompanyOnboardingFileType = "logo" | "business_license";

export type CompanyOnboardingFileMetadata = {
  id: string;
  companyId: string;
  fileType: CompanyOnboardingFileType;
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByUserId?: string | null;
  createdAt?: string | null;
  deletedAt?: string | null;
};

export type CompanyOnboardingProfile = {
  companyId: string;
  companyName: string;
  companyEnglishName: string;
  businessName: string;
  businessRegistrationNumber: string;
  logoUrl: string;
  postalCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  addressExtra: string;
  requestedPlanCode: string;
  onboardingStatus: CompanyOnboardingStatus;
  onboardingCompletedAt?: string | null;
  subscriptionStatus: CompanySubscriptionStatus;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  trialExpired: boolean;
  adminName: string;
  adminPhone: string;
  profileComplete: boolean;
  onboardingFiles?: CompanyOnboardingFileMetadata[];
};

export type CompanyOnboardingUpdateInput = {
  companyName?: string | null;
  companyEnglishName?: string | null;
  businessName?: string | null;
  businessRegistrationNumber?: string | null;
  logoUrl?: string | null;
  postalCode?: string | null;
  roadAddress?: string | null;
  jibunAddress?: string | null;
  addressDetail?: string | null;
  addressExtra?: string | null;
  requestedPlanCode?: string | null;
  adminName?: string | null;
  adminPhone?: string | null;
};


export type CompanyFilePolicySettings = {
  softDeleteEnabled: boolean;
  includeTrashInUsage: boolean;
  trashRetentionDays: number;
  storageLimitGb: number;
  warningThresholdPercent: number;
};

export type CompanyNotificationPolicySettings = {
  reviewRequestEnabled: boolean;
  orderReadyEnabled: boolean;
  storageWarningEnabled: boolean;
  purgeResultEnabled: boolean;
};

export type CompanyUiSettings = {
  themeColor: CompanyThemeColor;
  language: CompanyLanguage;
  compactMode: boolean;
};

export type CompanySettings = {
  companyId: string;
  ui: CompanyUiSettings;
  filePolicy: CompanyFilePolicySettings;
  notificationPolicy: CompanyNotificationPolicySettings;
  updatedAt?: string | null;
};

export type CompanySettingsUpdateInput = {
  ui?: Partial<CompanyUiSettings>;
  filePolicy?: Partial<CompanyFilePolicySettings>;
  notificationPolicy?: Partial<CompanyNotificationPolicySettings>;
};

export type AdminCompanySummary = {
  id: string;
  name: string;
  memo?: string | null;
  isActive: boolean;
  englishName?: string | null;
  businessName?: string | null;
  businessRegistrationNumber?: string | null;
  postalCode?: string | null;
  roadAddress?: string | null;
  jibunAddress?: string | null;
  addressDetail?: string | null;
  addressExtra?: string | null;
  requestedPlanCode?: string | null;
  onboardingStatus?: CompanyOnboardingStatus | null;
  subscriptionStatus?: CompanySubscriptionStatus | null;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  ownerUserId?: string | null;
  status?: string | null;
  planCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
