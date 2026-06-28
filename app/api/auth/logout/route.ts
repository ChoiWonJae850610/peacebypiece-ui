import { NextResponse } from "next/server";

import { WAFL_AUTH_SESSION_COOKIE } from "@/lib/auth/session";
import { WAFL_DEV_TEST_CONTEXT_COOKIE } from "@/lib/dev/testContext/session";
import { WAFL_SIGNUP_APPLICANT_SESSION_COOKIE } from "@/lib/signup/signupApplicantSession";

function createLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  const secure = new URL(request.url).protocol === "https:";
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(WAFL_DEV_TEST_CONTEXT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(WAFL_SIGNUP_APPLICANT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(request: Request) {
  return createLogoutResponse(request);
}

export async function GET(request: Request) {
  return createLogoutResponse(request);
}
