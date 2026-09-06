import { NextResponse } from "next/server";

import { getCurrentWaflAuthSession } from "@/lib/auth/currentSession";
import { isActiveSystemAdminSession } from "@/lib/auth/systemAdminAccess";
import { readExternalQaServerConfig } from "@/lib/external-qa/configCore.mjs";
import {
  appendWaflInputSheetGeometryEvidence,
  parseWaflInputSheetGeometryEvidence,
} from "@/lib/external-qa/inputSheetGeometryEvidence";
import { getMobileDevSessionRuntimeConfig, isTailscaleAutoConnectRequest } from "@/lib/mobile-dev-session/config";
import { matchesApprovedLoginHash, normalizeTailscaleUserLogin } from "@/lib/mobile-dev-session/tailscaleIdentity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let externalQa;
  try {
    externalQa = readExternalQaServerConfig(process.env);
  } catch {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  if (!externalQa.enabled || externalQa.production) {
    return NextResponse.json({ error: "EXTERNAL_QA_DISABLED" }, { status: 403 });
  }
  const actualSession = await getCurrentWaflAuthSession();
  const mobileRuntime = getMobileDevSessionRuntimeConfig();
  const developerLogin = normalizeTailscaleUserLogin(request.headers.get("tailscale-user-login"));
  const exactTailscaleDeveloper = mobileRuntime !== null
    && isTailscaleAutoConnectRequest(request, mobileRuntime)
    && developerLogin !== null
    && mobileRuntime.developerLoginSha256 !== null
    && matchesApprovedLoginHash(developerLogin, mobileRuntime.developerLoginSha256);
  const authorized = actualSession !== null
    && (exactTailscaleDeveloper || await isActiveSystemAdminSession(actualSession));
  if (!authorized) {
    return NextResponse.json({ error: "SYSTEM_ADMIN_REQUIRED" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_EVIDENCE" }, { status: 400 });
  }
  const parsed = parseWaflInputSheetGeometryEvidence(
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).evidence
      : null,
  );
  if (parsed === null) return NextResponse.json({ error: "INVALID_EVIDENCE" }, { status: 400 });
  await appendWaflInputSheetGeometryEvidence(parsed.serialized);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
