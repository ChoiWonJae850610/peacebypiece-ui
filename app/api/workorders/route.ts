import {
  handleDeleteWorkOrders,
  handleGetWorkOrders,
  handlePatchWorkOrders,
  handlePostWorkOrders,
} from "@/lib/workorder/api/workOrderRouteHandlers";

export async function GET() {
  return handleGetWorkOrders();
}

export async function POST(request: Request) {
  return handlePostWorkOrders(request);
}

export async function PATCH(request: Request) {
  return handlePatchWorkOrders(request);
}

export async function DELETE(request: Request) {
  return handleDeleteWorkOrders(request);
}
