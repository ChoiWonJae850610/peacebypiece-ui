import "server-only";

import type { WaflSessionPayload } from "@/lib/auth/session";
import { isDevTestContextEnabled } from "./config";
import { getDevTestContextTargetByMemberId, listDevTestContextTargets, type DevTestContextTarget } from "./repository";
import { verifyDevTestContextCookieValue, type DevTestContextOverlayPayload } from "./session";

export type DevTestContextOptions = {
  actualSession: Pick<WaflSessionPayload, "userId" | "email" | "name" | "role" | "companyId" | "companyMemberId" | "companyName">;
  effectiveSession: Pick<WaflSessionPayload, "userId" | "email" | "name" | "role" | "companyId" | "companyMemberId" | "companyName">;
  activeTarget: DevTestContextTarget | null;
  targets: DevTestContextTarget[];
};

export async function applyDevTestContextOverlay(
  baseSession: WaflSessionPayload,
  overlayCookieValue: string | null | undefined,
): Promise<WaflSessionPayload> {
  if (!isDevTestContextEnabled()) return baseSession;
  if (baseSession.role === "system_admin") return baseSession;

  const overlay = verifyDevTestContextCookieValue(overlayCookieValue);
  if (!overlay) return baseSession;
  if (overlay.originalUserId !== baseSession.userId) return baseSession;

  const target = await getDevTestContextTargetByMemberId(overlay.targetCompanyMemberId);
  if (!target) return baseSession;
  if (target.userId !== overlay.targetUserId || target.companyId !== overlay.targetCompanyId || target.role !== overlay.targetRole) {
    return baseSession;
  }

  return {
    ...baseSession,
    userId: target.userId,
    companyId: target.companyId,
    companyMemberId: target.companyMemberId,
    companyName: target.companyName,
    role: target.role,
    email: target.email || baseSession.email,
    name: target.name || baseSession.name,
    companyInvitationToken: null,
    googleSub: baseSession.googleSub,
    googlePictureUrl: baseSession.googlePictureUrl,
  };
}

export async function createDevTestContextOverlayPayload(
  actualSession: WaflSessionPayload,
  targetCompanyMemberId: string,
): Promise<{ payload: DevTestContextOverlayPayload; target: DevTestContextTarget } | null> {
  if (!isDevTestContextEnabled()) return null;
  if (actualSession.role === "system_admin") return null;

  const target = await getDevTestContextTargetByMemberId(targetCompanyMemberId);
  if (!target) return null;
  return {
    target,
    payload: {
      originalUserId: actualSession.userId,
      targetUserId: target.userId,
      targetCompanyId: target.companyId,
      targetCompanyMemberId: target.companyMemberId,
      targetRole: target.role,
      issuedAt: new Date().toISOString(),
    },
  };
}

export async function buildDevTestContextOptions(
  actualSession: WaflSessionPayload,
  effectiveSession: WaflSessionPayload,
): Promise<DevTestContextOptions> {
  const targets = await listDevTestContextTargets();
  const activeTarget = targets.find((target) => target.companyMemberId === effectiveSession.companyMemberId) ?? null;

  return {
    actualSession: pickSession(actualSession),
    effectiveSession: pickSession(effectiveSession),
    activeTarget,
    targets,
  };
}

function pickSession(session: WaflSessionPayload): DevTestContextOptions["actualSession"] {
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    companyId: session.companyId,
    companyMemberId: session.companyMemberId,
    companyName: session.companyName,
  };
}
