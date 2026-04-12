"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getMockWorkorderRepository } from "@/lib/repositories/mockWorkorderRepository";
import type { WorkorderRepository } from "@/lib/repositories/workorderRepository";

type WorkorderRepositoryContextValue = {
  repository: WorkorderRepository;
};

const WorkorderRepositoryContext = createContext<WorkorderRepositoryContextValue | null>(null);

type WorkorderRepositoryProviderProps = {
  children: ReactNode;
  repository?: WorkorderRepository;
};

export function WorkorderRepositoryProvider({
  children,
  repository = getMockWorkorderRepository(),
}: WorkorderRepositoryProviderProps) {
  const value = useMemo<WorkorderRepositoryContextValue>(() => ({ repository }), [repository]);

  return <WorkorderRepositoryContext.Provider value={value}>{children}</WorkorderRepositoryContext.Provider>;
}

export function useWorkorderRepository() {
  const context = useContext(WorkorderRepositoryContext);
  if (!context) {
    throw new Error("useWorkorderRepository must be used within WorkorderRepositoryProvider");
  }
  return context.repository;
}
