import { waflApiRequest } from "@/lib/api/waflApiClient";
import type {
  WorkOrderFactoryInstruction,
  WorkOrderFactoryInstructionPatch,
} from "@/lib/workorder/factoryInstruction/types";

type FactoryInstructionApiData = {
  instruction: WorkOrderFactoryInstruction;
};

export async function fetchWorkOrderFactoryInstruction(
  workOrderId: string,
): Promise<WorkOrderFactoryInstruction> {
  const data = await waflApiRequest<FactoryInstructionApiData>(
    `/api/workorders/${encodeURIComponent(workOrderId)}/factory-instruction`,
    { method: "GET", cache: "no-store" },
    "공장 전달사항을 불러오지 못했습니다.",
  );
  return data.instruction;
}

export async function patchWorkOrderFactoryInstruction(
  workOrderId: string,
  patch: WorkOrderFactoryInstructionPatch,
): Promise<WorkOrderFactoryInstruction> {
  const data = await waflApiRequest<FactoryInstructionApiData>(
    `/api/workorders/${encodeURIComponent(workOrderId)}/factory-instruction`,
    {
      method: "PATCH",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patch),
    },
    "공장 전달사항을 저장하지 못했습니다.",
  );
  return data.instruction;
}
