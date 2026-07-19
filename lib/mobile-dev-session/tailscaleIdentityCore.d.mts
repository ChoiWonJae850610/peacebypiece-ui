export function normalizeTailscaleUserLogin(rawValue: string | null | undefined): string | null;
export function sha256Hex(value: string): string;
export function matchesApprovedLoginHash(login: string, approvedSha256: string): boolean;
