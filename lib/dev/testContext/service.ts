import "server-only";

import type { WaflSessionPayload } from "@/lib/auth/session";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { isDevTestContextEnabled } from "./config";
import { getDevTestContextTargetByKey, listDevTestContextTargets, type DevTestContextTarget } from "./repository";
import { verifyDevTestContextCookieValue, type DevTestContextOverlayPayload } from "./session";

export type DevTestContextOptions = {
  actualSession: Pick<WaflSessionPayload, "userId" | "email" | "name" | "role" | "companyId" | "companyMemberId" | "companyName">;
  effectiveSession: Pick<WaflSessionPayload, "userId" | "email" | "name" | "role" | "companyId" | "companyMemberId" | "companyName">;
  activeTarget: DevTestContextTarget | null;
  targets: DevTestContextTarget[];
};

export async function applyDevTestContextOverlay(baseSession: WaflSessionPayload, value: string | null | undefined): Promise<WaflSessionPayload> {
  if (!isDevTestContextEnabled()) return baseSession;
  if (!(await isActiveSystemAdminSession(baseSession))) return baseSession;
  const overlay = verifyDevTestContextCookieValue(value);
  if (!overlay || overlay.originalUserId !== baseSession.userId) return baseSession;
  const target = await getDevTestContextTargetByKey(overlay.targetKey);
  if (!target) return baseSession;
  if (target.userId !== overlay.targetUserId || target.companyId !== overlay.targetCompanyId || target.companyMemberId !== overlay.targetCompanyMemberId || target.role !== overlay.targetRole) return baseSession;
  return { ...baseSession, userId: target.userId, companyId: target.companyId, companyMemberId: target.companyMemberId,
    companyName: target.companyName, role: target.role, email: target.email || baseSession.email, name: target.name || baseSession.name,
    companyInvitationToken: null, googleSub: baseSession.googleSub, googlePictureUrl: baseSession.googlePictureUrl };
}

export async function createDevTestContextOverlayPayload(actualSession: WaflSessionPayload, targetKey: string): Promise<{ payload: DevTestContextOverlayPayload; target: DevTestContextTarget } | null> {
  if (!isDevTestContextEnabled()) return null;
  if (!(await isActiveSystemAdminSession(actualSession))) return null;
  const target = await getDevTestContextTargetByKey(targetKey);
  if (!target) return null;
  if (target.role === "system_admin" && target.email.trim().toLowerCase() !== actualSession.email.trim().toLowerCase()) return null;
  return { target, payload: { originalUserId: actualSession.userId, targetKey: target.targetKey, targetUserId: target.userId,
    targetCompanyId: target.companyId, targetCompanyMemberId: target.companyMemberId, targetRole: target.role, issuedAt: new Date().toISOString() } };
}

export async function buildDevTestContextOptions(actualSession: WaflSessionPayload, effectiveSession: WaflSessionPayload): Promise<DevTestContextOptions> {
  if (!(await isActiveSystemAdminSession(actualSession))) {
    return { actualSession: pickSession(actualSession), effectiveSession: pickSession(actualSession), activeTarget: null, targets: [] };
  }
  const allTargets = await listDevTestContextTargets();
  const normalizedActualEmail = actualSession.email.trim().toLowerCase();
  const targets = allTargets.filter((target) => target.role !== "system_admin" || target.email.trim().toLowerCase() === normalizedActualEmail);
  const activeTarget = targets.find((target) => target.userId === effectiveSession.userId && target.role === effectiveSession.role && target.companyId === effectiveSession.companyId) ?? null;
  return { actualSession: pickSession(actualSession), effectiveSession: pickSession(effectiveSession), activeTarget, targets };
}
function pickSession(session: WaflSessionPayload): DevTestContextOptions["actualSession"] {
  return { userId: session.userId, email: session.email, name: session.name, role: session.role, companyId: session.companyId,
    companyMemberId: session.companyMemberId, companyName: session.companyName };
}
