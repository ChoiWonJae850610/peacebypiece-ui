import { NextResponse } from "next/server";
import { getAdminFileManagementSnapshot } from "@/lib/admin/adminFiles.adapter";
import { listAdminFileManagementRows } from "@/lib/admin/adminFiles.serverActions";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function GET() {
  const fallbackSnapshot = getAdminFileManagementSnapshot();

  try {
    const rows = await listAdminFileManagementRows();

    return NextResponse.json({
      ok: true,
      snapshot: {
        ...fallbackSnapshot,
        dataSource: "db",
        dataSourceLabel: "DB 조회",
        attachments: rows.attachments,
        trashItems: rows.trashItems,
        usageCards: fallbackSnapshot.usageCards.map((card) => {
          if (card.label === "첨부파일") {
            return { ...card, value: `${rows.attachments.length}개`, description: "DB에서 조회한 활성 첨부파일" };
          }
          if (card.label === "휴지통") {
            return { ...card, value: `${rows.trashItems.length}개`, description: "DB에서 조회한 휴지통 보관 파일" };
          }
          return card;
        }),
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_SNAPSHOT_DB_FALLBACK]", { message, error });

    return NextResponse.json({
      ok: false,
      error: "ADMIN_FILE_SNAPSHOT_DB_FALLBACK",
      message,
      snapshot: fallbackSnapshot,
    });
  }
}
