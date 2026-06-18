import "server-only";

import { queryDb } from "@/lib/db/client";
import type { WaflSessionPayload } from "@/lib/auth/session";

export type ActiveSystemAdmin = {
  id: string;
  email: string;
  name: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function findActiveSystemAdminByEmail(email: string): Promise<ActiveSystemAdmin | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const result = await queryDb<ActiveSystemAdmin>(
    `
      SELECT id, email, name
      FROM system_users
      WHERE lower(email) = lower($1)
        AND role = 'system_admin'
        AND is_active = true
      LIMIT 1
    `,
    [normalizedEmail],
  );

  return result.rows[0] ?? null;
}

export async function isActiveSystemAdminSession(
  session: Pick<WaflSessionPayload, "email"> | null | undefined,
): Promise<boolean> {
  if (!session?.email) return false;
  return Boolean(await findActiveSystemAdminByEmail(session.email));
}
