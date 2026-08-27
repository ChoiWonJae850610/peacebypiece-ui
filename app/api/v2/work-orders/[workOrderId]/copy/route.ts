import { handleCreateWorkOrderCopy } from "@/lib/domain/work-orders/command/copyRoute";
export async function POST(request:Request,context:{readonly params:Promise<{readonly workOrderId:string}>}){const{workOrderId}=await context.params;return handleCreateWorkOrderCopy(request,workOrderId);}
