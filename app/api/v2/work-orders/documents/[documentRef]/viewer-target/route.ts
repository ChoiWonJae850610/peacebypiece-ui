import { handleGetDocumentViewerTarget } from "@/lib/generated-documents/document-access/routeHelpers";

type RouteContext = { params: Promise<{ readonly documentRef: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { documentRef } = await context.params;
  return handleGetDocumentViewerTarget(request, documentRef);
}
