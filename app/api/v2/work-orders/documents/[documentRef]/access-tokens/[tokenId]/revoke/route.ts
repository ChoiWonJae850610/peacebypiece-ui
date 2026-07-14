import { handleRevokeDocumentAccessToken } from "@/lib/generated-documents/document-access/routeHelpers";

type RouteContext = { params: Promise<{ documentRef: string; tokenId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { documentRef: generatedDocumentId, tokenId } = await context.params;
  return handleRevokeDocumentAccessToken(generatedDocumentId, tokenId);
}
