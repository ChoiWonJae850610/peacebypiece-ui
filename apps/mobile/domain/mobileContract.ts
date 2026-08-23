export type MobileCurrentUser = {
  readonly id: string;
  readonly name: string;
  readonly role: "company_admin" | "member" | "system_admin";
  readonly companyId: string | null;
  readonly companyName: string | null;
  readonly companyMemberId: string | null;
  readonly permissionCodes?: readonly string[];
};

export type WorkOrderStatus = "draft" | "ready_to_issue" | "issued" | "revised" | "completed" | "cancelled";
export type WorkOrderListStatusFilter = "all" | "draft" | "delivery" | "progress" | "completed" | "hold_cancel";
export type WorkOrderCharacterFilter = "all" | "production" | "sample";
export type WorkOrderLineageFilter = "reorder" | "rework";
export type WorkOrderDerivationKind = "original" | "reorder" | "rework";
export type WorkOrderIdentity = {
  readonly isSample: boolean;
  readonly derivationKind: WorkOrderDerivationKind;
  readonly reorderRound: number;
  readonly sourceWorkOrderId: string | null;
  readonly sourceRevisionId: string | null;
  readonly seriesRootWorkOrderId: string | null;
};

export type WorkOrderListItem = {
  readonly workOrderId: string;
  readonly displayDocumentNumber: string | null;
  readonly productName: string;
  readonly status: WorkOrderStatus;
  readonly dueDate: string | null;
  readonly totalQuantity: number;
  readonly estimatedAmountSummary: { readonly currency: string; readonly estimatedTotal: string };
  readonly representativeThumbnail: { readonly imageId: string; readonly thumbnailUrl: string | null; readonly altText: string } | null;
  readonly incompleteMaterialSummary: { readonly incompleteFabricCount: number; readonly incompleteAccessoryCount: number };
  readonly processCount: number;
  readonly latestDocumentStatus: string | null;
  readonly updatedAt: string;
  readonly identity: WorkOrderIdentity;
};

export type WorkOrderListPage = {
  readonly items: readonly WorkOrderListItem[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly limit: number;
};

export type WorkOrderDetailCore = {
  readonly header: {
    readonly id: string;
    readonly productName: string;
    readonly productTypeCode: string | null;
    readonly productTypeAlias: string | null;
    readonly seasonCode: string | null;
    readonly itemCode: string | null;
    readonly dueDate: string | null;
    readonly totalQuantity: number;
    readonly status: WorkOrderStatus;
    readonly currentRevisionNumber: number;
    readonly currentRevisionId: string;
    readonly currentRevisionVersion: number;
    readonly readiness: {
      readonly canIssue: boolean;
      readonly issues: readonly { readonly code: string; readonly message: string }[];
      readonly hardBlockers: readonly { readonly code: string; readonly message: string }[];
      readonly warnings: readonly { readonly code: string; readonly message: string }[];
      readonly checkedAt: string;
      readonly basedOnVersion: number;
      readonly source: "server_canonical" | "client_preview";
    };
    readonly document: {
      readonly latestDocumentId: string | null;
      readonly status: string | null;
      readonly displayDocumentNumber: string | null;
      readonly generatedAt: string | null;
    };
    readonly representativeImage: {
      readonly imageId: string;
      readonly thumbnailUrl: string | null;
      readonly altText: string;
    } | null;
    readonly entityVersion: number;
    readonly updatedAt: string;
    readonly identity: WorkOrderIdentity;
    readonly sourceSummary: {
      readonly workOrderId: string;
      readonly productName: string;
      readonly isSample: boolean;
      readonly derivationKind: WorkOrderDerivationKind;
      readonly reorderRound: number;
    } | null;
  };
  readonly revision: {
    readonly status: string;
    readonly finalizedAt: string | null;
    readonly factoryDeliveryMemo: string | null;
  };
  readonly amounts: {
    readonly currency: string;
    readonly unitPrice: string;
    readonly fabricTotal: string;
    readonly accessoryTotal: string;
    readonly processTotal: string;
    readonly estimatedTotal: string;
  };
  readonly tabCounts: {
    readonly fabric: number;
    readonly accessory: number;
    readonly colors: number;
    readonly sizes: number;
    readonly processes: number;
    readonly images: number;
    readonly attachments: number;
    readonly documents: number;
    readonly history: number;
  };
};

export type WorkOrderProcessStatus = "ready" | "in_progress" | "completed";

export type WorkOrderProcess = {
  readonly id: string;
  readonly processTypeCode: string;
  readonly processName: string;
  readonly partnerId: string | null;
  readonly partnerName: string | null;
  readonly quantity: string;
  readonly dueDate: string | null;
  readonly unitCode: string;
  readonly currency: string;
  readonly unitPrice: string;
  readonly amount: string;
  readonly memo: string | null;
  readonly applicationArea: string | null;
  readonly applicationColorTarget: string | null;
  readonly status: WorkOrderProcessStatus;
  readonly displayOrder: number;
  readonly editable: boolean;
  readonly locked: boolean;
  readonly role: "factory" | "additional";
};

export type WorkOrderProcesses = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly flowSummary: readonly {
    readonly stepCode: "order" | "material" | "cutting" | "process" | "inspection" | "shipment";
    readonly status: WorkOrderProcessStatus;
  }[];
  readonly processes: readonly WorkOrderProcess[];
  readonly totalQuantity: string;
  readonly editable: boolean;
  readonly entityVersion: number;
};

