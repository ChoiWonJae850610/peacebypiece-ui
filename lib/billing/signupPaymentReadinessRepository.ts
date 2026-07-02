import "server-only";

import { randomUUID } from "node:crypto";

import { queryDb, type DbQueryResultRow, type DbTransactionClient } from "@/lib/db/client";
import type { BillingRuntimeEnvironment, PersistedPaymentMethodReference } from "./billingOperationsTypes";

type SignupPaymentReadinessRow = DbQueryResultRow & {
  id: string;
  application_id: string;
  provider_code: PersistedPaymentMethodReference["providerCode"];
  provider_customer_reference: string | null;
  payment_method_reference: string | null;
  masked_display: string | null;
  brand: string | null;
  readiness_state: PersistedPaymentMethodReference["readinessState"];
  verified_at: Date | string | null;
  revoked_at: Date | string | null;
  is_simulator: boolean;
  environment: BillingRuntimeEnvironment;
};

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapRow(row: SignupPaymentReadinessRow): PersistedPaymentMethodReference {
  return {
    id: row.id,
    companyId: "",
    applicationId: row.application_id,
    providerCode: row.provider_code,
    providerCustomerReference: row.provider_customer_reference,
    paymentMethodReference: row.payment_method_reference,
    maskedCardDisplay: row.masked_display,
    cardBrand: row.brand,
    readinessState: row.readiness_state,
    verifiedAt: iso(row.verified_at),
    revokedAt: iso(row.revoked_at),
    isSimulator: row.is_simulator,
    environment: row.environment,
  };
}

const SELECT_SIGNUP_READINESS = `
  SELECT
    id,
    application_id,
    provider_code,
    provider_customer_reference,
    payment_method_reference,
    masked_display,
    brand,
    readiness_state,
    verified_at,
    revoked_at,
    is_simulator,
    environment
  FROM signup_payment_method_references
`;

export async function getSignupPaymentReadiness(applicationId: string): Promise<PersistedPaymentMethodReference | null> {
  const id = applicationId.trim();
  if (!id) return null;
  try {
    const result = await queryDb<SignupPaymentReadinessRow>(
      `
        ${SELECT_SIGNUP_READINESS}
        WHERE application_id = $1
          AND readiness_state = 'ready'
          AND revoked_at IS NULL
        ORDER BY verified_at DESC NULLS LAST, updated_at DESC, id DESC
        LIMIT 1
      `,
      [id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function upsertSignupSimulatorPaymentReadiness(input: {
  applicationId: string;
  actorSystemUserId: string;
  environment: BillingRuntimeEnvironment;
  idempotencyKey: string;
  now?: Date;
}): Promise<PersistedPaymentMethodReference> {
  const now = input.now ?? new Date();
  const result = await queryDb<SignupPaymentReadinessRow>(
    `
      INSERT INTO signup_payment_method_references (
        id,
        application_id,
        provider_code,
        provider_customer_reference,
        payment_method_reference,
        masked_display,
        brand,
        readiness_state,
        verified_at,
        is_simulator,
        environment,
        created_by_system_user_id,
        idempotency_key,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'fake_dev_test', 'fake-dev-test-customer', 'fake-dev-test-payment-reference',
        'FAKE-DEV-TEST', 'SIMULATOR', 'ready', $3, true, $4, $5, $6, $3, $3)
      ON CONFLICT (idempotency_key) DO UPDATE SET
        readiness_state = 'ready',
        revoked_at = NULL,
        verified_at = COALESCE(signup_payment_method_references.verified_at, EXCLUDED.verified_at),
        updated_at = EXCLUDED.updated_at
      RETURNING
        id,
        application_id,
        provider_code,
        provider_customer_reference,
        payment_method_reference,
        masked_display,
        brand,
        readiness_state,
        verified_at,
        revoked_at,
        is_simulator,
        environment
    `,
    [
      randomUUID(),
      input.applicationId,
      now,
      input.environment,
      input.actorSystemUserId,
      input.idempotencyKey,
    ],
  );
  return mapRow(result.rows[0]);
}

export async function revokeSignupPaymentReadiness(input: {
  applicationId: string;
  actorSystemUserId: string;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  await queryDb(
    `
      UPDATE signup_payment_method_references
      SET readiness_state = 'revoked',
          revoked_at = COALESCE(revoked_at, $2),
          revoked_by_system_user_id = $3,
          updated_at = $2
      WHERE application_id = $1
        AND readiness_state = 'ready'
        AND revoked_at IS NULL
    `,
    [input.applicationId, now, input.actorSystemUserId],
  );
}

export async function copySignupReadinessToCompanyPaymentReference(input: {
  client: DbTransactionClient;
  applicationId: string;
  companyId: string;
  now: Date;
}): Promise<void> {
  await input.client.query(
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
      SELECT
        gen_random_uuid()::text,
        $2,
        signup_ready.application_id,
        signup_ready.provider_code,
        signup_ready.provider_customer_reference,
        signup_ready.payment_method_reference,
        signup_ready.masked_display,
        signup_ready.brand,
        signup_ready.readiness_state,
        COALESCE(signup_ready.verified_at, $3),
        signup_ready.is_simulator,
        signup_ready.environment,
        'signup-approval-payment-reference:' || signup_ready.application_id,
        $3,
        $3
      FROM signup_payment_method_references signup_ready
      WHERE signup_ready.application_id = $1
        AND signup_ready.readiness_state = 'ready'
        AND signup_ready.revoked_at IS NULL
      ORDER BY signup_ready.verified_at DESC NULLS LAST, signup_ready.updated_at DESC, signup_ready.id DESC
      LIMIT 1
      ON CONFLICT (idempotency_key) DO NOTHING
    `,
    [input.applicationId, input.companyId, input.now],
  );
}
