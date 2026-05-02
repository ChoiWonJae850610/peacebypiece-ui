export type InvitationRepositoryMode = "memory" | "db";

export const INVITATION_REPOSITORY_MODE: InvitationRepositoryMode = "db";

export const INVITATION_DB_REPOSITORY_STATUS = "connected" as const;