export type WorkOrderProductionOptions = {
  readonly workOrderId: string;
  readonly entityVersion: number;
  readonly totalQuantity: string;
  readonly editable: boolean;
  readonly factoryPartners: readonly { readonly id: string; readonly name: string }[];
  readonly processStandards: readonly { readonly id: string; readonly code: string; readonly name: string }[];
  readonly processPartners: readonly { readonly processCode: string; readonly partnerId: string; readonly partnerName: string }[];
};

export type WorkOrderProductionMutationResult = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly processId: string | null;
  readonly nextVersion: number;
};

export type GeneratedWorkOrderDocument = {
  readonly id: string;
  readonly revisionId: string;
  readonly documentType: "factory_instruction" | "work_order" | "order_request";
  readonly generationNumber: number;
  readonly displayDocumentNumber: string;
  readonly status: "pending" | "generated" | "failed" | "revoked" | "deleted";
  readonly fileSizeBytes: number | null;
  readonly generatedAt: string | null;
  readonly accessTokenAvailable: boolean;
  readonly inlineUrl: string | null;
  readonly downloadUrl: string | null;
};

export type WorkOrderDocumentPage = {
  readonly workOrderId: string;
  readonly currentRevisionId: string;
  readonly items: readonly GeneratedWorkOrderDocument[];
  readonly entityVersion: number;
};

export type DocumentAccessTokenSummary = {
  readonly tokenId: string;
  readonly tokenPurpose: "manual_share" | "embedded_qr";
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
  readonly lastAccessedAt: string | null;
  readonly accessCount: number;
  readonly status: "active" | "expired" | "revoked";
};

export type WorkOrderImageAsset = {
  readonly assetType: "image";
  readonly id: string;
  readonly filename: string;
  readonly optionalTitle: string | null;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly displayOrder: number;
  readonly isRepresentative: boolean;
  readonly state: "active";
  readonly thumbnailUrl: string | null;
  readonly previewUrl: string | null;
  readonly fullscreenUrl: string | null;
  readonly originalUrl: string | null;
  readonly viewUrl: string | null;
  readonly uploadedAt: string;
};

export type WorkOrderAttachmentAsset = {
  readonly assetType: "attachment";
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly displayOrder: number;
  readonly includeInDocument: boolean;
  readonly state: "active";
  readonly viewUrl: string | null;
  readonly uploadedAt: string;
};

export type WorkOrderImagePage = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly items: readonly WorkOrderImageAsset[];
  readonly attachments: readonly WorkOrderAttachmentAsset[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly limit: number;
  readonly entityVersion: number;
};

