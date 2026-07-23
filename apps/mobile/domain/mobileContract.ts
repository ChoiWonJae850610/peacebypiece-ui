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
    readonly readiness: {
      readonly canIssue: boolean;
      readonly hardBlockers: readonly { readonly code: string; readonly message: string }[];
      readonly warnings: readonly { readonly code: string; readonly message: string }[];
    };
    readonly document: {
      readonly status: string | null;
      readonly displayDocumentNumber: string | null;
      readonly generatedAt: string | null;
    };
    readonly entityVersion: number;
    readonly updatedAt: string;
  };
  readonly revision: { readonly status: string; readonly finalizedAt: string | null };
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

export type MaterialLineStatus = "editing" | "requested" | "completed" | "cancelled" | "unknown";

export type WorkOrderMaterialLine = {
  readonly id: string;
  readonly materialType: "fabric";
  readonly name: string;
  readonly colorOption: string | null;
  readonly usageArea: string | null;
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
  readonly lifecycle: "active" | "archived";
  readonly archivedAt: string | null;
};

export type WorkOrderMaterialPage = {
  readonly workOrderId: string;
  readonly materialType: "fabric";
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
  readonly requiredQuantity: string;
  readonly allowanceQuantity: string;
  readonly inventoryUsageQuantity: string;
  readonly orderQuantity: string;
  readonly unitCode: string;
  readonly unitPrice: string;
  readonly memo: string;
};

export type CreateMaterialLineInput = MaterialDraftFields & {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly materialType: "fabric";
};

export type PatchMaterialLineInput = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
  readonly patch: Partial<Omit<MaterialDraftFields, "orderQuantity">>;
};

export type MaterialLineCommandResult = {
  readonly result: {
    readonly workOrderId: string;
    readonly materialLineId: string;
    readonly materialType: "fabric";
    readonly status: Exclude<MaterialLineStatus, "unknown">;
    readonly nextVersion: number;
    readonly lineVersion: number;
    readonly lifecycle: "active" | "archived";
  };
  readonly nextVersion: number;
};

export type MaterialLifecycleCommandInput = {
  readonly clientRequestId: string;
  readonly expectedVersion: number;
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
    readonly dueDate?: string | null;
    readonly totalQuantity?: number;
  };
};

export type PatchWorkOrderBasicInfoResult = {
  readonly result: {
    readonly productName: string;
    readonly dueDate: string | null;
    readonly totalQuantity: number;
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
