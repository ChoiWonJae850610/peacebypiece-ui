import { handlePublicDocumentAttachment } from "@/lib/generated-documents/document-access/routeHelpers";

export async function GET(request: Request) {
  return handlePublicDocumentAttachment(request);
}
