import { NextResponse } from "next/server";

import {
  acceptInvitationByToken,
  previewInvitationAcceptance,
} from "../invitationAcceptanceRepository";

interface AcceptInvitationRequestBody {
  token?: string | null;
  acceptedUserId?: string | null;
}

function getTokenFromRequest(request: Request): string {
  const url = new URL(request.url);
  return url.searchParams.get("token") ?? "";
}

function toTokenRequiredResponse() {
  return NextResponse.json(
    {
      ok: false,
      status: "invalid",
      invitation: null,
      message: "TOKEN_REQUIRED",
    },
    { status: 400 },
  );
}

function toErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      status: "invalid",
      invitation: null,
      message:
        error instanceof Error
          ? error.message
          : "Unknown invitation acceptance route error",
    },
    { status: 500 },
  );
}

export async function handlePreviewInvitationAcceptance(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token.trim()) {
      return toTokenRequiredResponse();
    }

    const result = await previewInvitationAcceptance(token);

    return NextResponse.json(result, {
      status: result.ok ? 200 : 404,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleAcceptInvitation(request: Request) {
  try {
    const body = (await request.json()) as AcceptInvitationRequestBody;
    const token = body.token ?? "";

    if (!token.trim()) {
      return toTokenRequiredResponse();
    }

    const result = await acceptInvitationByToken({
      rawToken: token,
      acceptedUserId: body.acceptedUserId ?? null,
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : 404,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
