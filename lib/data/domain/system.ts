export type SystemCompanySummary = {
  id: string;
  name: string;
  adminName: string;
  seatSummary: string;
  statusLabel: string;
};

export type SystemCategoryRuleSummary = {
  id: string;
  title: string;
  keywordSummary: string;
  recommendation: string;
  statusLabel: string;
};

export type SystemOperationItem = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
};

export type SystemInviteStatus = "draft" | "sent" | "accepted" | "expired";

export type SystemInviteAction = {
  id: string;
  label: string;
  tone: "primary" | "secondary" | "danger";
};

export type SystemInviteSummary = {
  id: string;
  companyName: string;
  inviteeName: string;
  email: string;
  roleLabel: string;
  status: SystemInviteStatus;
  statusLabel: string;
  expiresAtLabel: string;
  tokenPreview: string;
  inviteUrlLabel: string;
  requestedByLabel: string;
  acceptedAtLabel: string | null;
  actions: SystemInviteAction[];
};

export type SystemInviteFlowStep = {
  id: string;
  title: string;
  description: string;
  statusLabel: string;
};

export type SystemInternalInviteSummary = {
  id: string;
  companyName: string;
  inviterName: string;
  inviteeName: string;
  email: string;
  roleLabel: string;
  statusLabel: string;
  expiresAtLabel: string;
  connectionLabel: string;
  policyLabel: string;
};
