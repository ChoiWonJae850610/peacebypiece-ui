import { handleUpsertColorSizeQuantityV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

type Context = {
  readonly params: Promise<{
    readonly workOrderId: string;
    readonly colorId: string;
    readonly sizeRowId: string;
  }>;
};

export async function PATCH(request: Request, context: Context) {
  const { workOrderId, colorId, sizeRowId } = await context.params;
  return handleUpsertColorSizeQuantityV2(request, workOrderId, colorId, sizeRowId);
}
