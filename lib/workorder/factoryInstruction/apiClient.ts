import type {
  WorkOrderFactoryInstruction,
  WorkOrderFactoryInstructionPatch,
} from "@/lib/workorder/factoryInstruction/types";

type FactoryInstructionApiResponse = {
  ok: boolean;
  instruction?: WorkOrderFactoryInstruction;
  message?: string;
  code?: string;
};

async function readResponse(response: Response): Promise<FactoryInstructionApiResponse> {
  const payload = (await response.json()) as FactoryInstructionApiResponse;
  if (!response.ok || !payload.ok || !payload.instruction) {
    throw new Error(payload.message || payload.code || "공장 전달사항을 처리하지 못했습니다.");
  }
  return payload;
}

export async function fetchWorkOrderFactoryInstruction(
  workOrderId: string,
): Promise<WorkOrderFactoryInstruction> {
  const response = await fetch(
    `/api/workorders/${encodeURIComponent(workOrderId)}/factory-instruction`,
    { method: "GET", cache: "no-store" },
  );
  return (await readResponse(response)).instruction!;
}

export async function patchWorkOrderFactoryInstruction(
  workOrderId: string,
  patch: WorkOrderFactoryInstructionPatch,
): Promise<WorkOrderFactoryInstruction> {
  const response = await fetch(
    `/api/workorders/${encodeURIComponent(workOrderId)}/factory-instruction`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
  );
  return (await readResponse(response)).instruction!;
}
