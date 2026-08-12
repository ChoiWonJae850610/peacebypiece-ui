export type ApplyMeasurementTemplateCommand = {
  readonly kind: "apply-template";
  readonly templateId: string;
  readonly expectedVersion: number;
  readonly clientRequestId: string;
};

export function measurementCommandPath(workOrderId: string): string {
  return `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-spec/commands`;
}

export function createApplyMeasurementTemplateCommand(input: {
  readonly templateId: string;
  readonly expectedVersion: number;
  readonly clientRequestId: string;
}): ApplyMeasurementTemplateCommand {
  return { kind: "apply-template", ...input };
}
