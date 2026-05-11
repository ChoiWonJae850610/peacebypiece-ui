import {
  handleGetSystemProcessStandards,
  handlePatchSystemProcessStandard,
  handlePostSystemProcessStandard,
} from "@/lib/system/standards/api/processRouteHandlers";

export async function GET() {
  return handleGetSystemProcessStandards();
}

export async function POST(request: Request) {
  return handlePostSystemProcessStandard(request);
}

export async function PATCH(request: Request) {
  return handlePatchSystemProcessStandard(request);
}
