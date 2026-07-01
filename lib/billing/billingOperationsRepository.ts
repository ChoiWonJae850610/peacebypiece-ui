import "server-only";

import { randomUUID } from "node:crypto";

import { queryDb, withDbTransaction, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";
import { getCanonicalBillingPlan, type BillingPlanCode } from "./canonicalBillingPolicy";
import { buildRetrySchedule } from "./subscriptionLifecyclePolicy";
import type {
  BillingRuntimeEnvironment,
  BillingSubscriptionLifecycleState,
  BillingSubscriptionStateRecord,
  PersistedPaymentMethodReference,
} from "./billingOperationsTypes";

type PaymentReferenceRow = DbQueryResultRow & {
  id: string;
  company_id: string;
  application_id: string | null;
  provider_code: "deferred_pg" | "fake_dev_test" | null;
  provider_customer_reference: string | null;
  payment_method_reference: string | null;
  masked_card_display: string | null;
  card_brand: string | null;
  readiness_state: PersistedPaymentMethodReference["readinessState"];
  verified_at: Date | string | null;
  revoked_at: Date | string | null;
  is_simulator: boolean;
  environment: BillingRuntimeEnvironment;
};

type SubscriptionStateRow = DbQueryResultRow & {
  id: string;
  company_id: string;
  subscription_id: string | null;
  selected_paid_plan_code: Exclude<BillingPlanCode, "trial">;
  current_plan_code: BillingPlanCode;
  lifecycle_state: BillingSubscriptionLifecycleState;
  billing_period_started_at: Date | string | null;
  billing_period_ends_at: Date | string | null;
  trial_started_at: Date | string | null;
  trial_ends_at: Date | string | null;
  next_charge_at: Date | string | null;
  next_charge_amount_krw: number | string;
  cancel_at_period_end: boolean;
  cancel_scheduled_at: Date | string | null;
  terminated_at: Date | string | null;
  recovery_deadline_at: Date | string | null;
  deletion_scheduled_at: Date | string | null;
  state_reason: string | null;
  lock_version: number | string;
};

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function toInt(value: unknown): number {
  const next = Number(value);
  return Number.isFinite(next) ? Math.trunc(next) : 0;
}

function mapPaymentReference(row: PaymentReferenceRow): PersistedPaymentMethodReference {
  return {
    id: row.id,
    companyId: row.company_id,
    applicationId: row.application_id,
    providerCode: row.provider_code,
    providerCustomerReference: row.provider_customer_reference,
    paymentMethodReference: row.payment_method_reference,
    maskedCardDisplay: row.masked_card_display,
    cardBrand: row.card_brand,
    readinessState: row.readiness_state,
    verifiedAt: iso(row.verified_at),
    revokedAt: iso(row.revoked_at),
    isSimulator: row.is_simulator,
    environment: row.environment,
  };
}

function mapSubscriptionState(row: SubscriptionStateRow): BillingSubscriptionStateRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    subscriptionId: row.subscription_id,
    selectedPaidPlanCode: row.selected_paid_plan_code,
    currentPlanCode: row.current_plan_code,
    lifecycleState: row.lifecycle_state,
    billingPeriodStartedAt: iso(row.billing_period_started_at),
    billingPeriodEndsAt: iso(row.billing_period_ends_at),
    trialStartedAt: iso(row.trial_started_at),
    trialEndsAt: iso(row.trial_ends_at),
    nextChargeAt: iso(row.next_charge_at),
    nextChargeAmountKrw: toInt(row.next_charge_amount_krw),
    cancelAtPeriodEnd: row.cancel_at_period_end,
    cancelScheduledAt: iso(row.cancel_scheduled_at),
    terminatedAt: iso(row.terminated_at),
    recoveryDeadlineAt: iso(row.recovery_deadline_at),
    deletionScheduledAt: iso(row.deletion_scheduled_at),
    stateReason: row.state_reason,
    lockVersion: toInt(row.lock_version),
  };
}

