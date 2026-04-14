import { createDbWorkorderRepository, createUnconfiguredDbWorkorderRepository, type DbWorkorderAdapter } from "@/lib/repositories/dbWorkorderRepository";
import { getMockWorkorderRepository } from "@/lib/repositories/mockWorkorderRepository";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import { getDefaultWorkorderRepositoryMode, type WorkorderRepositoryMode } from "@/lib/repositories/workorderRepositoryMode";

export type CreateWorkorderRepositoryOptions = {
  mode?: WorkorderRepositoryMode;
  dbAdapter?: DbWorkorderAdapter;
};

export function createWorkorderRepository(options: CreateWorkorderRepositoryOptions = {}): WorkorderRepository {
  const fallbackRepository = getMockWorkorderRepository();
  const mode = options.mode ?? getDefaultWorkorderRepositoryMode();

  if (mode === "db") {
    if (options.dbAdapter) {
      return createDbWorkorderRepository(fallbackRepository, options.dbAdapter);
    }
    return createUnconfiguredDbWorkorderRepository(fallbackRepository);
  }

  return fallbackRepository;
}
