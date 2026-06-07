import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { getCustomerPolicyDocumentById } from "@/lib/policies/customerPolicyDocuments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

const CUSTOMER_PUBLIC_POLICY_DIR = path.join(process.cwd(), "docs", "정책문서", "고객공개");

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").trim();
}

function toSafePolicyPath(fileName: string): string {
  const resolvedPath = path.resolve(CUSTOMER_PUBLIC_POLICY_DIR, fileName);
  const safeRoot = path.resolve(CUSTOMER_PUBLIC_POLICY_DIR);
  if (!resolvedPath.startsWith(safeRoot + path.sep) && resolvedPath !== safeRoot) {
    throw new Error("Invalid policy document path");
  }
  return resolvedPath;
}

export async function GET(_request: Request, context: RouteContext) {
  const { documentId } = await context.params;
  const document = getCustomerPolicyDocumentById(documentId);

  if (!document) {
    return NextResponse.json({ ok: false, error: "POLICY_DOCUMENT_NOT_FOUND" }, { status: 404 });
  }

  try {
    const markdown = await fs.readFile(toSafePolicyPath(document.sourceFileName), "utf8");

    return NextResponse.json({
      ok: true,
      document: {
        id: document.id,
        title: document.title,
        subtitle: document.subtitle,
        category: document.category,
        categoryLabel: document.categoryLabel,
        versionLabel: document.versionLabel,
        effectiveDateLabel: document.effectiveDateLabel,
        requiredForApproval: document.requiredForApproval,
        sourceFileName: document.sourceFileName,
        sourceNote: document.sourceNote ?? null,
        markdown: normalizeMarkdown(markdown),
      },
    });
  } catch (error) {
    console.error("[policies/customer-documents] failed to read markdown", {
      documentId,
      sourceFileName: document.sourceFileName,
      error,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "POLICY_MARKDOWN_READ_FAILED",
        document: {
          id: document.id,
          title: document.title,
          sourceFileName: document.sourceFileName,
        },
      },
      { status: 500 },
    );
  }
}
