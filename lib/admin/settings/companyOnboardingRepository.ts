import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { normalizePhoneNumber } from "@/lib/utils/phoneFormat";
import type {
  CompanyOnboardingProfile,
  CompanyOnboardingStatus,
  CompanyOnboardingUpdateInput,
} from "@/lib/admin/settings/companyTypes";

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
  if (value === "active" || value === "approval_pending" || value === "profile_required") {
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
      normalizeText(row.postal_code) &&
      normalizeText(row.road_address) &&
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
    businessRegistrationNumber: normalizeText(row.business_registration_number),
    logoUrl: normalizeText(row.logo_url),
    postalCode: normalizeText(row.postal_code),
    roadAddress: normalizeText(row.road_address),
    jibunAddress: normalizeText(row.jibun_address),
    addressDetail: normalizeText(row.address_detail),
    addressExtra: normalizeText(row.address_extra),
    requestedPlanCode: normalizeText(row.requested_plan_code),
    onboardingStatus: profileComplete ? normalizeStatus(row.onboarding_status) : "profile_required",
    onboardingCompletedAt: toIso(row.onboarding_completed_at),
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
  return row ? mapRow(row) : null;
}


function buildCompanyOnboardingMemo(input: {
  companyEnglishName: string | null;
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

export async function updateCompanyOnboardingProfile(
  session: WaflSessionPayload,
  input: CompanyOnboardingUpdateInput,
): Promise<CompanyOnboardingProfile | null> {
  if (!session.companyId) return null;

  const companyName = normalizeNullableText(input.companyName);
  const companyEnglishName = normalizeNullableText(input.companyEnglishName);
  const businessName = normalizeNullableText(input.businessName);
  const businessRegistrationNumber = normalizeNullableText(input.businessRegistrationNumber);
  const logoUrl = normalizeNullableText(input.logoUrl);
  const postalCode = normalizeNullableText(input.postalCode);
  const roadAddress = normalizeNullableText(input.roadAddress);
  const jibunAddress = normalizeNullableText(input.jibunAddress);
  const addressDetail = normalizeNullableText(input.addressDetail);
  const addressExtra = normalizeNullableText(input.addressExtra);
  const requestedPlanCode = normalizeNullableText(input.requestedPlanCode);
  const adminName = normalizeNullableText(input.adminName);
  const adminPhone = normalizePhoneNumber(String(input.adminPhone ?? ""));

  if (!companyName || !businessName || !postalCode || !roadAddress || !adminName || adminPhone.length < 10) {
    throw new Error("COMPANY_ONBOARDING_REQUIRED_FIELDS");
  }

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

  await queryDb(
    `
      UPDATE join_requests
         SET requested_company_name = $2::text,
             business_name = $3::text,
             applicant_name = $4::text,
             applicant_phone = $5::text,
             request_memo = $6::text,
             updated_at = now()
       WHERE request_type = 'company'
         AND status = 'pending'
         AND user_id = $7::text
         AND created_company_id = $1::text
    `,
    [
      session.companyId,
      companyName,
      businessName,
      adminName,
      adminPhone,
      buildCompanyOnboardingMemo({
        companyEnglishName,
        logoUrl,
        postalCode,
        roadAddress,
        jibunAddress,
        addressDetail,
        addressExtra,
        requestedPlanCode,
      }),
      session.userId,
    ],
  );

  return getCompanyOnboardingProfile(session);
}
