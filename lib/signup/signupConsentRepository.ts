import type { DbQueryResult, DbQueryResultRow, DbTransactionClient } from "@/lib/db/client";
import { queryDb, withDbTransaction } from "@/lib/db/client";

import type { SignupApplicationOwner } from "./signupApplicationRepository";
import type { SignupConsentPolicy, SignupConsentType } from "./signupConsentPolicy";

export type SignupApplicationConsentRecord = {
  id: string;
  applicationId: string;
  consentType: SignupConsentType;
  policyCode: string;
  policyVersion: string;
  agreedAt: string;
  agreedEmailNormalized: string;
  agreedGoogleSub: string;
  revokedAt: string | null;
  revokeReasonCode: string | null;
  createdAt: string;
  updatedAt: string;
};

type SignupApplicationConsentRow = DbQueryResultRow & {
  id: string;
  application_id: string;
  consent_type: SignupConsentType;
  policy_code: string;
  policy_version: string;
  agreed_at: Date | string;
  agreed_email_normalized: string;
  agreed_google_sub: string;
  revoked_at: Date | string | null;
  revoke_reason_code: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type SignupApplicationLockRow = DbQueryResultRow & {
  id: string;
};

type Queryable = {
  query: <TRow extends DbQueryResultRow = DbQueryResultRow>(text: string, params?: unknown[]) => Promise<DbQueryResult<TRow>>;
};

export type SignupConsentRepository = {
  listActiveConsents(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
  }): Promise<SignupApplicationConsentRecord[]>;
  createCurrentConsent(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    policy: SignupConsentPolicy;
    now: Date;
  }): Promise<SignupApplicationConsentRecord>;
  revokeActiveConsent(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    consentType: SignupConsentType;
    now: Date;
    reasonCode: string;
  }): Promise<SignupApplicationConsentRecord | null>;
  assertRequiredActiveConsents(input: {
    applicationId: string;
    owner: SignupApplicationOwner;
    policies: readonly SignupConsentPolicy[];
  }): Promise<void>;
};

export class SignupConsentConflictError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "SignupConsentConflictError";
  }
}

const SIGNUP_CONSENT_RETURNING_COLUMNS = `
  id,
  application_id,
  consent_type,
  policy_code,
  policy_version,
  agreed_at,
  agreed_email_normalized,
  agreed_google_sub,
  revoked_at,
  revoke_reason_code,
  created_at,
  updated_at
`;

function getQueryable(client?: DbTransactionClient | null): Queryable {
  return client ?? { query: queryDb };
}

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapConsentRow(row: SignupApplicationConsentRow): SignupApplicationConsentRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    consentType: row.consent_type,
    policyCode: row.policy_code,
    policyVersion: row.policy_version,
    agreedAt: iso(row.agreed_at) ?? "",
    agreedEmailNormalized: row.agreed_email_normalized,
    agreedGoogleSub: row.agreed_google_sub,
    revokedAt: iso(row.revoked_at),
    revokeReasonCode: row.revoke_reason_code,
    createdAt: iso(row.created_at) ?? "",
    updatedAt: iso(row.updated_at) ?? "",
  };
}

function oneOrConflict(result: DbQueryResult<SignupApplicationConsentRow>, code: string): SignupApplicationConsentRecord {
  const row = result.rows[0];
  if (!row) throw new SignupConsentConflictError(code);
  return mapConsentRow(row);
}

function isUniqueViolation(error: unknown): error is { code: string; constraint?: string } {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code: unknown }).code === "23505");
}

