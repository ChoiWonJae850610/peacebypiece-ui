"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createWorkorderRepository } from "@/lib/repositories/workorderRepositoryFactory";
import type { WorkorderRepository, WorkorderRepositoryInfo } from "@/lib/repositories/workorderRepository";
import type { WorkorderRepositoryMode } from "@/lib/repositories/workorderRepositoryMode";
import type { WorkorderRepositoryAdapter } from "@/lib/repositories/workorderRepositoryAdapter";

type WorkorderRepositoryContextValue = {
  repository: WorkorderRepository;
  repositoryInfo: WorkorderRepositoryInfo;
};

const WorkorderRepositoryContext = createContext<WorkorderRepositoryContextValue | null>(null);

type WorkorderRepositoryProviderProps = {
  children: ReactNode;
  repository?: WorkorderRepository;
  repositoryMode?: WorkorderRepositoryMode;
  dbAdapter?: WorkorderRepositoryAdapter;
  adapter?: WorkorderRepositoryAdapter;
};

export function WorkorderRepositoryProvider({
  children,
  repository,
  repositoryMode,
  dbAdapter,
  adapter,
}: WorkorderRepositoryProviderProps) {
  const resolvedRepository = useMemo(
    () => repository ?? createWorkorderRepository({ mode: repositoryMode, adapter: adapter ?? dbAdapter, dbAdapter }),
    [adapter, dbAdapter, repository, repositoryMode],
  );

  const repositoryInfo = useMemo(() => resolvedRepository.getRepositoryInfo(), [resolvedRepository]);

  const value = useMemo<WorkorderRepositoryContextValue>(() => ({ repository: resolvedRepository, repositoryInfo }), [repositoryInfo, resolvedRepository]);

  return <WorkorderRepositoryContext.Provider value={value}>{children}</WorkorderRepositoryContext.Provider>;
}

export function useWorkorderRepository() {
  const context = useContext(WorkorderRepositoryContext);
  if (!context) {
    throw new Error("useWorkorderRepository must be used within WorkorderRepositoryProvider");
  }
  return context.repository;
}

export function useWorkorderRepositoryInfo() {
  const context = useContext(WorkorderRepositoryContext);
  if (!context) {
    throw new Error("useWorkorderRepositoryInfo must be used within WorkorderRepositoryProvider");
  }
  return context.repositoryInfo;
}
