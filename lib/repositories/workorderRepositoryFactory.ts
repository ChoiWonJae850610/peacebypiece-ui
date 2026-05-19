import { createDbWorkorderRepository, createUnconfiguredDbWorkorderRepository } from "@/lib/repositories/dbWorkorderRepository";
import { createDbWorkorderHttpAdapter } from "@/lib/repositories/dbWorkorderHttpAdapter";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import { getDefaultWorkorderRepositoryMode, type WorkorderRepositoryMode } from "@/lib/repositories/workorderRepositoryMode";

export type CreateWorkorderRepositoryOptions = {
  mode?: WorkorderRepositoryMode;
  adapter?: WorkorderRepositoryAdapter;
  dbAdapter?: WorkorderRepositoryAdapter;
};

export function createWorkorderRepository(options: CreateWorkorderRepositoryOptions = {}): WorkorderRepository {
  options.mode ?? getDefaultWorkorderRepositoryMode();
  const adapter = options.adapter ?? options.dbAdapter ?? createDbWorkorderHttpAdapter();

  if (adapter) {
    return createDbWorkorderRepository(undefined, adapter);
  }

  return createUnconfiguredDbWorkorderRepository();
}
