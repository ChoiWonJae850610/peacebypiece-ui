export type MobileConnectIssueResponse = {
  readonly ok: true;
  readonly code: string;
  readonly expiresAt: string;
  readonly effectiveUserName: string;
  readonly effectiveCompanyName: string;
  readonly effectiveRoleLabel: string;
};

export type MobileConnectExchangeResponse = {
  readonly ok: true;
  readonly connected: true;
};

export type MobileConnectErrorResponse = {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
};
