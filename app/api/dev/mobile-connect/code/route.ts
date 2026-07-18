import { NextResponse } from "next/server";

import { getMobileDevSessionRuntimeConfig, isLocalMobileConnectRequest } from "@/lib/mobile-dev-session/config";
import { issueMobileConnectCode } from "@/lib/mobile-dev-session/service";
import type { MobileConnectErrorResponse, MobileConnectIssueResponse } from "@/lib/mobile-dev-session/types";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" } as const;

export async function POST(request: Request) {
  const config = getMobileDevSessionRuntimeConfig();
  if (!config || !isLocalMobileConnectRequest(request)) {
    return new NextResponse(null, { status: 404, headers: noStore });
  }

  const result = await issueMobileConnectCode(config.runToken);
  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : 403;
    return NextResponse.json<MobileConnectErrorResponse>(
      { ok: false, code: "MOBILE_CONNECT_NOT_AVAILABLE", message: "개발용 연결 코드를 발급할 수 없습니다." },
      { status, headers: noStore },
    );
  }

  return NextResponse.json<MobileConnectIssueResponse>(result, { headers: noStore });
}