export type WorkOrderSizeRow = {
  readonly id: string;
  readonly code: string;
  readonly displayLabel: string;
  readonly displayOrder: number;
};

export type WorkOrderColorRow = {
  readonly id: string;
  readonly displayName: string;
  readonly hexValue: string | null;
  readonly displayOrder: number;
};

export type CompanyWorkOrderStructureOption = {
  readonly id: string;
  readonly kind: "size" | "color" | "spec_item";
  readonly displayName: string;
  readonly hexValue: string | null;
  readonly active: boolean;
  readonly sourceKind: "company";
  readonly categoryCode: "T" | "B" | "O" | "D" | "S" | "X" | null;
};

export type WorkOrderStructureOptionPage = {
  readonly entityVersion: number;
  readonly categoryCode: "T" | "B" | "O" | "D" | "S" | "X" | null;
  readonly items: readonly CompanyWorkOrderStructureOption[];
};

export type WorkOrderQuantityCell = {
  readonly colorId: string;
  readonly sizeRowId: string;
  readonly quantity: string;
};

export type WorkOrderSizeColorMatrix = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly sizes: readonly WorkOrderSizeRow[];
  readonly colors: readonly WorkOrderColorRow[];
  readonly quantityCells: readonly WorkOrderQuantityCell[];
  readonly matrixTotal: string;
  readonly expectedTotal: string;
  readonly workOrderTotal: string;
  readonly revisionTotal: string;
  readonly projectionsMatch: boolean;
  readonly totalsMatch: boolean;
  readonly memoFallback: string | null;
  readonly entityVersion: number;
};

export type WorkOrderPomColumn = {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly displayOrder: number;
};

export type WorkOrderSizeSpecCell = {
  readonly sizeRowId: string;
  readonly pomColumnId: string;
  readonly displayValue: string | null;
  readonly decimalValue: string | null;
};

export type WorkOrderSizeSpec = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly genderCode: string | null;
  readonly categoryCode: string | null;
  readonly measurementUnit: "cm" | "inch";
  readonly templateId: string | null;
  readonly templateVersion: number | null;
  readonly templateName: string | null;
  readonly sourceTemplateModified: boolean;
  readonly sizes: readonly WorkOrderSizeRow[];
  readonly pomColumns: readonly WorkOrderPomColumn[];
  readonly cells: readonly WorkOrderSizeSpecCell[];
  readonly entityVersion: number;
};

export type WorkOrderSizeColorBundle = {
  readonly matrix: WorkOrderSizeColorMatrix;
  readonly specifications: WorkOrderSizeSpec;
};

export type SizeColorStructureCommandBase = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
};

export type SizeColorStructureCommandResult = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly targetKind: "size" | "color" | "quantity";
  readonly targetId: string | null;
  readonly colorId?: string;
  readonly sizeRowId?: string;
  readonly quantity?: number;
  readonly totalQuantity?: number;
  readonly deletedQuantityCellCount?: number;
  readonly removedQuantity?: number;
  readonly createdItems?: readonly {
    readonly id: string;
    readonly displayName: string;
    readonly hexValue: string | null;
  }[];
  readonly deletedTargetIds?: readonly string[];
  readonly nextVersion: number;
};

export type SizeColorSelectionBatchInput = SizeColorStructureCommandBase & {
  readonly targetKind: "size" | "color";
  readonly additions: readonly {
    readonly displayName: string;
    readonly hexValue: string | null;
  }[];
  readonly deletionIds: readonly string[];
};

