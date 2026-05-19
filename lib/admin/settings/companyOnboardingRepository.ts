import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { formatBusinessRegistrationNumber } from "@/lib/utils/businessRegistrationFormat";
import { normalizePhoneNumber } from "@/lib/utils/phoneFormat";
import {
  isCompanyTrialExpired,
  normalizeCompanySubscriptionStatus,
} from "@/lib/billing/companyTrialPolicy";
import type {
  CompanyOnboardingFileMetadata,
  CompanyOnboardingProfile,
  CompanyOnboardingStatus,
  CompanyOnboardingUpdateInput,
} from "@/lib/admin/settings/companyTypes";
import { listActiveCompanyOnboardingFileMetadata } from "@/lib/admin/settings/companyOnboardingFileRepository";
import { invitationRepository } from "@/lib/invitations/invitationRepository";

type CompanyOnboardingRow = {
  company_id: string;
  company_name: string | null;
  company_english_name: string | null;
  business_name: string | null;
  business_registration_number: string | null;
  logo_url: string | null;
  postal_code: string | null;
  road_address: string | null;
  jibun_address: string | null;
  address_detail: string | null;
  address_extra: string | null;
  requested_plan_code: string | null;
  onboarding_status: string | null;
  onboarding_completed_at: string | Date | null;
  subscription_status: string | null;
  trial_started_at: string | Date | null;
  trial_ends_at: string | Date | null;
  admin_name: string | null;
  admin_phone: string | null;
};

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeNullableText(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeStatus(value: string | null | undefined): CompanyOnboardingStatus {
  if (value === "active" || value === "approval_pending" || value === "profile_required" || value === "rejected") {
    return value;
  }

  return "profile_required";
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function isProfileComplete(row: CompanyOnboardingRow): boolean {
  return Boolean(
    normalizeText(row.company_name) &&
      normalizeText(row.business_name) &&
      normalizeText(row.business_registration_number) &&
      normalizeText(row.postal_code) &&
      normalizeText(row.road_address) &&
      normalizeText(row.address_detail) &&
      normalizeText(row.requested_plan_code) &&
      normalizeText(row.admin_name) &&
      normalizePhoneNumber(row.admin_phone ?? "").length >= 10,
  );
}

function mapRow(row: CompanyOnboardingRow): CompanyOnboardingProfile {
  const profileComplete = isProfileComplete(row);

  return {
    companyId: row.company_id,
    companyName: normalizeText(row.company_name),
    companyEnglishName: normalizeText(row.company_english_name),
    businessName: normalizeText(row.business_name),
    businessRegistrationNumber: formatBusinessRegistrationNumber(normalizeText(row.business_registration_number)),
    logoUrl: normalizeText(row.logo_url),
    postalCode: normalizeText(row.postal_code),
    roadAddress: normalizeText(row.road_address),
    jibunAddress: normalizeText(row.jibun_address),
    addressDetail: normalizeText(row.address_detail),
    addressExtra: normalizeText(row.address_extra),
    requestedPlanCode: normalizeText(row.requested_plan_code),
    onboardingStatus: normalizeStatus(row.onboarding_status) === "rejected" ? "rejected" : profileComplete ? normalizeStatus(row.onboarding_status) : "profile_required",
    onboardingCompletedAt: toIso(row.onboarding_completed_at),
    subscriptionStatus: normalizeCompanySubscriptionStatus(row.subscription_status),
    trialStartedAt: toIso(row.trial_started_at),
    trialEndsAt: toIso(row.trial_ends_at),
    trialExpired: isCompanyTrialExpired({
      subscriptionStatus: row.subscription_status,
      trialEndsAt: row.trial_ends_at,
    }),
    adminName: normalizeText(row.admin_name),
    adminPhone: normalizeText(row.admin_phone),
    profileComplete,
  };
}

export async function getCompanyOnboardingProfile(
  session: WaflSessionPayload,
): Promise<CompanyOnboardingProfile | null> {
  if (!session.companyId) return null;

  const result = await queryDb<CompanyOnboardingRow>(
    `
      SELECT
        c.id AS company_id,
        c.name AS company_name,
        c.english_name AS company_english_name,
        c.business_name,
        c.business_registration_number,
        c.logo_url,
        c.postal_code,
        c.road_address,
        c.jibun_address,
        c.address_detail,
        c.address_extra,
        c.requested_plan_code,
        c.onboarding_status,
        c.onboarding_completed_at,
        c.subscription_status,
        c.trial_started_at,
        c.trial_ends_at,
        u.name AS admin_name,
        u.phone AS admin_phone
      FROM companies c
      LEFT JOIN users u
        ON u.id = $2::text
      WHERE c.id = $1::text
      LIMIT 1
    `,
    [session.companyId, session.userId],
  );

  const row = result.rows[0];
  if (!row) return null;

  const onboardingFiles: CompanyOnboardingFileMetadata[] = await listActiveCompanyOnboardingFileMetadata({
    companyId: session.companyId,
  });

  return {
    ...mapRow(row),
    onboardingFiles,
  };
}


function buildCompanyOnboardingMemo(input: {
  companyEnglishName: string | null;
  businessRegistrationNumber: string | null;
  logoUrl: string | null;
  postalCode: string | null;
  roadAddress: string | null;
  jibunAddress: string | null;
  addressDetail: string | null;
  addressExtra: string | null;
  requestedPlanCode: string | null;
}): string {
  return [
    ["companyEnglishName", input.companyEnglishName],
    ["businessRegistrationNumber", input.businessRegistrationNumber],
    ["logoUrl", input.logoUrl],
    ["postalCode", input.postalCode],
    ["roadAddress", input.roadAddress],
    ["jibunAddress", input.jibunAddress],
    ["addressDetail", input.addressDetail],
    ["addressExtra", input.addressExtra],
    ["requestedPlanCode", input.requestedPlanCode],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join("\n");
}


async function findSubmissionInvitationId(session: WaflSessionPayload): Promise<string | null> {
  const token = session.companyInvitationToken?.trim();
  if (token) {
    const invitation = await invitationRepository.findInvitationByRawToken(token);
    if (!invitation) throw new Error("INVITATION_NOT_FOUND");
    if (invitation.scope !== "system_to_company_admin") throw new Error("INVITATION_SCOPE_MISMATCH");
    if (invitation.status !== "pending" && invitation.status !== "active" && invitation.status !== "accepted") {
      throw new Error("INVITATION_NOT_ACTIVE");
    }
    if (new Date(invitation.expiresAt).getTime() <= Date.now()) throw new Error("INVITATION_EXPIRED");
    return invitation.id;
  }

  const invitationResult = await queryDb<{ id: string }>(
    `
      SELECT id
        FROM invitations
       WHERE scope = 'system_to_company_admin'
         AND status IN ('pending', 'active', 'accepted')
         AND (company_id = $1::text OR accepted_user_id = $2::text)
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1
    `,
    [session.companyId, session.userId],
  );

  return invitationResult.rows[0]?.id ?? null;
}

async function markSubmissionInvitationAccepted(input: {
  invitationId: string | null;
  companyId: string;
  userId: string;
}): Promise<void> {
  if (!input.invitationId) return;

  await queryDb(
    `
      UPDATE invitations
         SET status = 'accepted',
             company_id = $2::text,
             accepted_user_id = $3::text,
             accepted_at = COALESCE(accepted_at, now()),
             updated_at = now()
       WHERE id = $1::text
         AND scope = 'system_to_company_admin'
         AND status IN ('pending', 'active', 'accepted')
    `,
    [input.invitationId, input.companyId, input.userId],
  );
}

type NormalizedCompanyOnboardingUpdateInput = {
  companyName: string | null;
  companyEnglishName: string | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  logoUrl: string | null;
  postalCode: string | null;
  roadAddress: string | null;
  jibunAddress: string | null;
  addressDetail: string | null;
  addressExtra: string | null;
  requestedPlanCode: string | null;
  adminName: string | null;
  adminPhone: string;
};

function normalizeCompanyOnboardingUpdateInput(input: CompanyOnboardingUpdateInput): NormalizedCompanyOnboardingUpdateInput {
  return {
    companyName: normalizeNullableText(input.companyName),
    companyEnglishName: normalizeNullableText(input.companyEnglishName),
    businessName: normalizeNullableText(input.businessName),
    businessRegistrationNumber: formatBusinessRegistrationNumber(normalizeNullableText(input.businessRegistrationNumber) ?? ""),
    logoUrl: normalizeNullableText(input.logoUrl),
    postalCode: normalizeNullableText(input.postalCode),
    roadAddress: normalizeNullableText(input.roadAddress),
    jibunAddress: normalizeNullableText(input.jibunAddress),
    addressDetail: normalizeNullableText(input.addressDetail),
    addressExtra: normalizeNullableText(input.addressExtra),
    requestedPlanCode: "basic",
    adminName: normalizeNullableText(input.adminName),
    adminPhone: normalizePhoneNumber(String(input.adminPhone ?? "")),
  };
}

function isCompanyOnboardingUpdateComplete(input: NormalizedCompanyOnboardingUpdateInput): boolean {
  return Boolean(
    input.companyName &&
      input.businessName &&
      input.businessRegistrationNumber &&
      input.postalCode &&
      input.roadAddress &&
      input.addressDetail &&
      input.requestedPlanCode &&
      input.adminName &&
      input.adminPhone.length >= 10,
  );
}

export function validateCompanyOnboardingUpdateInput(input: CompanyOnboardingUpdateInput): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeCompanyOnboardingUpdateInput(input);
  return isCompanyOnboardingUpdateComplete(normalized)
    ? { ok: true }
    : { ok: false, error: "COMPANY_ONBOARDING_REQUIRED_FIELDS" };
}

export async function updateCompanyOnboardingProfile(
  session: WaflSessionPayload,
  input: CompanyOnboardingUpdateInput,
): Promise<CompanyOnboardingProfile | null> {
  if (!session.companyId) return null;

  const normalized = normalizeCompanyOnboardingUpdateInput(input);
  if (!isCompanyOnboardingUpdateComplete(normalized)) {
    throw new Error("COMPANY_ONBOARDING_REQUIRED_FIELDS");
  }

  const {
    companyName,
    companyEnglishName,
    businessName,
    businessRegistrationNumber,
    logoUrl,
    postalCode,
    roadAddress,
    jibunAddress,
    addressDetail,
    addressExtra,
    requestedPlanCode,
    adminName,
    adminPhone,
  } = normalized;

  await queryDb(
    `
      UPDATE companies
         SET name = $2::text,
             english_name = $3::text,
             business_name = $4::text,
             business_registration_number = $5::text,
             logo_url = $6::text,
             postal_code = $7::text,
             road_address = $8::text,
             jibun_address = $9::text,
             address_detail = $10::text,
             address_extra = $11::text,
             requested_plan_code = $12::text,
             onboarding_status = 'approval_pending',
             onboarding_completed_at = COALESCE(onboarding_completed_at, now()),
             updated_at = now()
       WHERE id = $1::text
    `,
    [
      session.companyId,
      companyName,
      companyEnglishName,
      businessName,
      businessRegistrationNumber,
      logoUrl,
      postalCode,
      roadAddress,
      jibunAddress,
      addressDetail,
      addressExtra,
      requestedPlanCode,
    ],
  );

  await queryDb(
    `
      UPDATE users
         SET name = $2::text,
             phone = $3::text,
             phone_source = 'user',
             updated_at = now()
       WHERE id = $1::text
    `,
    [session.userId, adminName, adminPhone],
  );

  await queryDb(
    `
      UPDATE company_members
         SET display_name = $2::text,
             updated_at = now()
       WHERE company_id = $1::text
         AND user_id = $3::text
    `,
    [session.companyId, adminName, session.userId],
  );

  const requestMemo = buildCompanyOnboardingMemo({
    companyEnglishName,
    businessRegistrationNumber,
    logoUrl,
    postalCode,
    roadAddress,
    jibunAddress,
    addressDetail,
    addressExtra,
    requestedPlanCode,
  });

  const invitationId = await findSubmissionInvitationId(session);

  const userResult = await queryDb<{ email: string | null; google_sub: string | null; google_picture_url: string | null }>(
    `
      SELECT email, google_sub, google_picture_url
        FROM users
       WHERE id = $1::text
       LIMIT 1
    `,
    [session.userId],
  );
  const user = userResult.rows[0] ?? null;
  const applicantEmail = normalizeNullableText(user?.email) ?? session.email ?? `${session.userId}@pending.local`;

  const updatedJoinRequest = await queryDb(
    `
      UPDATE join_requests
         SET invitation_id = COALESCE(invitation_id, $2::text),
             applicant_email = $3::text,
             requested_company_name = $4::text,
             business_name = $5::text,
             applicant_name = $6::text,
             applicant_phone = $7::text,
             google_sub = $8::text,
             google_picture_url = $9::text,
             request_memo = $10::text,
             updated_at = now()
       WHERE request_type = 'company'
         AND status = 'pending'
         AND user_id = $11::text
         AND created_company_id = $1::text
    `,
    [
      session.companyId,
      invitationId,
      applicantEmail,
      companyName,
      businessName,
      adminName,
      adminPhone,
      normalizeNullableText(user?.google_sub),
      normalizeNullableText(user?.google_picture_url),
      requestMemo,
      session.userId,
    ],
  );

  if (updatedJoinRequest.rowCount === 0) {
    await queryDb(
      `
        INSERT INTO join_requests (
          invitation_id,
          user_id,
          applicant_email,
          request_type,
          requested_company_name,
          business_name,
          applicant_name,
          applicant_phone,
          google_sub,
          google_picture_url,
          request_memo,
          status,
          created_company_id
        )
        VALUES ($1::text, $2::text, $3::text, 'company', $4::text, $5::text, $6::text, $7::text, $8::text, $9::text, $10::text, 'pending', $11::text)
      `,
      [
        invitationId,
        session.userId,
        applicantEmail,
        companyName,
        businessName,
        adminName,
        adminPhone,
        normalizeNullableText(user?.google_sub),
        normalizeNullableText(user?.google_picture_url),
        requestMemo,
        session.companyId,
      ],
    );
  }

  await markSubmissionInvitationAccepted({
    invitationId,
    companyId: session.companyId,
    userId: session.userId,
  });

  return getCompanyOnboardingProfile(session);
}
