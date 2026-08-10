import {
  handleDeleteMaterialLineV2,
  handlePatchMaterialLineV2,
} from "@/lib/domain/work-orders/command/materialCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string; materialLineId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workOrderId, materialLineId } = await context.params;
  return handlePatchMaterialLineV2(request, workOrderId, materialLineId);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { workOrderId, materialLineId } = await context.params;
  return handleDeleteMaterialLineV2(request, workOrderId, materialLineId);
}
