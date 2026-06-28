BEGIN;

INSERT INTO signup_applications (
  id,
  status,
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
) VALUES (
  'signup-smoke-draft',
  'draft',
  'signup-smoke-google-sub',
  'signup-smoke@example.test',
  'signup-smoke@example.test',
  true,
  'Signup Smoke',
  'Signup Smoke Company',
  'Signup Smoke Business',
  '123-45-67890',
  '1234567890',
  'lite'
);

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code
  ) VALUES (
    'signup-smoke-email-unverified', 'draft', 'signup-smoke-email-unverified',
    'signup-smoke-email-unverified@example.test', 'signup-smoke-email-unverified@example.test',
    false, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67890', '1234567890', 'lite'
  );
  RAISE EXCEPTION 'email_verified=false was accepted';
EXCEPTION WHEN check_violation THEN
  NULL;
END $$;

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code
  ) VALUES (
    'signup-smoke-email-normalized-mismatch', 'draft', 'signup-smoke-email-normalized-mismatch',
    'Signup-Smoke-Mismatch@example.test', 'wrong@example.test',
    true, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67890', '1234567890', 'lite'
  );
  RAISE EXCEPTION 'email_normalized mismatch was accepted';
EXCEPTION WHEN check_violation THEN
  NULL;
END $$;

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code
  ) VALUES (
    'signup-smoke-business-mismatch', 'draft', 'signup-smoke-business-mismatch',
    'signup-smoke-business-mismatch@example.test', 'signup-smoke-business-mismatch@example.test',
    true, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67890', '123456789', 'lite'
  );
  RAISE EXCEPTION 'business registration normalization mismatch was accepted';
EXCEPTION WHEN check_violation THEN
  NULL;
END $$;

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code
  ) VALUES (
    'signup-smoke-empty-google-sub', 'draft', '',
    'signup-smoke-empty-google-sub@example.test', 'signup-smoke-empty-google-sub@example.test',
    true, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67890', '1234567890', 'lite'
  );
  RAISE EXCEPTION 'empty google_sub was accepted';
EXCEPTION WHEN check_violation THEN
  NULL;
END $$;

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code, provisioning_status
  ) VALUES (
    'signup-smoke-status-provisioning-mismatch', 'approved', 'signup-smoke-status-provisioning-mismatch',
    'signup-smoke-status-provisioning-mismatch@example.test', 'signup-smoke-status-provisioning-mismatch@example.test',
    true, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67890', '1234567890', 'lite', 'not_started'
  );
  RAISE EXCEPTION 'status/provisioning mismatch was accepted';
EXCEPTION WHEN check_violation THEN
  NULL;
END $$;

INSERT INTO signup_applications (
  id,
  status,
  google_sub,
  email,
  email_normalized,
  email_verified,
  applicant_name,
  requested_company_name,
  business_name,
  business_registration_number,
  business_registration_number_normalized,
  requested_plan_code,
  submitted_at
) VALUES (
  'signup-smoke-active-email-1',
  'submitted',
  'signup-smoke-active-email-1',
  'signup-smoke-active-email@example.test',
  'signup-smoke-active-email@example.test',
  true,
  'Signup Smoke',
  'Signup Smoke Company',
  'Signup Smoke Business',
  '123-45-67891',
  '1234567891',
  'lite',
  now()
);

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code, submitted_at
  ) VALUES (
    'signup-smoke-active-email-2', 'submitted', 'signup-smoke-active-email-2',
    'signup-smoke-active-email@example.test', 'signup-smoke-active-email@example.test',
    true, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67892', '1234567892', 'lite', now()
  );
  RAISE EXCEPTION 'duplicate active email was accepted';
EXCEPTION WHEN unique_violation THEN
  NULL;
END $$;

INSERT INTO signup_applications (
  id,
  status,
  google_sub,
  email,
  email_normalized,
  email_verified,
  applicant_name,
  requested_company_name,
  business_name,
  business_registration_number,
  business_registration_number_normalized,
  requested_plan_code,
  submitted_at
) VALUES (
  'signup-smoke-active-business-1',
  'submitted',
  'signup-smoke-active-business-1',
  'signup-smoke-active-business-1@example.test',
  'signup-smoke-active-business-1@example.test',
  true,
  'Signup Smoke',
  'Signup Smoke Company',
  'Signup Smoke Business',
  '123-45-67893',
  '1234567893',
  'lite',
  now()
);

DO $$
BEGIN
  INSERT INTO signup_applications (
    id, status, google_sub, email, email_normalized, email_verified, applicant_name,
    requested_company_name, business_name, business_registration_number,
    business_registration_number_normalized, requested_plan_code, submitted_at
  ) VALUES (
    'signup-smoke-active-business-2', 'submitted', 'signup-smoke-active-business-2',
    'signup-smoke-active-business-2@example.test', 'signup-smoke-active-business-2@example.test',
    true, 'Signup Smoke', 'Signup Smoke Company', 'Signup Smoke Business',
    '123-45-67893', '1234567893', 'lite', now()
  );
  RAISE EXCEPTION 'duplicate active business registration was accepted';
EXCEPTION WHEN unique_violation THEN
  NULL;
END $$;

INSERT INTO signup_application_files (
  id,
  application_id,
  file_type,
  original_name,
  storage_key,
  mime_type,
  size_bytes
) VALUES (
  'signup-smoke-certificate-1',
  'signup-smoke-draft',
  'business_registration',
  'certificate.pdf',
  'signup-smoke/certificate-1.pdf',
  'application/pdf',
  1
);

DO $$
BEGIN
  INSERT INTO signup_application_files (
    id, application_id, file_type, original_name, storage_key, mime_type, size_bytes
  ) VALUES (
    'signup-smoke-certificate-2', 'signup-smoke-draft', 'business_registration',
    'certificate-2.pdf', 'signup-smoke/certificate-2.pdf', 'application/pdf', 1
  );
  RAISE EXCEPTION 'second active certificate was accepted';
EXCEPTION WHEN unique_violation THEN
  NULL;
END $$;

SELECT
  'signup schema smoke passed; transaction will roll back' AS result,
  count(*) AS smoke_rows
FROM signup_applications
WHERE id LIKE 'signup-smoke-%';

ROLLBACK;
