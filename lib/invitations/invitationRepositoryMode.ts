export type InvitationRepositoryMode = "memory" | "db";

export const INVITATION_REPOSITORY_MODE: InvitationRepositoryMode = "memory";

export const INVITATION_DB_REPOSITORY_STATUS =
  "prepared_not_connected" as const;
