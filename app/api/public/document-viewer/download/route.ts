import { handlePublicDocumentFile } from "@/lib/generated-documents/document-access/routeHelpers";

export async function GET(request: Request) {
  return handlePublicDocumentFile(request, "attachment");
}
