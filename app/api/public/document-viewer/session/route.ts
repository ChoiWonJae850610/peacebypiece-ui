import { handlePublicDocumentViewerSession } from "@/lib/generated-documents/document-access/routeHelpers";

export async function POST(request: Request) {
  return handlePublicDocumentViewerSession(request);
}
