import process from "node:process";
import pg from "pg";

const { Client } = pg;

if (process.env.WAFL_DB_AUDIT_APPROVED !== "1") throw new Error("Read-only/smoke guard approval is missing.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const applicationId = `signup-consent-smoke-app-${suffix}`;
const consentId = `signup-consent-smoke-consent-${suffix}`;
const replacementConsentId = `signup-consent-smoke-consent-replacement-${suffix}`;
const missingApplicationId = `signup-consent-smoke-missing-${suffix}`;
const email = `signup-consent-smoke-${suffix}@example.invalid`;
const googleSub = `signup-consent-smoke-google-${suffix}`;

const client = new Client({ connectionString: process.env.DATABASE_URL, statement_timeout: 60000, query_timeout: 60000 });
await client.connect();

async function expectFailure(label, query, params) {
  const savepoint = `sp_${label.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`;
  await client.query(`SAVEPOINT ${savepoint}`);
  try {
    await client.query(query, params);
  } catch {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
    await client.query(`RELEASE SAVEPOINT ${savepoint}`);
    console.log(`${label}: rejected`);
    return;
  }
  await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
  await client.query(`RELEASE SAVEPOINT ${savepoint}`);
  throw new Error(`${label}: expected rejection`);
}

try {
  await client.query("BEGIN");
  console.log("WAFL SIGNUP CONSENT ROLLBACK SMOKE");
  console.log("Mutation: transaction-local only");

  await client.query(
    `
      INSERT INTO signup_applications (
        id,
        google_sub,
        email,
        email_normalized,
        email_verified,
        applicant_name,
        requested_company_name,
        business_name,
        business_registration_number,
        business_registration_number_normalized,
        requested_plan_code
      ) VALUES ($1, $2, $3, $3, true, 'Smoke Applicant', 'Smoke Company', 'Smoke Business', '123-45-67890', '1234567890', 'lite')
    `,
    [applicationId, googleSub, email],
  );

  await client.query(
    `
      INSERT INTO signup_application_consents (
        id,
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, $2, 'terms_of_service', 'wafl_terms_of_service', '0.24.26', now(), $3, $4)
    `,
    [consentId, applicationId, email, googleSub],
  );

  await expectFailure(
    "duplicate active application/type",
    `
      INSERT INTO signup_application_consents (
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, 'terms_of_service', 'wafl_terms_of_service', '0.24.26', now(), $2, $3)
    `,
    [applicationId, email, googleSub],
  );

  await client.query(
    `
      UPDATE signup_application_consents
      SET revoked_at = now(),
          revoke_reason_code = 'smoke_replace',
          updated_at = now()
      WHERE id = $1
    `,
    [consentId],
  );

  await client.query(
    `
      INSERT INTO signup_application_consents (
        id,
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, $2, 'terms_of_service', 'wafl_terms_of_service', '0.24.26', now(), $3, $4)
    `,
    [replacementConsentId, applicationId, email, googleSub],
  );

  await expectFailure(
    "invalid consent type",
    `
      INSERT INTO signup_application_consents (
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, 'marketing', 'wafl_marketing', '0.24.26', now(), $2, $3)
    `,
    [applicationId, email, googleSub],
  );

  await expectFailure(
    "empty policy code",
    `
      INSERT INTO signup_application_consents (
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, 'privacy_policy', '', '0.24.26', now(), $2, $3)
    `,
    [applicationId, email, googleSub],
  );

  await expectFailure(
    "empty google sub",
    `
      INSERT INTO signup_application_consents (
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, 'privacy_policy', 'wafl_privacy_policy', '0.24.26', now(), $2, '')
    `,
    [applicationId, email],
  );

  await expectFailure(
    "missing application FK",
    `
      INSERT INTO signup_application_consents (
        application_id,
        consent_type,
        policy_code,
        policy_version,
        agreed_at,
        agreed_email_normalized,
        agreed_google_sub
      ) VALUES ($1, 'privacy_policy', 'wafl_privacy_policy', '0.24.26', now(), $2, $3)
    `,
    [missingApplicationId, email, googleSub],
  );

  const active = await client.query(
    `
      SELECT count(*)::int AS count
      FROM signup_application_consents
      WHERE application_id = $1
        AND consent_type = 'terms_of_service'
        AND revoked_at IS NULL
    `,
    [applicationId],
  );
  if (Number(active.rows[0]?.count ?? 0) !== 1) {
    throw new Error(`current active consent count mismatch: ${active.rows[0]?.count}`);
  }

  await client.query("ROLLBACK");
  console.log("Transaction: rolled back");

  const residue = await client.query(
    `
      SELECT
        (SELECT count(*)::int FROM signup_application_consents WHERE application_id = $1) AS consent_rows,
        (SELECT count(*)::int FROM signup_applications WHERE id = $1) AS application_rows
    `,
    [applicationId],
  );
  const consentRows = Number(residue.rows[0]?.consent_rows ?? 0);
  const applicationRows = Number(residue.rows[0]?.application_rows ?? 0);
  console.log(`Residual rows: ${consentRows + applicationRows}`);
  if (consentRows !== 0 || applicationRows !== 0) {
    throw new Error("rollback smoke residue remains");
  }

  console.log("Result: PASS");
  process.exitCode = 0;
} catch (error) {
  try {
    await client.query("ROLLBACK");
    console.error("Transaction: rollback attempted");
  } catch {
    console.error("Transaction: rollback failed");
  }
  console.error("Result: FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end();
}
