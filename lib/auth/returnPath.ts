const SAFE_APP_PREFIXES = ["/workspace", "/worker", "/system", "/me"] as const;

export function normalizeSafeReturnPath(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) return null;

  try {
    const parsed = new URL(trimmed, "https://wafl.local");
    if (parsed.origin !== "https://wafl.local") return null;
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return SAFE_APP_PREFIXES.some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))
      ? path
      : null;
  } catch {
    return null;
  }
}

export function buildLoginPath(returnTo?: string | null, error?: string | null): string {
  const params = new URLSearchParams();
  const safeReturnTo = normalizeSafeReturnPath(returnTo);
  if (safeReturnTo) params.set("returnTo", safeReturnTo);
  if (error?.trim()) params.set("error", error.trim());
  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
