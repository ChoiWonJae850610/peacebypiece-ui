import { NextRequest, NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyAdminAccountFromInvitationSession } from "@/lib/auth/companyInvitationLoginRepository";
import { createWaflSessionCookieValue, WAFL_AUTH_SESSION_COOKIE, type WaflSessionPayload } from "@/lib/auth/session";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import {
  getCompanyOnboardingProfile,
  updateCompanyOnboardingProfile,
  validateCompanyOnboardingUpdateInput,
} from "@/lib/admin/settings/companyOnboardingRepository";
import { uploadCompanyOnboardingFile } from "@/lib/admin/settings/companyOnboardingFileService";
import {
  COMPANY_ONBOARDING_FILE_ERROR_CODES,
  validateCompanyOnboardingFileInput,
} from "@/lib/admin/settings/companyOnboardingFilePolicy";
import type { CompanyOnboardingUpdateInput, CompanyOnboardingFileType } from "@/lib/admin/settings/companyTypes";
import { isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isUpdateBody(value: unknown): value is CompanyOnboardingUpdateInput {
  return typeof value === "object" && value !== null;
}

function getErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "COMPANY_ONBOARDING_SAVE_FAILED";
}


function hasCompanyInvitationEntrySession(session: WaflSessionPayload | null): session is WaflSessionPayload & { companyInvitationToken: string } {
  return Boolean(session?.role === "company_admin" && session.companyInvitationToken?.trim());
}

function createPendingInvitationProfile(session: WaflSessionPayload) {
  return {
    companyId: "pending-company-invitation",
    companyName: "",
    companyEnglishName: "",
    businessName: "",
    businessRegistrationNumber: "",
    logoUrl: "",
    postalCode: "",
    roadAddress: "",
    jibunAddress: "",
    addressDetail: "",
    addressExtra: "",
    requestedPlanCode: "basic",
    onboardingStatus: "profile_required" as const,
    onboardingCompletedAt: null,
    subscriptionStatus: "trialing" as const,
    trialStartedAt: null,
    trialEndsAt: null,
    trialExpired: false,
    adminName: session.name ?? "",
    adminPhone: "",
    profileComplete: false,
    onboardingFiles: [],
  };
}

function setCompanyAdminSessionCookie(response: NextResponse, request: NextRequest, session: WaflSessionPayload) {
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, createWaflSessionCookieValue(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

function parseJsonPayload(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function validateOnboardingFilePreflight(fileType: CompanyOnboardingFileType, file: File | null): string | null {
  if (!file) return null;

  const validation = validateCompanyOnboardingFileInput({
    fileType,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!validation.ok) return validation.error;
  if (!isR2WorkerUploadConfigured()) return COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadNotConfigured;
  return null;
}

function getOnboardingFilePreflightError(input: {
  logoFile: File | null;
  businessLicenseFile: File | null;
}): string | null {
  return (
    validateOnboardingFilePreflight("logo", input.logoFile) ??
    validateOnboardingFilePreflight("business_license", input.businessLicenseFile)
  );
}

async function requireOnboardingCompanyApiAccess(companyId: string): Promise<NextResponse | null> {
  return createCompanyApiAccessBlockedResponse(companyId, {
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
}
export async function GET() {
  const session = await getCurrentWaflSession();

  if (!session || session.role !== "company_admin") {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  if (!session.companyId && hasCompanyInvitationEntrySession(session)) {
    return NextResponse.json(
      { profile: createPendingInvitationProfile(session) },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!session.companyId) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  const blockedResponse = await requireOnboardingCompanyApiAccess(session.companyId);
  if (blockedResponse) return blockedResponse;

  const profile = await getCompanyOnboardingProfile(session);

  if (!profile) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ONBOARDING_PROFILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentWaflSession();

  if (!session || session.role !== "company_admin") {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let body: unknown = null;
  let logoFile: File | null = null;
  let businessLicenseFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    const payload = formData?.get("payload");
    body = parseJsonPayload(typeof payload === "string" ? payload : null);
    const logo = formData?.get("logo");
    const businessLicense = formData?.get("business_license");
    logoFile = logo instanceof File && logo.size > 0 ? logo : null;
    businessLicenseFile = businessLicense instanceof File && businessLicense.size > 0 ? businessLicense : null;
  } else {
    body = (await request.json().catch(() => null)) as unknown;
  }

  if (!isUpdateBody(body)) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ONBOARDING_PAYLOAD_REQUIRED" },
      { status: 400 },
    );
  }

  const profileValidation = validateCompanyOnboardingUpdateInput(body);
  if (!profileValidation.ok) {
    return NextResponse.json(
      { profile: null, error: profileValidation.error },
      { status: 400 },
    );
  }

  const filePreflightError = getOnboardingFilePreflightError({ logoFile, businessLicenseFile });
  if (filePreflightError) {
    return NextResponse.json(
      { profile: null, error: filePreflightError },
      { status: 400 },
    );
  }

  let effectiveSession = session;

  if (!effectiveSession.companyId) {
    if (!hasCompanyInvitationEntrySession(effectiveSession)) {
      return NextResponse.json(
        { profile: null, error: "COMPANY_ADMIN_INVITATION_REQUIRED" },
        { status: 403 },
      );
    }

    try {
      effectiveSession = await createCompanyAdminAccountFromInvitationSession(effectiveSession);
    } catch (error) {
      return NextResponse.json(
        { profile: null, error: getErrorCode(error) },
        { status: 400 },
      );
    }
  }

  const companyId = effectiveSession.companyId;
  if (!companyId) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  const blockedResponse = await requireOnboardingCompanyApiAccess(companyId);
  if (blockedResponse) return blockedResponse;

  try {
    if (logoFile) {
      await uploadCompanyOnboardingFile({
        companyId,
        uploadedByUserId: effectiveSession.userId,
        fileType: "logo",
        file: logoFile,
      });
    }

    if (businessLicenseFile) {
      await uploadCompanyOnboardingFile({
        companyId,
        uploadedByUserId: effectiveSession.userId,
        fileType: "business_license",
        file: businessLicenseFile,
      });
    }

    const profile = await updateCompanyOnboardingProfile(effectiveSession, body);
    if (!profile) {
      return NextResponse.json(
        { profile: null, error: "COMPANY_ONBOARDING_PROFILE_NOT_FOUND" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
    if (effectiveSession.userId !== session.userId || effectiveSession.companyId !== session.companyId) {
      setCompanyAdminSessionCookie(response, request, effectiveSession);
    }
    return response;
  } catch (error) {
    const code = getErrorCode(error);
    const status = code === "COMPANY_ONBOARDING_REQUIRED_FIELDS" ? 400 : 500;
    return NextResponse.json({ profile: null, error: code }, { status });
  }
}
