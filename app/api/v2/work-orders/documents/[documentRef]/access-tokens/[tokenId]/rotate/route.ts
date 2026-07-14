import { handleRotateDocumentAccessToken } from "@/lib/generated-documents/document-access/routeHelpers";

type RouteContext = { params: Promise<{ documentRef: string; tokenId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { documentRef: generatedDocumentId, tokenId } = await context.params;
  return handleRotateDocumentAccessToken(request, generatedDocumentId, tokenId);
}
