import type { PartnerRepository, PartnerRepositoryMode } from "@/lib/partners/partnerRepository";
import type { PartnerCompanyScope } from "@/lib/partners/types";

export const PARTNER_REPOSITORY_MODES = ["db"] as const;

export function isPartnerRepositoryMode(value: string): value is PartnerRepositoryMode {
  return PARTNER_REPOSITORY_MODES.includes(value as PartnerRepositoryMode);
}

export function getDefaultPartnerRepositoryMode(): PartnerRepositoryMode {
  return "db";
}

export async function createPartnerRepository(
  companyScope: PartnerCompanyScope,
): Promise<PartnerRepository> {
  const { createDbPartnerRepository } = await import("@/lib/partners/dbPartnerRepository");
  return createDbPartnerRepository(companyScope);
}
