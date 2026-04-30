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

export type SystemInviteSummary = {
  id: string;
  companyName: string;
  inviteeName: string;
  roleLabel: string;
  statusLabel: string;
  expiresAtLabel: string;
};
