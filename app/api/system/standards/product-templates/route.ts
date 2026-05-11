import {
  handleGetSystemProductTemplates,
  handlePatchSystemProductTemplate,
  handlePostSystemProductTemplate,
} from "@/lib/system/standards/api/productTemplateRouteHandlers";

export async function GET() {
  return handleGetSystemProductTemplates();
}

export async function POST(request: Request) {
  return handlePostSystemProductTemplate(request);
}

export async function PATCH(request: Request) {
  return handlePatchSystemProductTemplate(request);
}
