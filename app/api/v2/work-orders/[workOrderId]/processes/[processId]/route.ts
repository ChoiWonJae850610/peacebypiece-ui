import { handleDeleteProcessV2, handlePatchProcessV2 } from "@/lib/domain/work-orders/command/processCommandRoute";

type RouteContext={params:Promise<{workOrderId:string;processId:string}>};
export async function PATCH(request:Request,context:RouteContext){const {workOrderId,processId}=await context.params;return handlePatchProcessV2(request,workOrderId,processId);}
export async function DELETE(request:Request,context:RouteContext){const {workOrderId,processId}=await context.params;return handleDeleteProcessV2(request,workOrderId,processId);}
