import { NextResponse } from "next/server";

import { getCurrentSignupApplicantSession } from "@/lib/signup/currentSignupApplicantSession";
import { SignupApplicationApiError } from "@/lib/signup/signupApplicationApiError";
import {
  deleteOwnedSignupApplicationCertificate,
  getOwnedSignupApplicationCertificate,
  uploadOwnedSignupApplicationCertificate,
} from "@/lib/signup/signupApplicationCertificateService";
import {
  assertSignupRateLimitExtensionPoint,
  createSignupMutationForbiddenResponse,
  isSameOriginSignupMutation,
} from "@/lib/signup/signupRequestGuards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: unknown): NextResponse {
  if (error instanceof SignupApplicationApiError) {
    return NextResponse.json(
      { ok: false, code: error.code },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { ok: false, code: "SIGNUP_CERTIFICATE_UNAVAILABLE" },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

async function requireApplicantSession() {
  const session = await getCurrentSignupApplicantSession();
  if (!session) throw new SignupApplicationApiError("SIGNUP_APPLICANT_SESSION_REQUIRED", 401);
  return session;
}

export async function GET() {
  try {
    const session = await requireApplicantSession();
    const certificate = await getOwnedSignupApplicationCertificate({ session });
    return NextResponse.json(
      { ok: true, certificate },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginSignupMutation(request)) return createSignupMutationForbiddenResponse();
    assertSignupRateLimitExtensionPoint();
    const session = await requireApplicantSession();
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    const certificate = await uploadOwnedSignupApplicationCertificate({
      session,
      file: file instanceof File ? file : null,
    });
    return NextResponse.json(
      { ok: true, certificate },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSameOriginSignupMutation(request)) return createSignupMutationForbiddenResponse();
    assertSignupRateLimitExtensionPoint();
    const session = await requireApplicantSession();
    const payload = (await request.json().catch(() => null)) as { fileId?: unknown } | null;
    const certificate = await deleteOwnedSignupApplicationCertificate({
      session,
      fileId: typeof payload?.fileId === "string" ? payload.fileId.trim() : null,
    });
    return NextResponse.json(
      { ok: true, certificate },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
