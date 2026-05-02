import type {
  InvitationCreateResult,
  InvitationDraft,
  InvitationRecord,
  InvitationRepository,
} from "./invitationTypes";

export class DbInvitationRepositoryNotConnectedError extends Error {
  constructor() {
    super(
      "DB invitation repository is prepared but not connected. Keep memory repository until DB adapter wiring is approved.",
    );
    this.name = "DbInvitationRepositoryNotConnectedError";
  }
}

export function createDbInvitationRepositorySkeleton(): InvitationRepository {
  return {
    async createInvitation(
      _draft: InvitationDraft,
    ): Promise<InvitationCreateResult> {
      throw new DbInvitationRepositoryNotConnectedError();
    },

    async listInvitations(_companyId: string): Promise<InvitationRecord[]> {
      throw new DbInvitationRepositoryNotConnectedError();
    },

    async revokeInvitation(_invitationId: string): Promise<InvitationRecord> {
      throw new DbInvitationRepositoryNotConnectedError();
    },
  };
}
