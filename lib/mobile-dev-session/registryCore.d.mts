export const MOBILE_CONNECT_CODE_LENGTH: 8;
export const MOBILE_CONNECT_CODE_TTL_MS: number;
export const MOBILE_CONNECT_MAX_ACTIVE_CODES: 32;
export const MOBILE_CONNECT_MAX_FAILURES: 5;
export function normalizeMobileConnectCode(value: unknown): string;
export function isMobileConnectCode(value: unknown): boolean;
export class MobileDevSessionRegistry<TPayload = unknown> {
  issue(input: { readonly payload: TPayload; readonly runToken: string; readonly now?: number }): {
    readonly code: string;
    readonly expiresAt: number;
    readonly hashPrefix: string;
  };
  exchange(input: { readonly code: unknown; readonly runToken: string; readonly now?: number }):
    | { readonly ok: true; readonly payload: TPayload; readonly hashPrefix: string }
    | { readonly ok: false; readonly reason: "unavailable" };
  cleanup(now?: number): void;
  readonly size: number;
}
