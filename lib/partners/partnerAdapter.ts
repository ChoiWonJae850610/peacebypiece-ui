import { PARTNER_REPOSITORY_MODE } from "@/lib/constants/app";
import { mockPartnerRepository } from "@/lib/partners/mockPartnerRepository";
import type { PartnerRepository, PartnerRepositoryMode } from "@/lib/partners/partnerRepository";

export const PARTNER_REPOSITORY_MODES = ["mock", "db"] as const;

export function isPartnerRepositoryMode(value: string): value is PartnerRepositoryMode {
  return PARTNER_REPOSITORY_MODES.includes(value as PartnerRepositoryMode);
}

export function getDefaultPartnerRepositoryMode(): PartnerRepositoryMode {
  const envMode = process.env.PARTNER_REPOSITORY_MODE ?? process.env.NEXT_PUBLIC_PARTNER_REPOSITORY_MODE;
  if (envMode && isPartnerRepositoryMode(envMode)) return envMode;
  return isPartnerRepositoryMode(PARTNER_REPOSITORY_MODE) ? PARTNER_REPOSITORY_MODE : "mock";
}

export async function createPartnerRepository(mode: PartnerRepositoryMode = getDefaultPartnerRepositoryMode()): Promise<PartnerRepository> {
  if (mode === "db") {
    const { createDbPartnerRepository } = await import("@/lib/partners/dbPartnerRepository");
    return createDbPartnerRepository();
  }

  return mockPartnerRepository;
}
