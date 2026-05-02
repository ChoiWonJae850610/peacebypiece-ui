import type {
  InvitationCreateResult,
  InvitationPermissionPreset,
  InvitationRecipientRole,
  InvitationScope,
} from "./invitationTypes";

export interface CreateInvitationClientInput {
  companyId: string;
  inviterCompanyId?: string | null;
  recipientEmail: string;
  recipientRole: InvitationRecipientRole;
  permissionPreset: InvitationPermissionPreset;
  scope: InvitationScope;
  createdByUserId?: string | null;
  createdBySystemUserId?: string | null;
}

export interface CreateInvitationClientResponse extends InvitationCreateResult {
  ok: true;
  tokenPolicy: string;
}

export interface InvitationClientErrorResponse {
  ok: false;
  error: string;
  message?: string;
  reasons?: string[];
}

export type InvitationClientResponse =
  | CreateInvitationClientResponse
  | InvitationClientErrorResponse;

export async function createInvitationLink(
  input: CreateInvitationClientInput,
): Promise<InvitationClientResponse> {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = (await response.json()) as InvitationClientResponse;

  if (!response.ok && data.ok !== false) {
    return {
      ok: false,
      error: "INVITATION_CLIENT_ERROR",
      message: "초대 링크 생성 요청에 실패했습니다.",
    };
  }

  return data;
}
