import { randomUUID } from "node:crypto";

import { getCanonicalBillingPlan, type BillingPlanCode } from "./canonicalBillingPolicy";
import {
  checkDowngradeEligibility,
  quoteDowngradeRefund,
  quoteUpgradeProration,
} from "./subscriptionLifecyclePolicy";
import {
  getBillingSubscriptionState,
  insertBillingEvent,
  insertNotificationOutbox,
  runBillingOperationTransaction,
} from "./billingOperationsRepository";
import type { BillingOperationResult } from "./billingOperationsTypes";

function nextMonth(value: Date): Date {
  const next = new Date(value);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function requirePaidPlan(planCode: BillingPlanCode): Exclude<BillingPlanCode, "trial"> {
  if (planCode === "trial") throw new Error("BILLING_PAID_PLAN_REQUIRED");
  return planCode;
}

export function getRemainingCycleRatio(input: {
  now: Date;
  periodStartedAt: string | null;
  periodEndsAt: string | null;
}): number {
  if (!input.periodStartedAt || !input.periodEndsAt) return 1;
  const start = new Date(input.periodStartedAt).getTime();
  const end = new Date(input.periodEndsAt).getTime();
  const now = input.now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.min(1, Math.max(0, (end - now) / (end - start)));
}

export async function quoteCompanyPlanUpgrade(input: {
  companyId: string;
  targetPlanCode: Exclude<BillingPlanCode, "trial">;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const state = await getBillingSubscriptionState(input.companyId);
  if (!state) return null;
  const remainingRatio = getRemainingCycleRatio({
    now,
    periodStartedAt: state.billingPeriodStartedAt,
    periodEndsAt: state.billingPeriodEndsAt,
  });
  return quoteUpgradeProration({
    currentPlanCode: state.currentPlanCode,
    targetPlanCode: input.targetPlanCode,
    remainingRatio,
  });
}

export async function quoteCompanyPlanDowngrade(input: {
  companyId: string;
  targetPlanCode: Exclude<BillingPlanCode, "trial">;
  storageUsedBytes: number;
  activeMemberCount: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const state = await getBillingSubscriptionState(input.companyId);
  if (!state) return null;
  const eligibility = checkDowngradeEligibility({
    targetPlanCode: input.targetPlanCode,
    storageUsedBytes: input.storageUsedBytes,
    activeMemberCount: input.activeMemberCount,
  });
  const remainingRatio = getRemainingCycleRatio({
    now,
    periodStartedAt: state.billingPeriodStartedAt,
    periodEndsAt: state.billingPeriodEndsAt,
  });
  return {
    eligibility,
    quote: quoteDowngradeRefund({
      currentPlanCode: state.currentPlanCode,
      targetPlanCode: input.targetPlanCode,
      remainingRatio,
    }),
  };
}

export async function cancelCompanySubscriptionAtPeriodEnd(input: {
  companyId: string;
  actorUserId: string;
  now?: Date;
  idempotencyKey?: string;
}): Promise<BillingOperationResult> {
  const now = input.now ?? new Date();
  const idempotencyKey = input.idempotencyKey ?? `billing-cancel:${input.companyId}:${now.toISOString()}`;
  return runBillingOperationTransaction(async (client) => {
    const state = await getBillingSubscriptionState(input.companyId);
    if (!state) return { ok: false, code: "BILLING_SUBSCRIPTION_NOT_FOUND" };
    const changed = await client.query<{ id: string }>(
      `
        UPDATE billing_subscription_states
        SET cancel_at_period_end = true,
            cancel_scheduled_at = COALESCE(cancel_scheduled_at, $2),
            lifecycle_state = 'cancel_scheduled',
            state_reason = 'cancel_at_period_end',
            lock_version = lock_version + 1,
            updated_at = $2
        WHERE company_id = $1
          AND lifecycle_state IN ('trialing', 'active', 'past_due', 'restricted')
        RETURNING id
      `,
      [input.companyId, now],
    );
    if (changed.rowCount !== 1) return { ok: false, code: "BILLING_OPERATION_CONFLICT" };
    await insertBillingEvent(client, {
      companyId: input.companyId,
      eventType: "subscription.cancel_scheduled",
      idempotencyKey,
      actorUserId: input.actorUserId,
      payload: { cancelAtPeriodEnd: true },
    });
    await insertNotificationOutbox(client, {
      companyId: input.companyId,
      templateCode: "termination_warning",
      recipientScope: "company_admin",
      payload: { reason: "cancel_at_period_end" },
      idempotencyKey: `${idempotencyKey}:notification`,
    });
    return { ok: true, evidenceId: changed.rows[0].id };
  });
}

export async function reverseCompanySubscriptionCancellation(input: {
  companyId: string;
  actorUserId: string;
  now?: Date;
  idempotencyKey?: string;
}): Promise<BillingOperationResult> {
  const now = input.now ?? new Date();
  const idempotencyKey = input.idempotencyKey ?? `billing-reverse-cancel:${input.companyId}:${now.toISOString()}`;
  return runBillingOperationTransaction(async (client) => {
    const changed = await client.query<{ id: string }>(
      `
        UPDATE billing_subscription_states
        SET cancel_at_period_end = false,
            cancel_scheduled_at = NULL,
            lifecycle_state = CASE WHEN current_plan_code = 'trial' THEN 'trialing' ELSE 'active' END,
            state_reason = 'cancel_reversed',
            lock_version = lock_version + 1,
            updated_at = $2
        WHERE company_id = $1
          AND lifecycle_state = 'cancel_scheduled'
        RETURNING id
      `,
      [input.companyId, now],
    );
    if (changed.rowCount !== 1) return { ok: false, code: "BILLING_OPERATION_CONFLICT" };
    await insertBillingEvent(client, {
      companyId: input.companyId,
      eventType: "subscription.cancel_reversed",
      idempotencyKey,
      actorUserId: input.actorUserId,
      payload: { cancelAtPeriodEnd: false },
    });
    return { ok: true, evidenceId: changed.rows[0].id };
  });
}

export async function convertTrialToPaidWithSimulator(input: {
  companyId: string;
  success: boolean;
  now?: Date;
  idempotencyKey?: string;
}) {
  const now = input.now ?? new Date();
  const idempotencyKey = input.idempotencyKey ?? `trial-conversion:${input.companyId}:${now.toISOString()}`;
  return runBillingOperationTransaction(async (client) => {
    const state = await getBillingSubscriptionState(input.companyId);
    if (!state) return { ok: false, code: "BILLING_SUBSCRIPTION_NOT_FOUND" };
    if (state.cancelAtPeriodEnd) {
      await client.query(
        `
          UPDATE billing_subscription_states
          SET lifecycle_state = 'terminated',
              terminated_at = $2,
              state_reason = 'trial_canceled_at_period_end',
              updated_at = $2,
              lock_version = lock_version + 1
          WHERE company_id = $1
        `,
        [input.companyId, now],
      );
      return { ok: true, evidenceId: state.id };
    }
    const paidPlan = requirePaidPlan(state.selectedPaidPlanCode);
    const plan = getCanonicalBillingPlan(paidPlan);
    const invoiceId = randomUUID();
    const cycleId = randomUUID();
    const periodEndsAt = nextMonth(now);
    await client.query(
      `
        INSERT INTO billing_cycles (id, company_id, subscription_state_id, plan_code, period_started_at, period_ends_at, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'invoiced', $5)
      `,
      [cycleId, input.companyId, state.id, paidPlan, now, periodEndsAt],
    );
    await client.query(
      `
        INSERT INTO billing_invoices (id, company_id, billing_cycle_id, plan_code, subtotal_krw, total_krw, status, due_at, immutable_snapshot, idempotency_key, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8::jsonb, $9, $7, $7)
        ON CONFLICT (idempotency_key) DO NOTHING
      `,
      [
        invoiceId,
        input.companyId,
        cycleId,
        paidPlan,
        plan.monthlyPriceKrw ?? 0,
        input.success ? "paid" : "failed",
        now,
        JSON.stringify({ planCode: paidPlan, vatIncluded: true, simulator: true }),
        `${idempotencyKey}:invoice`,
      ],
    );
    await client.query(
      `
        INSERT INTO billing_payment_attempts (id, invoice_id, company_id, attempt_number, retry_day, amount_krw, result, safe_failure_code, provider_transaction_reference, idempotency_key, retryable, attempted_at, created_at)
        VALUES ($1, $2, $3, 1, 0, $4, $5, $6, $7, $8, $9, $10, $10)
        ON CONFLICT (invoice_id, retry_day) DO NOTHING
      `,
      [
        randomUUID(),
        invoiceId,
        input.companyId,
        plan.monthlyPriceKrw ?? 0,
        input.success ? "succeeded" : "failed",
        input.success ? null : "SIMULATED_PAYMENT_FAILED",
        input.success ? `sim-tx-${invoiceId}` : null,
        `${idempotencyKey}:attempt:0`,
        !input.success,
        now,
      ],
    );
    if (input.success) {
      await client.query(
        `
          UPDATE billing_subscription_states
          SET current_plan_code = selected_paid_plan_code,
              lifecycle_state = 'active',
              billing_period_started_at = $2,
              billing_period_ends_at = $3,
              next_charge_at = $3,
              next_charge_amount_krw = $4,
              state_reason = 'trial_conversion_success',
              lock_version = lock_version + 1,
              updated_at = $2
          WHERE company_id = $1
        `,
        [input.companyId, now, periodEndsAt, plan.monthlyPriceKrw ?? 0],
      );
      await insertNotificationOutbox(client, {
        companyId: input.companyId,
        templateCode: "trial_conversion_success",
        recipientScope: "company_admin",
        payload: { planCode: paidPlan, amountKrw: plan.monthlyPriceKrw ?? 0 },
        idempotencyKey: `${idempotencyKey}:notification`,
      });
      return { ok: true, evidenceId: invoiceId };
    }

    await client.query(
      `
        UPDATE billing_subscription_states
        SET lifecycle_state = 'past_due',
            state_reason = 'trial_conversion_failed',
            lock_version = lock_version + 1,
            updated_at = $2
        WHERE company_id = $1
      `,
      [input.companyId, now],
    );
    await insertNotificationOutbox(client, {
      companyId: input.companyId,
      templateCode: "payment_failed",
      recipientScope: "company_admin",
      payload: { planCode: paidPlan, safeFailureCode: "SIMULATED_PAYMENT_FAILED" },
      idempotencyKey: `${idempotencyKey}:notification`,
    });
    return { ok: true, evidenceId: invoiceId };
  });
}

export function getDeletionPlanDryRun(input: {
  companyId: string;
  legalHold: boolean;
  dbRowScopes: readonly string[];
  r2ObjectKeys: readonly string[];
}) {
  return {
    companyId: input.companyId,
    executeAllowedInProduction: false,
    legalHoldExcluded: input.legalHold,
    dbRowScopes: [...input.dbRowScopes],
    r2ObjectKeys: [...input.r2ObjectKeys],
    broadPrefixDelete: false,
    exactKeyOnly: true,
  };
}