type MeasurementCommandBase = SizeColorStructureCommandBase;
export type MeasurementCommandInput = MeasurementCommandBase & (
  | { readonly kind: "apply-template"; readonly templateId: string }
  | { readonly kind: "set-unit"; readonly measurementUnit: "cm" | "inch" }
  | { readonly kind: "set-cell"; readonly sizeRowId: string; readonly pomColumnId: string; readonly measurementUnit: "cm" | "inch"; readonly displayValue: string | null }
  | { readonly kind: "add-pom"; readonly displayName: string; readonly pomCode?: string; readonly measurementType: "circumference" | "half_flat" | "quarter_pattern_reference" | "length"; readonly instruction?: string }
  | { readonly kind: "rename-pom"; readonly pomColumnId: string; readonly displayName: string }
  | { readonly kind: "remove-pom"; readonly pomColumnId: string }
  | { readonly kind: "reorder-poms"; readonly orderedIds: readonly string[] }
  | { readonly kind: "set-pom-selection"; readonly selectedItems: readonly { readonly catalogOptionId: string | null; readonly systemSpecItemKey: string | null; readonly currentPomId: string | null; readonly displayName: string }[] }
  | { readonly kind: "save-company-template"; readonly templateName: string; readonly templateId?: never }
  | { readonly kind: "update-company-template"; readonly templateId: string }
);

export type MeasurementCommandResult = {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly nextVersion: number;
  readonly changedFields: readonly string[];
};
export type MeasurementTemplateSummary = { readonly id:string;readonly sourceKind:"system"|"company";readonly name:string;readonly templateVersion:number;readonly categoryCode:string|null;readonly genderCode:string|null;readonly sizeSetCode:string|null;readonly sizeCount:number;readonly pomCount:number;readonly valueCount:number };

export type WorkOrderImageUploadTarget = {
  readonly storageKey: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSize: number;
  readonly uploadUrl: string;
  readonly method: "PUT";
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresInSeconds: number;
};

export type WorkOrderImageCommandResult = {
  readonly workOrderId: string;
  readonly imageId: string;
  readonly nextVersion: number;
  readonly isRepresentative: boolean;
  readonly deleted: boolean;
};

export type WorkOrderAttachmentCommandResult = {
  readonly workOrderId: string;
  readonly attachmentId: string;
  readonly nextVersion: number;
  readonly deleted: boolean;
};

export type MaterialLineStatus = "editing" | "requested" | "completed" | "cancelled" | "unknown";
export type MaterialType = "fabric" | "accessory";

export type WorkOrderMaterialLine = {
  readonly id: string;
  readonly materialType: MaterialType;
  readonly name: string;
  readonly colorOption: string | null;
  readonly usageArea: string | null;
  readonly partnerId: string | null;
  readonly partnerName: string | null;
  readonly requiredQuantity: string;
  readonly allowanceQuantity: string;
  readonly inventoryUsageQuantity: string;
  readonly orderQuantity: string;
  readonly unitCode: string;
  readonly currency: string;
  readonly unitPrice: string;
  readonly amount: string;
  readonly memo: string | null;
  readonly status: MaterialLineStatus;
  readonly displayOrder: number;
  readonly locked: boolean;
  readonly deletable: boolean;
  readonly removalMode: "hard_delete" | "history_preserving_remove" | "not_allowed";
  readonly lifecycle: "active" | "archived";
  readonly archivedAt: string | null;
};

export type WorkOrderMaterialPage = {
  readonly workOrderId: string;
  readonly materialType: MaterialType;
  readonly lifecycle: "active" | "archived";
  readonly items: readonly WorkOrderMaterialLine[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly limit: number;
  readonly entityVersion: number;
  readonly totalCount: number;
};

export type MaterialDraftFields = {
  readonly name: string;
  readonly colorOption: string;
  readonly usageArea: string;
  readonly partnerId: string;
  readonly requiredQuantity: string;
  readonly allowanceQuantity: string;
  readonly inventoryUsageQuantity: string;
  readonly orderQuantity: string;
  readonly unitCode: string;
  readonly unitPrice: string;
  readonly memo: string;
};

export type MaterialPartnerOption = {
  readonly id: string;
  readonly name: string;
  readonly role?: "factory" | "fabric" | "subsidiary" | "outsourcing";
  readonly contactPerson?: string | null;
  readonly contact?: string | null;
};

export type WorkOrderMaterialPartnerPage = {
  readonly workOrderId: string;
  readonly entityVersion: number;
  readonly items: readonly MaterialPartnerOption[];
};

export type MaterialDraftUpdate = Partial<Omit<MaterialDraftFields, "orderQuantity">>;

export type CreateMaterialLineInput = MaterialDraftFields & {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly materialType: MaterialType;
};

export type PatchMaterialLineInput = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly patch: MaterialDraftUpdate;
};

