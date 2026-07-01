import { isServerProductionRuntime } from "@/lib/runtime/serverRuntime";

export const PAYMENT_REFERENCE_PROVIDER_CODES = ["deferred_pg", "fake_dev_test"] as const;
export type PaymentReferenceProviderCode = (typeof PAYMENT_REFERENCE_PROVIDER_CODES)[number];

export const RAW_PAYMENT_DATA_FORBIDDEN_KEYS = [
  "cardNumber",
  "cvc",
  "cvv",
  "cardPassword",
  "residentRegistrationNumber",
  "expiryMonth",
  "expiryYear",
  "rawAuthorizationHeader",
  "providerSecret",
  "webhookSecret",
  "rawProviderRequest",
  "rawProviderResponse",
] as const;

export type PaymentMethodReference = {
  providerCode: PaymentReferenceProviderCode | null;
  providerCustomerReference: string | null;
  billingKeyReference: string | null;
  maskedCardDisplay: string | null;
  cardBrand: string | null;
  readiness: "ready" | "not_ready" | "blocked_pending_provider";
};

export function hasForbiddenRawPaymentData(payload: Record<string, unknown>): boolean {
  return RAW_PAYMENT_DATA_FORBIDDEN_KEYS.some((key) => Object.prototype.hasOwnProperty.call(payload, key));
}

export function canUseFakePaymentMethodReference(input: {
  runtime?: "production" | "non_production";
} = {}): boolean {
  if (input.runtime) return input.runtime !== "production";
  return !isServerProductionRuntime();
}

export function createPaymentReadinessReference(input: {
  providerCode: PaymentReferenceProviderCode | null;
  billingKeyReference: string | null;
  maskedCardDisplay?: string | null;
  runtime?: "production" | "non_production";
}): PaymentMethodReference {
  if (input.providerCode === "fake_dev_test" && !canUseFakePaymentMethodReference({ runtime: input.runtime })) {
    return {
      providerCode: input.providerCode,
      providerCustomerReference: null,
      billingKeyReference: null,
      maskedCardDisplay: null,
      cardBrand: null,
      readiness: "blocked_pending_provider",
    };
  }

  return {
    providerCode: input.providerCode,
    providerCustomerReference: null,
    billingKeyReference: input.billingKeyReference,
    maskedCardDisplay: input.maskedCardDisplay ?? null,
    cardBrand: null,
    readiness: input.providerCode && input.billingKeyReference ? "ready" : "not_ready",
  };
}
