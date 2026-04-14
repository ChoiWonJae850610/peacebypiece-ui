import { createDbWorkorderRepository, createUnconfiguredDbWorkorderRepository } from "@/lib/repositories/dbWorkorderRepository";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import { getMockWorkorderRepository } from "@/lib/repositories/mockWorkorderRepository";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import { getDefaultWorkorderRepositoryMode, type WorkorderRepositoryMode } from "@/lib/repositories/workorderRepositoryMode";

export type CreateWorkorderRepositoryOptions = {
  mode?: WorkorderRepositoryMode;
  adapter?: WorkorderRepositoryAdapter;
  dbAdapter?: WorkorderRepositoryAdapter;
};

export function createWorkorderRepository(options: CreateWorkorderRepositoryOptions = {}): WorkorderRepository {
  const fallbackRepository = getMockWorkorderRepository();
  const mode = options.mode ?? getDefaultWorkorderRepositoryMode();

  if (mode === "db") {
    const adapter = options.adapter ?? options.dbAdapter;
    if (adapter) {
      return createDbWorkorderRepository(fallbackRepository, adapter);
    }
    return createUnconfiguredDbWorkorderRepository(fallbackRepository);
  }

  return fallbackRepository;
}
