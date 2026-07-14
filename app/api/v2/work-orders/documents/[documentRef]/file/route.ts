import { handleGetInternalGeneratedDocumentFile } from "@/lib/generated-documents/work-order-pdf/internalFileRoute";

type RouteContext = { readonly params: Promise<{ readonly documentRef: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { documentRef } = await context.params;
  return handleGetInternalGeneratedDocumentFile(request, documentRef);
}
