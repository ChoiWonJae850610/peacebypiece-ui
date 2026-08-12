export type MeasurementProjectionCommandKind =
  | "set-cell"
  | "set-unit"
  | "apply-template"
  | "save-company-template"
  | "update-company-template";

export type MeasurementProjectionImpact = {
  readonly matrix: "unchanged";
  readonly specifications: "locally-reconciled" | "unchanged" | "targeted-refresh";
  readonly workOrderSizeColorGets: 0;
  readonly workOrderSizeSpecGets: 0 | 1;
  readonly templateList: "unchanged" | "refresh-separately";
};

const IMPACTS: Readonly<Record<MeasurementProjectionCommandKind, MeasurementProjectionImpact>> = {
  "set-cell": {
    matrix: "unchanged",
    specifications: "locally-reconciled",
    workOrderSizeColorGets: 0,
    workOrderSizeSpecGets: 0,
    templateList: "unchanged",
  },
  "set-unit": {
    matrix: "unchanged",
    specifications: "locally-reconciled",
    workOrderSizeColorGets: 0,
    workOrderSizeSpecGets: 0,
    templateList: "unchanged",
  },
  "apply-template": {
    matrix: "unchanged",
    specifications: "targeted-refresh",
    workOrderSizeColorGets: 0,
    workOrderSizeSpecGets: 1,
    templateList: "unchanged",
  },
  "save-company-template": {
    matrix: "unchanged",
    specifications: "unchanged",
    workOrderSizeColorGets: 0,
    workOrderSizeSpecGets: 0,
    templateList: "refresh-separately",
  },
  "update-company-template": {
    matrix: "unchanged",
    specifications: "unchanged",
    workOrderSizeColorGets: 0,
    workOrderSizeSpecGets: 0,
    templateList: "refresh-separately",
  },
};

export function measurementProjectionImpact(command: MeasurementProjectionCommandKind) {
  return IMPACTS[command];
}
