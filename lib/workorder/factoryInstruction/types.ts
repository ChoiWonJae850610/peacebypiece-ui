export const FACTORY_INSTRUCTION_MAX_LENGTH = 5000;

export type WorkOrderFactoryInstruction = {
  workOrderId: string;
  content: string;
  includeInFactoryPdf: boolean;
  updatedAt: string | null;
};

export type WorkOrderFactoryInstructionPatch = {
  content: string;
  includeInFactoryPdf?: boolean;
};

export function createEmptyWorkOrderFactoryInstruction(
  workOrderId: string,
): WorkOrderFactoryInstruction {
  return {
    workOrderId,
    content: "",
    includeInFactoryPdf: true,
    updatedAt: null,
  };
}

export function normalizeWorkOrderFactoryInstructionContent(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, FACTORY_INSTRUCTION_MAX_LENGTH);
}
