export class ExternalQaConfigError extends Error {
  readonly code: string;
  constructor(code: string);
}
export function isProductionEnvironment(env?: NodeJS.ProcessEnv): boolean;
export function isLocalHost(hostname: string): boolean;
export function normalizeRequestHost(rawHost: string | null | undefined): string | null;
export function validateQaOrigin(rawOrigin: string | null | undefined, options?: { readonly externalQa?: boolean; readonly production?: boolean }): string;
export function readExternalQaServerConfig(env?: NodeJS.ProcessEnv):
  | { readonly enabled: false }
  | { readonly enabled: true; readonly origin: string; readonly hostname: string; readonly hostAllowlist: ReadonlySet<string>; readonly production: boolean; readonly runToken: string };
export function readMobileQaConfig(env?: NodeJS.ProcessEnv, options?: { readonly requireExternalQa?: boolean }): { readonly externalQa: boolean; readonly origin: string | null };
export function isExternalQaPathAllowed(pathname: string, method?: string, env?: NodeJS.ProcessEnv): boolean;
