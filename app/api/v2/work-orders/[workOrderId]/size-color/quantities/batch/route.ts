import { handleUpsertColorSizeQuantitiesV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

export async function PATCH(
  request: Request,
  context: { readonly params: Promise<{ readonly workOrderId: string }> },
) {
  const { workOrderId } = await context.params;
  return handleUpsertColorSizeQuantitiesV2(request, workOrderId);
}
