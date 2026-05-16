import { NextResponse } from "next/server";

import { WAFL_AUTH_SESSION_COOKIE } from "@/lib/auth/session";

function createLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(WAFL_AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
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
