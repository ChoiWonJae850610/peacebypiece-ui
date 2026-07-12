import { handlePatchProcessV2 } from "@/lib/domain/work-orders/command/processCommandRoute";

type RouteContext={params:Promise<{workOrderId:string;processId:string}>};
export async function PATCH(request:Request,context:RouteContext){const {workOrderId,processId}=await context.params;return handlePatchProcessV2(request,workOrderId,processId);}
