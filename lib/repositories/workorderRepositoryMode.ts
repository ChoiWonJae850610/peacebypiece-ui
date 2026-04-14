import { WORKORDER_REPOSITORY_MODE } from "@/lib/constants/app";

export const WORKORDER_REPOSITORY_MODES = ["mock", "db"] as const;

export type WorkorderRepositoryMode = (typeof WORKORDER_REPOSITORY_MODES)[number];

export function isWorkorderRepositoryMode(value: string): value is WorkorderRepositoryMode {
  return WORKORDER_REPOSITORY_MODES.includes(value as WorkorderRepositoryMode);
}

export function getDefaultWorkorderRepositoryMode(): WorkorderRepositoryMode {
  return isWorkorderRepositoryMode(WORKORDER_REPOSITORY_MODE) ? WORKORDER_REPOSITORY_MODE : "mock";
}
