export type LoginPageSearchParams = Record<string, string | string[] | undefined>;

export function readLoginErrorParam(params: LoginPageSearchParams | null | undefined): string | null {
  const value = params?.error;
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof firstValue === "string" ? firstValue.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export function readLoginReturnToParam(params: LoginPageSearchParams | null | undefined): string | null {
  const value = params?.returnTo;
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof firstValue === "string" ? firstValue.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}
