import { handleMeasurementCommand } from "@/lib/domain/work-orders/measurement/measurementCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };
export async function POST(request: Request, context: RouteContext) { const { workOrderId } = await context.params; return handleMeasurementCommand(request, workOrderId); }
