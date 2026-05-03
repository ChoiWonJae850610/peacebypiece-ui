import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "R2_DIRECT_UPLOAD_DISABLED",
      message: "R2 direct server upload is disabled. Use the Worker upload URL returned by /api/workorders/attachments/upload.",
    },
    { status: 410 },
  );
}
