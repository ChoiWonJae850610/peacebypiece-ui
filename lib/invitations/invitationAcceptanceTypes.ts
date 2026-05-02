import type { InvitationRecord } from "./invitationTypes";

export type InvitationAcceptanceStatus =
  | "ready"
  | "invalid"
  | "expired"
  | "revoked"
  | "accepted";

export interface InvitationAcceptancePreview {
  ok: true;
  status: InvitationAcceptanceStatus;
  invitation: InvitationRecord | null;
  message: string;
}

export interface InvitationAcceptanceError {
  ok: false;
  status: "invalid";
  invitation: null;
  message: string;
}

export type InvitationAcceptanceResult =
  | InvitationAcceptancePreview
  | InvitationAcceptanceError;
