import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { normalizePhoneNumber } from "@/lib/utils/phoneFormat";

type PersonalProfileRow = {
  user_id: string;
  email: string | null;
  user_name: string | null;
  phone: string | null;
  birthday: string | Date | null;
  company_id: string | null;
  company_name: string | null;
  company_member_id: string | null;
  display_name: string | null;
  role_template_code: string | null;
};

export type PersonalProfile = {
  userId: string;
  email: string;
  name: string;
  phone: string;
  birthday: string;
  companyId: string | null;
  companyName: string | null;
  companyMemberId: string | null;
  roleTemplateCode: string | null;
  profileComplete: boolean;
};

export type PersonalProfileUpdateInput = {
  name?: string | null;
  phone?: string | null;
  birthday?: string | null;
};

function toIsoDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function normalizeName(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeBirthday(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function mapProfileRow(row: PersonalProfileRow, session: WaflSessionPayload): PersonalProfile {
  const name = normalizeName(row.display_name) || normalizeName(row.user_name) || session.name;
  const phone = row.phone ?? "";
  const birthday = toIsoDate(row.birthday);

  return {
    userId: row.user_id,
    email: row.email ?? session.email,
    name,
    phone,
    birthday,
    companyId: row.company_id ?? session.companyId,
    companyName: row.company_name ?? session.companyName,
    companyMemberId: row.company_member_id ?? session.companyMemberId,
    roleTemplateCode: row.role_template_code,
    profileComplete: Boolean(normalizeName(name) && normalizePhoneNumber(phone).length >= 10),
  };
}

export async function getPersonalProfile(session: WaflSessionPayload): Promise<PersonalProfile | null> {
  const result = await queryDb<PersonalProfileRow>(
    `
      SELECT
        users.id AS user_id,
        users.email,
        users.name AS user_name,
        users.phone,
        users.birthday,
        companies.id AS company_id,
        companies.name AS company_name,
        company_members.id AS company_member_id,
        company_members.display_name,
        company_members.role_template_code
      FROM users
      LEFT JOIN company_members
        ON company_members.user_id = users.id
       AND company_members.company_id = $2
       AND ($3::text IS NULL OR company_members.id = $3::text)
      LEFT JOIN companies
        ON companies.id = COALESCE(company_members.company_id, users.company_id)
      WHERE users.id = $1
      ORDER BY company_members.approved_at DESC NULLS LAST, company_members.created_at DESC NULLS LAST
      LIMIT 1
    `,
    [session.userId, session.companyId, session.companyMemberId],
  );

  const row = result.rows[0];
  return row ? mapProfileRow(row, session) : null;
}

export async function updatePersonalProfile(
  session: WaflSessionPayload,
  input: PersonalProfileUpdateInput,
): Promise<PersonalProfile | null> {
  const normalizedName = normalizeName(input.name);
  const normalizedPhone = normalizePhoneNumber(String(input.phone ?? ""));
  const normalizedBirthday = normalizeBirthday(input.birthday);

  if (!normalizedName || normalizedPhone.length < 10) {
    throw new Error("PERSONAL_PROFILE_REQUIRED_FIELDS");
  }

  await queryDb(
    `
      UPDATE users
         SET name = $2::text,
             phone = $3::text,
             phone_source = 'user',
             birthday = $4::date,
             birthday_source = 'user',
             updated_at = now()
       WHERE id = $1
    `,
    [session.userId, normalizedName, normalizedPhone, normalizedBirthday],
  );

  if (session.companyId) {
    await queryDb(
      `
        UPDATE company_members
           SET display_name = $3::text,
               updated_at = now()
         WHERE user_id = $1
           AND company_id = $2
           AND ($4::text IS NULL OR id = $4::text)
      `,
      [session.userId, session.companyId, normalizedName, session.companyMemberId],
    );
  }

  return getPersonalProfile(session);
}
