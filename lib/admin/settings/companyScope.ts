import "server-only";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";

export type AdminCompanyScope = {
  companyId: string;
  companyName: string | null;
};

export async function getAdminCompanyScope(): Promise<AdminCompanyScope | null> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();

  if (!session || !companyId) return null;

  return {
    companyId,
    companyName: session.companyName,
  };
}

export async function getAdminCompanyId(): Promise<string | null> {
  return (await getAdminCompanyScope())?.companyId ?? null;
}
