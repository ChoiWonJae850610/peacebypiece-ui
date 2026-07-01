export const NOTIFICATION_OUTBOX_TEMPLATE_CODES = [
  "signup_submitted",
  "signup_changes_requested",
  "signup_correction_deadline_soon",
  "signup_approved",
  "trial_billing_notice_now",
  "trial_billing_notice_3_days",
  "trial_billing_notice_1_day",
  "payment_success",
  "payment_failed",
  "payment_restriction_started",
  "termination_scheduled",
  "deletion_warning_1_day",
  "deletion_completed",
  "company_export_ready",
  "company_export_expiring",
] as const;

export type NotificationOutboxTemplateCode = (typeof NOTIFICATION_OUTBOX_TEMPLATE_CODES)[number];

export const NOTIFICATION_OUTBOX_STATUSES = ["pending", "sent", "failed", "canceled"] as const;

const SENSITIVE_NOTIFICATION_KEYS = [
  "rawCardNumber",
  "cvc",
  "secret",
  "token",
  "rawProviderPayload",
  "rawR2Url",
  "signedUrl",
] as const;

export function assertNotificationPayloadIsSafe(payload: Record<string, unknown>): void {
  for (const key of SENSITIVE_NOTIFICATION_KEYS) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      throw new Error(`NOTIFICATION_PAYLOAD_SENSITIVE_KEY:${key}`);
    }
  }
}

export function createNotificationOutboxEvent(input: {
  templateCode: NotificationOutboxTemplateCode;
  recipientScope: "applicant" | "company_admin" | "system_admin";
  dedupeKey: string;
  payload: Record<string, unknown>;
}) {
  assertNotificationPayloadIsSafe(input.payload);
  return {
    templateCode: input.templateCode,
    recipientScope: input.recipientScope,
    dedupeKey: input.dedupeKey,
    payload: input.payload,
    status: "pending" as const,
    actualEmailDelivery: false,
  };
}
