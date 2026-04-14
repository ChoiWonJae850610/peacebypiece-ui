"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createWorkorderRepository } from "@/lib/repositories/workorderRepositoryFactory";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";
import type { WorkorderRepositoryMode } from "@/lib/repositories/workorderRepositoryMode";
import type { DbWorkorderAdapter } from "@/lib/repositories/dbWorkorderRepository";

type WorkorderRepositoryContextValue = {
  repository: WorkorderRepository;
};

const WorkorderRepositoryContext = createContext<WorkorderRepositoryContextValue | null>(null);

type WorkorderRepositoryProviderProps = {
  children: ReactNode;
  repository?: WorkorderRepository;
  repositoryMode?: WorkorderRepositoryMode;
  dbAdapter?: DbWorkorderAdapter;
};

export function WorkorderRepositoryProvider({
  children,
  repository,
  repositoryMode,
  dbAdapter,
}: WorkorderRepositoryProviderProps) {
  const resolvedRepository = useMemo(
    () => repository ?? createWorkorderRepository({ mode: repositoryMode, dbAdapter }),
    [dbAdapter, repository, repositoryMode],
  );

  const value = useMemo<WorkorderRepositoryContextValue>(() => ({ repository: resolvedRepository }), [resolvedRepository]);

  return <WorkorderRepositoryContext.Provider value={value}>{children}</WorkorderRepositoryContext.Provider>;
}

export function useWorkorderRepository() {
  const context = useContext(WorkorderRepositoryContext);
  if (!context) {
    throw new Error("useWorkorderRepository must be used within WorkorderRepositoryProvider");
  }
  return context.repository;
}
