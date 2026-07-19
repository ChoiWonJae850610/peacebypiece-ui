import "server-only";

import { listActiveSystemAdministratorsForExactMapping } from "@/lib/auth/systemAdminAccess";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { listDevTestContextTargets } from "@/lib/dev/testContext/repository";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import { matchesApprovedLoginHash, normalizeTailscaleUserLogin } from "@/lib/mobile-dev-session/tailscaleIdentity";

const CANONICAL_COMPANY_A_ID = "wafl-fn-company-a";

export type TailscaleAutoConnectResult =
  | { readonly ok: true; readonly payload: WaflSessionPayload }
  | { readonly ok: false; readonly reason: "runtime" | "identity" | "administrator" | "company-target" };

export async function createTailscaleDeveloperSession(input: {
  readonly rawLoginHeader: string | null;
  readonly approvedLoginSha256: string;
  readonly approvedSystemAdminEmailSha256: string;
}): Promise<TailscaleAutoConnectResult> {
  const runtime = getWorkOrderV2ReadRuntimeGuard();
  if (!runtime.ok) return { ok: false, reason: "runtime" };

  const login = normalizeTailscaleUserLogin(input.rawLoginHeader);
  if (!login || !matchesApprovedLoginHash(login, input.approvedLoginSha256)) {
    return { ok: false, reason: "identity" };
  }

  const administrators = await listActiveSystemAdministratorsForExactMapping();
  if (
    administrators.length !== 1
    || !matchesApprovedLoginHash(administrators[0].email.trim().toLowerCase(), input.approvedSystemAdminEmailSha256)
  ) {
    return { ok: false, reason: "administrator" };
  }

  const targets = (await listDevTestContextTargets()).filter((target) => (
    target.targetType === "company"
    && target.companyId === CANONICAL_COMPANY_A_ID
    && target.role === "company_admin"
    && target.companyMemberId
    && target.companyName
    && (target.permissionCodes.includes("workorder.read") || target.role === "company_admin")
  ));
  if (targets.length !== 1) return { ok: false, reason: "company-target" };
  const target = targets[0];

  return {
    ok: true,
    payload: {
      userId: target.userId,
      companyId: target.companyId,
      companyMemberId: target.companyMemberId,
      companyName: target.companyName,
      role: "company_admin",
      email: target.email,
      name: target.name,
      issuedAt: new Date().toISOString(),
      companyInvitationToken: null,
      googleSub: null,
      googlePictureUrl: null,
    },
  };
}
