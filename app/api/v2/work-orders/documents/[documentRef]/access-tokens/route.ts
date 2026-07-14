import {
  handleCreateDocumentAccessToken,
  handleListDocumentAccessTokens,
} from "@/lib/generated-documents/document-access/routeHelpers";

type RouteContext = { params: Promise<{ documentRef: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { documentRef: generatedDocumentId } = await context.params;
  return handleListDocumentAccessTokens(generatedDocumentId);
}

export async function POST(request: Request, context: RouteContext) {
  const { documentRef: generatedDocumentId } = await context.params;
  return handleCreateDocumentAccessToken(request, generatedDocumentId);
}
