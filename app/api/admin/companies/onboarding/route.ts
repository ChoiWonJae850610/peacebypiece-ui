import { NextRequest, NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import {
  getCompanyOnboardingProfile,
  updateCompanyOnboardingProfile,
} from "@/lib/admin/settings/companyOnboardingRepository";
import { uploadCompanyOnboardingFile } from "@/lib/admin/settings/companyOnboardingFileService";
import type { CompanyOnboardingUpdateInput } from "@/lib/admin/settings/companyTypes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isUpdateBody(value: unknown): value is CompanyOnboardingUpdateInput {
  return typeof value === "object" && value !== null;
}

function getErrorCode(error: unknown): string {
  return error instanceof Error ? error.message : "COMPANY_ONBOARDING_SAVE_FAILED";
}


function parseJsonPayload(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
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

  if (!session || session.role !== "company_admin" || !session.companyId) {
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

  if (!session || session.role !== "company_admin" || !session.companyId) {
    return NextResponse.json(
      { profile: null, error: "COMPANY_ADMIN_SESSION_REQUIRED" },
      { status: 401 },
    );
  }

  const blockedResponse = await requireOnboardingCompanyApiAccess(session.companyId);
  if (blockedResponse) return blockedResponse;

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

  try {
    if (logoFile) {
      await uploadCompanyOnboardingFile({
        companyId: session.companyId,
        uploadedByUserId: session.userId,
        fileType: "logo",
        file: logoFile,
      });
    }

    if (businessLicenseFile) {
      await uploadCompanyOnboardingFile({
        companyId: session.companyId,
        uploadedByUserId: session.userId,
        fileType: "business_license",
        file: businessLicenseFile,
      });
    }

    const profile = await updateCompanyOnboardingProfile(session, body);
    if (!profile) {
      return NextResponse.json(
        { profile: null, error: "COMPANY_ONBOARDING_PROFILE_NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = getErrorCode(error);
    const status = code === "COMPANY_ONBOARDING_REQUIRED_FIELDS" ? 400 : 500;
    return NextResponse.json({ profile: null, error: code }, { status });
  }
}