export type MaterialLineCommandResult = {
  readonly result: {
    readonly workOrderId: string;
    readonly materialLineId: string;
    readonly materialType: MaterialType;
    readonly status: Exclude<MaterialLineStatus, "unknown">;
    readonly nextVersion: number;
    readonly lineVersion: number;
    readonly lifecycle: "active" | "archived";
    readonly deleted?: boolean;
  };
  readonly nextVersion: number;
};

export type MaterialLifecycleCommandInput = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
};

export type MaterialOrderCommandKind = "request" | "cancel" | "complete";

export type MaterialOrderCommandInput = MaterialLifecycleCommandInput & {
  readonly reason?: string;
};

export type MobileApiErrorCode =
  | "API_ORIGIN_INVALID"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "MALFORMED_RESPONSE"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "TENANT_SCOPE_VIOLATION"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "MOBILE_CONNECT_CODE_UNAVAILABLE"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "LOCKED"
  | "INVALID_STATE_TRANSITION"
  | "REVISION_MISMATCH"
  | "DOCUMENT_NOT_READY"
  | "QUANTITY_TOTAL_MISMATCH"
  | "REPRESENTATIVE_IMAGE_REQUIRED"
  | "MATERIAL_REQUIRED"
  | "DUE_DATE_REQUIRED"
  | "PARTNER_REQUIRED"
  | "CURSOR_INVALID"
  | "LIMIT_EXCEEDED"
  | "RATE_LIMITED";

export const MOBILE_API_ERROR_CODES: ReadonlySet<string> = new Set<MobileApiErrorCode>([
  "API_ORIGIN_INVALID",
  "NETWORK_ERROR",
  "TIMEOUT",
  "MALFORMED_RESPONSE",
  "AUTH_REQUIRED",
  "FORBIDDEN",
  "TENANT_SCOPE_VIOLATION",
  "NOT_FOUND",
  "INTERNAL_ERROR",
  "MOBILE_CONNECT_CODE_UNAVAILABLE",
  "VALIDATION_ERROR",
  "CONFLICT",
  "LOCKED",
  "INVALID_STATE_TRANSITION",
  "REVISION_MISMATCH",
  "DOCUMENT_NOT_READY",
  "QUANTITY_TOTAL_MISMATCH",
  "REPRESENTATIVE_IMAGE_REQUIRED",
  "MATERIAL_REQUIRED",
  "DUE_DATE_REQUIRED",
  "PARTNER_REQUIRED",
  "CURSOR_INVALID",
  "LIMIT_EXCEEDED",
  "RATE_LIMITED",
]);

export type MobileApiErrorIdentity =
  | { readonly kind: "known"; readonly code: MobileApiErrorCode; readonly rawCode: null }
  | { readonly kind: "unknown"; readonly code: "INTERNAL_ERROR"; readonly rawCode: string };

export function classifyMobileApiErrorCode(rawCode: string): MobileApiErrorIdentity {
  return MOBILE_API_ERROR_CODES.has(rawCode)
    ? { kind: "known", code: rawCode as MobileApiErrorCode, rawCode: null }
    : { kind: "unknown", code: "INTERNAL_ERROR", rawCode };
}

export type MobileFieldError = {
  readonly field: string;
  readonly code: string;
  readonly message: string;
};

export type PatchWorkOrderBasicInfoInput = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly patch: {
    readonly productName?: string;
    readonly productTypeCode?: string | null;
    readonly seasonCode?: string | null;
    readonly itemCode?: string | null;
    readonly dueDate?: string | null;
    readonly totalQuantity?: number;
    readonly factoryDeliveryMemo?: string | null;
  };
};