export function createPostgresSignupConsentRepository(
  client?: DbTransactionClient | null,
): SignupConsentRepository {
  const db = getQueryable(client);

  return {
    async listActiveConsents(input) {
      const result = await db.query<SignupApplicationConsentRow>(
        `
          SELECT ${SIGNUP_CONSENT_RETURNING_COLUMNS}
          FROM signup_application_consents
          WHERE application_id = $1
            AND agreed_google_sub = $2
            AND agreed_email_normalized = $3
            AND revoked_at IS NULL
            AND EXISTS (
              SELECT 1
              FROM signup_applications
              WHERE signup_applications.id = signup_application_consents.application_id
                AND signup_applications.google_sub = $2
                AND signup_applications.email_normalized = $3
            )
          ORDER BY consent_type ASC, agreed_at DESC
        `,
        [input.applicationId, input.owner.googleSub, input.owner.emailNormalized],
      );
      return result.rows.map(mapConsentRow);
    },

    async createCurrentConsent(input) {
      if (!client) {
        return withDbTransaction((transactionClient) =>
          createPostgresSignupConsentRepository(transactionClient).createCurrentConsent(input),
        );
      }

      const lockedApplication = await db.query<SignupApplicationLockRow>(
        `
          SELECT id
          FROM signup_applications
          WHERE id = $1
            AND google_sub = $2
            AND email_normalized = $3
            AND status IN ('draft', 'changes_requested')
          FOR UPDATE
        `,
        [
          input.applicationId,
          input.owner.googleSub,
          input.owner.emailNormalized,
        ],
      );
      if (!lockedApplication.rows[0]) {
        throw new SignupConsentConflictError("SIGNUP_CONSENT_NOT_ALLOWED");
      }

      await db.query(
        `
          UPDATE signup_application_consents
          SET revoked_at = $6,
              revoke_reason_code = 'policy_replaced',
              updated_at = $6
          WHERE application_id = $1
            AND consent_type = $4
            AND revoked_at IS NULL
            AND (policy_code <> $2 OR policy_version <> $3)
            AND EXISTS (
              SELECT 1
              FROM signup_applications
              WHERE signup_applications.id = signup_application_consents.application_id
                AND signup_applications.google_sub = $5
                AND signup_applications.email_normalized = $7
                AND signup_applications.status IN ('draft', 'changes_requested')
            )
        `,
        [
          input.applicationId,
          input.policy.policyCode,
          input.policy.policyVersion,
          input.policy.consentType,
          input.owner.googleSub,
          input.now,
          input.owner.emailNormalized,
        ],
      );

      async function findActiveSameType(): Promise<SignupApplicationConsentRecord | null> {
        const result = await db.query<SignupApplicationConsentRow>(
          `
            SELECT ${SIGNUP_CONSENT_RETURNING_COLUMNS}
            FROM signup_application_consents
            WHERE application_id = $1
              AND consent_type = $2
              AND agreed_google_sub = $3
              AND agreed_email_normalized = $4
              AND revoked_at IS NULL
            LIMIT 1
          `,
          [
            input.applicationId,
            input.policy.consentType,
            input.owner.googleSub,
            input.owner.emailNormalized,
          ],
        );
        return result.rows[0] ? mapConsentRow(result.rows[0]) : null;
      }

      function isCurrentPolicy(consent: SignupApplicationConsentRecord): boolean {
        return consent.policyCode === input.policy.policyCode && consent.policyVersion === input.policy.policyVersion;
      }

      const existing = await findActiveSameType();
      if (existing) {
        if (isCurrentPolicy(existing)) return existing;
        throw new SignupConsentConflictError("SIGNUP_CONSENT_POLICY_CONFLICT");
      }

      try {
        const result = await db.query<SignupApplicationConsentRow>(
          `
            INSERT INTO signup_application_consents (
              application_id,
              consent_type,
              policy_code,
              policy_version,
              agreed_at,
              agreed_email_normalized,
              agreed_google_sub,
              created_at,
              updated_at
            )
            SELECT
              signup_applications.id,
              $4,
              $5,
              $6,
              $7,
              signup_applications.email_normalized,
              signup_applications.google_sub,
              $7,
              $7
            FROM signup_applications
            WHERE signup_applications.id = $1
              AND signup_applications.google_sub = $2
              AND signup_applications.email_normalized = $3
              AND signup_applications.status IN ('draft', 'changes_requested')
            RETURNING ${SIGNUP_CONSENT_RETURNING_COLUMNS}
          `,
          [
            input.applicationId,
            input.owner.googleSub,
            input.owner.emailNormalized,
            input.policy.consentType,
            input.policy.policyCode,
            input.policy.policyVersion,
            input.now,
          ],
        );

        return oneOrConflict(result, "SIGNUP_CONSENT_NOT_ALLOWED");
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        throw new SignupConsentConflictError("SIGNUP_CONSENT_POLICY_CONFLICT");
      }
    },

    async revokeActiveConsent(input) {
      const result = await db.query<SignupApplicationConsentRow>(
        `
          UPDATE signup_application_consents
          SET revoked_at = $5,
              revoke_reason_code = $6,
              updated_at = $5
          WHERE application_id = $1
            AND agreed_google_sub = $2
            AND agreed_email_normalized = $3
            AND consent_type = $4
            AND revoked_at IS NULL
            AND EXISTS (
              SELECT 1
              FROM signup_applications
              WHERE signup_applications.id = signup_application_consents.application_id
                AND signup_applications.google_sub = $2
                AND signup_applications.email_normalized = $3
                AND signup_applications.status IN ('draft', 'changes_requested')
            )
          RETURNING ${SIGNUP_CONSENT_RETURNING_COLUMNS}
        `,
        [
          input.applicationId,
          input.owner.googleSub,
          input.owner.emailNormalized,
          input.consentType,
          input.now,
          input.reasonCode,
        ],
      );
      return result.rows[0] ? mapConsentRow(result.rows[0]) : null;
    },

    async assertRequiredActiveConsents(input) {
      const active = await this.listActiveConsents({
        applicationId: input.applicationId,
        owner: input.owner,
      });
      const activeKeys = new Set(active.map((consent) => `${consent.consentType}:${consent.policyCode}:${consent.policyVersion}`));
      const missing = input.policies.some((policy) => !activeKeys.has(`${policy.consentType}:${policy.policyCode}:${policy.policyVersion}`));
      if (missing) throw new SignupConsentConflictError("SIGNUP_CONSENT_REQUIRED");
    },
  };
}
