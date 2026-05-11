import {
  handleGetSystemUnitStandards,
  handlePatchSystemUnitStandard,
  handlePostSystemUnitStandard,
} from "@/lib/system/standards/api/unitRouteHandlers";

export async function GET() {
  return handleGetSystemUnitStandards();
}

export async function POST(request: Request) {
  return handlePostSystemUnitStandard(request);
}

export async function PATCH(request: Request) {
  return handlePatchSystemUnitStandard(request);
}
