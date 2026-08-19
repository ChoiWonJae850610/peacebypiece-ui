import { handleProductionProcessOrderV2 } from "@/lib/domain/work-orders/command/processCommandRoute";

type RouteContext={params:Promise<{workOrderId:string;processId:string}>};
export async function POST(request:Request,context:RouteContext){const {workOrderId,processId}=await context.params;return handleProductionProcessOrderV2(request,workOrderId,processId,"cancel");}
