import { handleGetCurrentDocumentShareTarget } from "@/lib/generated-documents/document-access/routeHelpers";

type RouteContext = { params: Promise<{ documentRef: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { documentRef: generatedDocumentId } = await context.params;
  return handleGetCurrentDocumentShareTarget(request, generatedDocumentId);
}