export type CreateWorkOrderDraftInput = {
  readonly clientRequestId: string;
  readonly productName: string;
  readonly isSample: boolean;
};

export type CreateWorkOrderDraftResult = {
  readonly result: {
    readonly workOrderId: string;
    readonly revisionId: string;
    readonly revisionNumber: 0;
    readonly status: "draft";
    readonly revisionStatus: "draft";
    readonly displayDocumentNumber: null;
    readonly productName: string;
    readonly productTypeCode: null;
    readonly seasonCode: null;
    readonly itemCode: null;
    readonly dueDate: null;
    readonly totalQuantity: 0;
    readonly memo: null;
    readonly factoryDeliveryMemo: null;
    readonly isSample: boolean;
    readonly derivationKind: "original";
    readonly reorderRound: 0;
  };
  readonly nextVersion: number;
};

export type CreateWorkOrderReorderInput = {
  readonly clientRequestId: string;
  readonly totalQuantity: number;
  readonly dueDate: string | null;
};

export type CreateWorkOrderReorderResult = {
  readonly result: {
    readonly workOrderId: string;
    readonly revisionId: string;
    readonly revisionNumber: 0;
    readonly status: "draft";
    readonly revisionStatus: "draft";
    readonly displayDocumentNumber: null;
    readonly productName: string;
    readonly productTypeCode: string | null;
    readonly seasonCode: string | null;
    readonly itemCode: string | null;
    readonly dueDate: string | null;
    readonly totalQuantity: number;
    readonly memo: string | null;
    readonly factoryDeliveryMemo: string | null;
    readonly isSample: false;
    readonly derivationKind: "reorder";
    readonly sourceWorkOrderId: string;
    readonly sourceRevisionId: string;
    readonly seriesRootWorkOrderId: string;
    readonly reorderRound: number;
  };
  readonly nextVersion: number;
};

export type WorkOrderSeriesHistory = {
  readonly workOrderId: string;
  readonly seriesRootWorkOrderId: string;
  readonly items: readonly {
    readonly workOrderId: string;
    readonly productName: string;
    readonly status: string;
    readonly dueDate: string | null;
    readonly totalQuantity: number;
    readonly reorderRound: number;
    readonly current: boolean;
  }[];
};

export type SetWorkOrderSampleInput = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly isSample: boolean;
};

export type SetWorkOrderSampleResult = {
  readonly result: { readonly workOrderId: string; readonly isSample: boolean; readonly nextVersion: number };
  readonly nextVersion: number;
};

export type PatchWorkOrderBasicInfoResult = {
  readonly result: {
    readonly productName: string;
    readonly productTypeCode: string | null;
    readonly seasonCode: string | null;
    readonly itemCode: string | null;
    readonly dueDate: string | null;
    readonly totalQuantity: number;
    readonly memo: string | null;
    readonly factoryDeliveryMemo: string | null;
  };
  readonly nextVersion: number;
};

export class MobileApiError extends Error {
  readonly code: MobileApiErrorCode;
  readonly codeKind: MobileApiErrorIdentity["kind"];
  readonly rawCode: string | null;
  readonly status: number;
  readonly correlationId: string | null;
  readonly fieldErrors: readonly MobileFieldError[];
  readonly entityVersion: number | null;

  constructor(input: {
    readonly code: MobileApiErrorCode;
    readonly codeKind?: MobileApiErrorIdentity["kind"];
    readonly rawCode?: string | null;
    readonly message: string;
    readonly status?: number;
    readonly correlationId?: string | null;
    readonly fieldErrors?: readonly MobileFieldError[];
    readonly entityVersion?: number | null;
  }) {
    super(input.message);
    this.name = "MobileApiError";
    this.code = input.code;
    this.codeKind = input.codeKind ?? "known";
    this.rawCode = input.rawCode ?? null;
    this.status = input.status ?? 0;
    this.correlationId = input.correlationId ?? null;
    this.fieldErrors = input.fieldErrors ?? [];
    this.entityVersion = input.entityVersion ?? null;
  }
}
