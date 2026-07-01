import type { BillingPlanCode } from "./canonicalBillingPolicy";

export type BillingRuntimeEnvironment =
  | "local"
  | "development"
  | "test"
  | "preview"
  | "production"
  | "dev_test";

export type PaymentReadinessState =
  | "ready"
  | "not_ready"
  | "blocked_pending_provider"
  | "revoked";

export type BillingSubscriptionLifecycleState =
  | "pending_payment_readiness"
  | "trialing"
  | "active"
  | "cancel_scheduled"
  | "past_due"
  | "restricted"
  | "terminated"
  | "recovery_window"
  | "deletion_scheduled"
  | "deleted"
  | "suspended_internal"
  | "legal_hold";

export type BillingOperationSafeCode =
  | "BILLING_PAYMENT_READINESS_REQUIRED"
  | "BILLING_PRODUCTION_FAKE_PAYMENT_BLOCKED"
  | "BILLING_SUBSCRIPTION_NOT_FOUND"
  | "BILLING_DOWNGRADE_INELIGIBLE"
  | "BILLING_OPERATION_CONFLICT"
  | "BILLING_OPERATION_FAILED";

export type PersistedPaymentMethodReference = {
  id: string;
  companyId: string;
  applicationId: string | null;
  providerCode: "deferred_pg" | "fake_dev_test" | null;
  providerCustomerReference: string | null;
  paymentMethodReference: string | null;
  maskedCardDisplay: string | null;
  cardBrand: string | null;
  readinessState: PaymentReadinessState;
  verifiedAt: string | null;
  revokedAt: string | null;
  isSimulator: boolean;
  environment: BillingRuntimeEnvironment;
};

export type BillingSubscriptionStateRecord = {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  selectedPaidPlanCode: Exclude<BillingPlanCode, "trial">;
  currentPlanCode: BillingPlanCode;
  lifecycleState: BillingSubscriptionLifecycleState;
  billingPeriodStartedAt: string | null;
  billingPeriodEndsAt: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  nextChargeAt: string | null;
  nextChargeAmountKrw: number;
  cancelAtPeriodEnd: boolean;
  cancelScheduledAt: string | null;
  terminatedAt: string | null;
  recoveryDeadlineAt: string | null;
  deletionScheduledAt: string | null;
  stateReason: string | null;
  lockVersion: number;
};

export type BillingOperationResult = {
  ok: boolean;
  code?: BillingOperationSafeCode;
  subscription?: BillingSubscriptionStateRecord;
  evidenceId?: string;
};
