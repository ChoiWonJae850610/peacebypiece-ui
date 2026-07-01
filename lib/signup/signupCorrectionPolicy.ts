export const SIGNUP_CORRECTION_DEADLINE_DAYS = 3;

export function getSignupCorrectionDeadline(requestedAt: Date): Date {
  const dueAt = new Date(requestedAt);
  dueAt.setDate(dueAt.getDate() + SIGNUP_CORRECTION_DEADLINE_DAYS);
  return dueAt;
}

export function shouldAutoRejectSignupCorrection(input: {
  status: string;
  correctionDueAt: Date | null;
  now: Date;
}): boolean {
  return input.status === "changes_requested" &&
    input.correctionDueAt !== null &&
    input.correctionDueAt.getTime() <= input.now.getTime();
}

export function buildSignupCorrectionAutoRejectJob(input: {
  applicationId: string;
  correctionDueAt: Date;
}) {
  return {
    applicationId: input.applicationId,
    statusFrom: "changes_requested",
    statusTo: "rejected",
    reasonCode: "SIGNUP_CORRECTION_DEADLINE_EXPIRED",
    notificationTemplateCode: "signup_correction_deadline_soon",
    idempotencyKey: `signup-correction-auto-reject:${input.applicationId}:${input.correctionDueAt.toISOString()}`,
    mutationMode: "job_requires_dev_test_or_production_scheduler_approval",
  };
}