export async function getReadyPaymentMethodReference(input: {
  companyId?: string | null;
  applicationId?: string | null;
}): Promise<PersistedPaymentMethodReference | null> {
  const companyId = input.companyId?.trim() || null;
  const applicationId = input.applicationId?.trim() || null;
  if (!companyId && !applicationId) return null;

  try {
    const result = await queryDb<PaymentReferenceRow>(
      `
        SELECT
          id,
          company_id,
          application_id,
          provider_code,
          provider_customer_reference,
          payment_method_reference,
          masked_card_display,
          card_brand,
          readiness_state,
          verified_at,
          revoked_at,
          is_simulator,
          environment
        FROM company_payment_method_references
        WHERE readiness_state = 'ready'
          AND revoked_at IS NULL
          AND (($1::text IS NOT NULL AND company_id = $1::text) OR ($2::text IS NOT NULL AND application_id = $2::text))
        ORDER BY verified_at DESC NULLS LAST, updated_at DESC
        LIMIT 1
      `,
      [companyId, applicationId],
    );
    return result.rows[0] ? mapPaymentReference(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function upsertSimulatorPaymentReadiness(input: {
  companyId: string;
  applicationId?: string | null;
  providerCustomerReference?: string | null;
  maskedCardDisplay?: string | null;
  environment: BillingRuntimeEnvironment;
  idempotencyKey: string;
  now?: Date;
}): Promise<PersistedPaymentMethodReference> {
  const now = input.now ?? new Date();
  const result = await queryDb<PaymentReferenceRow>(
    `
      INSERT INTO company_payment_method_references (
        id,
        company_id,
        application_id,
        provider_code,
        provider_customer_reference,
        payment_method_reference,
        masked_card_display,
        card_brand,
        readiness_state,
        verified_at,
        is_simulator,
        environment,
        idempotency_key,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'fake_dev_test', $4, $5, $6, 'SIMULATOR', 'ready', $7, true, $8, $9, $7, $7)
      ON CONFLICT (idempotency_key) DO UPDATE SET
        readiness_state = 'ready',
        verified_at = COALESCE(company_payment_method_references.verified_at, EXCLUDED.verified_at),
        updated_at = EXCLUDED.updated_at
      RETURNING
        id,
        company_id,
        application_id,
        provider_code,
        provider_customer_reference,
        payment_method_reference,
        masked_card_display,
        card_brand,
        readiness_state,
        verified_at,
        revoked_at,
        is_simulator,
        environment
    `,
    [
      randomUUID(),
      input.companyId,
      input.applicationId ?? null,
      input.providerCustomerReference ?? "fake-dev-test-customer",
      "fake-dev-test-payment-reference",
      input.maskedCardDisplay ?? "FAKE-DEV-TEST",
      now,
      input.environment,
      input.idempotencyKey,
    ],
  );
  return mapPaymentReference(result.rows[0]);
}

export async function getBillingSubscriptionState(companyId: string): Promise<BillingSubscriptionStateRecord | null> {
  const result = await queryDb<SubscriptionStateRow>(
    `
      SELECT
        id,
        company_id,
        subscription_id,
        selected_paid_plan_code,
        current_plan_code,
        lifecycle_state,
        billing_period_started_at,
        billing_period_ends_at,
        trial_started_at,
        trial_ends_at,
        next_charge_at,
        next_charge_amount_krw,
        cancel_at_period_end,
        cancel_scheduled_at,
        terminated_at,
        recovery_deadline_at,
        deletion_scheduled_at,
        state_reason,
        lock_version
      FROM billing_subscription_states
      WHERE company_id = $1::text
      LIMIT 1
    `,
    [companyId],
  );
  return result.rows[0] ? mapSubscriptionState(result.rows[0]) : null;
}

export async function createTrialBillingState(input: {
  client: DbTransactionClient;
  companyId: string;
  subscriptionId: string;
  selectedPaidPlanCode: Exclude<BillingPlanCode, "trial">;
  trialStartedAt: Date;
  trialEndsAt: Date;
  idempotencyKey: string;
}): Promise<string> {
  const selectedPlan = getCanonicalBillingPlan(input.selectedPaidPlanCode);
  const result = await input.client.query<{ id: string }>(
    `
      INSERT INTO billing_subscription_states (
        id,
        company_id,
        subscription_id,
        selected_paid_plan_code,
        current_plan_code,
        lifecycle_state,
        billing_period_started_at,
        billing_period_ends_at,
        trial_started_at,
        trial_ends_at,
        next_charge_at,
        next_charge_amount_krw,
        state_reason,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'trial', 'trialing', $5, $6, $5, $6, $6, $7, 'signup_approval', $5, $5)
      ON CONFLICT (company_id) DO UPDATE SET
        subscription_id = COALESCE(billing_subscription_states.subscription_id, EXCLUDED.subscription_id),
        selected_paid_plan_code = COALESCE(billing_subscription_states.selected_paid_plan_code, EXCLUDED.selected_paid_plan_code),
        lifecycle_state = CASE
          WHEN billing_subscription_states.lifecycle_state = 'pending_payment_readiness' THEN 'trialing'
          ELSE billing_subscription_states.lifecycle_state
        END,
        trial_started_at = COALESCE(billing_subscription_states.trial_started_at, EXCLUDED.trial_started_at),
        trial_ends_at = COALESCE(billing_subscription_states.trial_ends_at, EXCLUDED.trial_ends_at),
        next_charge_at = COALESCE(billing_subscription_states.next_charge_at, EXCLUDED.next_charge_at),
        next_charge_amount_krw = EXCLUDED.next_charge_amount_krw,
        updated_at = EXCLUDED.updated_at
      RETURNING id
    `,
    [
      randomUUID(),
      input.companyId,
      input.subscriptionId,
      input.selectedPaidPlanCode,
      input.trialStartedAt,
      input.trialEndsAt,
      selectedPlan.monthlyPriceKrw ?? 0,
    ],
  );
  await insertBillingEvent(input.client, {
    companyId: input.companyId,
    eventType: "trial_started",
    idempotencyKey: input.idempotencyKey,
    payload: {
      subscriptionId: input.subscriptionId,
      selectedPaidPlanCode: input.selectedPaidPlanCode,
      nextChargeAmountKrw: selectedPlan.monthlyPriceKrw ?? 0,
    },
  });
  return result.rows[0].id;
}

export async function insertBillingEvent(
  client: DbTransactionClient,
  input: {
    companyId: string | null;
    eventType: string;
    idempotencyKey: string;
    payload: Record<string, unknown>;
    actorUserId?: string | null;
  },
): Promise<void> {
  await client.query(
    `
      INSERT INTO billing_events (
        id,
        company_id,
        event_type,
        idempotency_key,
        safe_payload,
        actor_user_id,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6, now())
      ON CONFLICT (idempotency_key) DO NOTHING
    `,
    [
      randomUUID(),
      input.companyId,
      input.eventType,
      input.idempotencyKey,
      JSON.stringify(input.payload),
      input.actorUserId ?? null,
    ],
  );
}

export async function insertNotificationOutbox(
  client: DbTransactionClient,
  input: {
    companyId?: string | null;
    userId?: string | null;
    templateCode: string;
    recipientScope: "applicant" | "company_admin" | "system_admin";
    payload: Record<string, unknown>;
    idempotencyKey: string;
    scheduledAt?: Date;
    environment?: BillingRuntimeEnvironment;
  },
): Promise<void> {
  await client.query(
    `
      INSERT INTO billing_notification_outbox (
        id,
        company_id,
        user_id,
        template_code,
        recipient_scope,
        safe_payload,
        status,
        scheduled_at,
        environment,
        idempotency_key,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'pending', $7, $8, $9, now(), now())
      ON CONFLICT (idempotency_key) DO NOTHING
    `,
    [
      randomUUID(),
      input.companyId ?? null,
      input.userId ?? null,
      input.templateCode,
      input.recipientScope,
      JSON.stringify(input.payload),
      input.scheduledAt ?? new Date(),
      input.environment ?? "dev_test",
      input.idempotencyKey,
    ],
  );
}

export async function runBillingOperationTransaction<TResult>(
  operation: (client: DbTransactionClient) => Promise<TResult>,
): Promise<TResult> {
  return withDbTransaction(operation);
}

export async function createFailedPaymentRetryEvidence(input: {
  client: DbTransactionClient;
  companyId: string;
  invoiceId: string;
  failedAt: Date;
  amountKrw: number;
  idempotencyPrefix: string;
}): Promise<void> {
  const schedule = buildRetrySchedule(input.failedAt);
  for (const slot of schedule) {
    await input.client.query(
      `
        INSERT INTO billing_retry_schedules (
          id,
          company_id,
          invoice_id,
          retry_day,
          due_at,
          status,
          idempotency_key,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', $6, now(), now())
        ON CONFLICT (invoice_id, retry_day) DO NOTHING
      `,
      [
        randomUUID(),
        input.companyId,
        input.invoiceId,
        slot.dayOffset,
        slot.dueAt,
        `${input.idempotencyPrefix}:retry:${slot.dayOffset}`,
      ],
    );
  }
}
