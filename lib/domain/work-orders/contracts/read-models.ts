import type {
  GeneratedDocumentStatus,
  ImageAssetState,
  MaterialLineStatus,
  MaterialType,
  MeasurementUnit,
  ProcessStatus,
  WorkOrderDocumentType,
  WorkOrderRevisionStatus,
  WorkOrderStatus,
} from "@/lib/domain/work-orders/contracts/enums";
import type { CursorPage } from "@/lib/domain/work-orders/contracts/pagination";
import type {
  AttachmentId,
  ColorId,
  ControlledFileUrl,
  CurrencyCode,
  DecimalString,
  DisplayDocumentNumber,
  EntityVersion,
  GeneratedDocumentId,
  ImageId,
  IsoDate,
  IsoDateTime,
  MaterialId,
  MaterialLineId,
  PartnerId,
  PomColumnId,
  ProcessId,
  RevisionNumber,
  SizeRowId,
  SizeTemplateId,
  WorkOrderId,
  WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts/primitives";
import type { ReadinessReadModel } from "@/lib/domain/work-orders/contracts/readiness";

export type RepresentativeThumbnailReadModel = {
  readonly imageId: ImageId;
  readonly thumbnailUrl: ControlledFileUrl | null;
  readonly altText: string;
};

export type WorkOrderListMaterialSummary = {
  readonly incompleteFabricCount: number;
  readonly incompleteAccessoryCount: number;
};

export type WorkOrderListAmountSummary = {
  readonly currency: CurrencyCode;
  readonly estimatedTotal: DecimalString;
};

export type WorkOrderListItem = {
  readonly workOrderId: WorkOrderId;
  readonly displayDocumentNumber: DisplayDocumentNumber | null;
  readonly productName: string;
  readonly status: WorkOrderStatus;
  readonly dueDate: IsoDate | null;
  readonly totalQuantity: number;
  readonly estimatedAmountSummary: WorkOrderListAmountSummary;
  readonly representativeThumbnail: RepresentativeThumbnailReadModel | null;
  readonly incompleteMaterialSummary: WorkOrderListMaterialSummary;
  readonly processCount: number;
  readonly latestDocumentStatus: GeneratedDocumentStatus | null;
  readonly updatedAt: IsoDateTime;
};

export type WorkOrderListPage = CursorPage<WorkOrderListItem>;

export type WorkOrderDocumentSummary = {
  readonly latestDocumentId: GeneratedDocumentId | null;
  readonly status: GeneratedDocumentStatus | null;
  readonly displayDocumentNumber: DisplayDocumentNumber | null;
  readonly generatedAt: IsoDateTime | null;
};

export type WorkOrderDetailHeader = {
  readonly id: WorkOrderId;
  readonly productName: string;
  readonly productTypeCode: string | null;
  readonly productTypeAlias: string | null;
  readonly seasonCode: string | null;
  readonly itemCode: string | null;
  readonly dueDate: IsoDate | null;
  readonly totalQuantity: number;
  readonly status: WorkOrderStatus;
  readonly currentRevisionId: WorkOrderRevisionId;
  readonly currentRevisionNumber: RevisionNumber;
  readonly representativeImage: RepresentativeThumbnailReadModel | null;
  readonly readiness: ReadinessReadModel;
  readonly document: WorkOrderDocumentSummary;
  readonly entityVersion: EntityVersion;
  readonly updatedAt: IsoDateTime;
};

export type WorkOrderDetailCoreReadModel = {
  readonly header: WorkOrderDetailHeader;
  readonly revision: {
    readonly status: WorkOrderRevisionStatus;
    readonly finalizedAt: IsoDateTime | null;
  };
  readonly amounts: {
    readonly currency: CurrencyCode;
    readonly unitPrice: DecimalString;
    readonly fabricTotal: DecimalString;
    readonly accessoryTotal: DecimalString;
    readonly processTotal: DecimalString;
    readonly estimatedTotal: DecimalString;
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

export type ParticipatingPartnerSummary = {
  readonly partnerId: PartnerId | null;
  readonly role: "fabric_supplier" | "accessory_supplier" | "factory" | "process_partner";
  readonly displayName: string;
};

export type WorkOrderOverviewReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly participatingPartners: readonly ParticipatingPartnerSummary[];
  readonly nextChecks: readonly ReadinessIssueSummary[];
  readonly totals: {
    readonly currency: CurrencyCode;
    readonly unitPrice: DecimalString;
    readonly fabricTotal: DecimalString;
    readonly accessoryTotal: DecimalString;
    readonly processTotal: DecimalString;
    readonly estimatedTotal: DecimalString;
  };
  readonly status: WorkOrderStatus;
  readonly entityVersion: EntityVersion;
};

export type ReadinessIssueSummary = {
  readonly code: string;
  readonly message: string;
};

export type WorkOrderImageReadModel = {
  readonly id: ImageId;
  readonly optionalTitle: string | null;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly displayOrder: number;
  readonly isRepresentative: boolean;
  readonly state: ImageAssetState;
  readonly thumbnailUrl: ControlledFileUrl | null;
  readonly viewUrl: ControlledFileUrl | null;
  readonly uploadedAt: IsoDateTime;
};

export type WorkOrderAttachmentReadModel = {
  readonly id: AttachmentId;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly includeInDocument: boolean;
  readonly state: ImageAssetState;
  readonly viewUrl: ControlledFileUrl | null;
  readonly uploadedAt: IsoDateTime;
};

export type WorkOrderImagesReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly images: readonly WorkOrderImageReadModel[];
  readonly attachments: readonly WorkOrderAttachmentReadModel[];
  readonly entityVersion: EntityVersion;
};

export type WorkOrderSizeRowReadModel = {
  readonly id: SizeRowId;
  readonly code: string;
  readonly displayLabel: string;
  readonly displayOrder: number;
};

export type WorkOrderPomColumnReadModel = {
  readonly id: PomColumnId;
  readonly code: string;
  readonly displayName: string;
  readonly displayOrder: number;
};

export type WorkOrderColorReadModel = {
  readonly id: ColorId;
  readonly displayName: string;
  readonly hexValue: string | null;
  readonly displayOrder: number;
};

export type ColorSizeQuantityCellReadModel = {
  readonly colorId: ColorId;
  readonly sizeRowId: SizeRowId;
  readonly quantity: DecimalString;
};

export type SizeSpecCellReadModel = {
  readonly sizeRowId: SizeRowId;
  readonly pomColumnId: PomColumnId;
  readonly displayValue: string | null;
  readonly decimalValue: DecimalString | null;
};

export type WorkOrderSizeColorReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly genderCode: string | null;
  readonly categoryCode: string | null;
  readonly measurementUnit: MeasurementUnit;
  readonly templateId: SizeTemplateId | null;
  readonly sizes: readonly WorkOrderSizeRowReadModel[];
  readonly pomColumns: readonly WorkOrderPomColumnReadModel[];
  readonly sizeSpecCells: readonly SizeSpecCellReadModel[];
  readonly colors: readonly WorkOrderColorReadModel[];
  readonly quantityCells: readonly ColorSizeQuantityCellReadModel[];
  readonly matrixTotal: DecimalString;
  readonly expectedTotal: DecimalString;
  readonly totalsMatch: boolean;
  readonly memoFallback: string | null;
  readonly entityVersion: EntityVersion;
};

export type WorkOrderMaterialLineReadModel = {
  readonly id: MaterialLineId;
  readonly materialId: MaterialId | null;
  readonly materialType: MaterialType;
  readonly name: string;
  readonly colorOption: string | null;
  readonly partnerId: PartnerId | null;
  readonly partnerName: string | null;
  readonly requiredQuantity: DecimalString;
  readonly allowanceQuantity: DecimalString;
  readonly inventoryUsageQuantity: DecimalString;
  readonly orderQuantity: DecimalString;
  readonly unitCode: string;
  readonly currency: CurrencyCode;
  readonly unitPrice: DecimalString;
  readonly amount: DecimalString;
  readonly memo: string | null;
  readonly status: MaterialLineStatus;
  readonly displayOrder: number;
  readonly editable: boolean;
  readonly locked: boolean;
};

export type WorkOrderMaterialsReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly fabricLines: readonly WorkOrderMaterialLineReadModel[];
  readonly accessoryLines: readonly WorkOrderMaterialLineReadModel[];
  readonly entityVersion: EntityVersion;
};

export type WorkOrderMaterialPage = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly materialType: MaterialType;
  readonly items: readonly WorkOrderMaterialLineReadModel[];
  readonly nextCursor: import("@/lib/domain/work-orders/contracts/primitives").OpaqueCursor | null;
  readonly hasMore: boolean;
  readonly limit: number;
  readonly entityVersion: EntityVersion;
};

export type WorkOrderSizeColorMatrixReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly sizes: readonly WorkOrderSizeRowReadModel[];
  readonly colors: readonly WorkOrderColorReadModel[];
  readonly quantityCells: readonly ColorSizeQuantityCellReadModel[];
  readonly matrixTotal: DecimalString;
  readonly expectedTotal: DecimalString;
  readonly totalsMatch: boolean;
  readonly memoFallback: string | null;
  readonly entityVersion: EntityVersion;
};

export type WorkOrderSizeSpecReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly genderCode: string | null;
  readonly categoryCode: string | null;
  readonly measurementUnit: MeasurementUnit;
  readonly templateId: SizeTemplateId | null;
  readonly sizes: readonly WorkOrderSizeRowReadModel[];
  readonly pomColumns: readonly WorkOrderPomColumnReadModel[];
  readonly cells: readonly SizeSpecCellReadModel[];
  readonly entityVersion: EntityVersion;
};

export type WorkOrderProcessReadModel = {
  readonly id: ProcessId;
  readonly processTypeCode: string;
  readonly processName: string;
  readonly partnerId: PartnerId | null;
  readonly partnerName: string | null;
  readonly quantity: DecimalString;
  readonly dueDate: IsoDate | null;
  readonly unitCode: string;
  readonly currency: CurrencyCode;
  readonly unitPrice: DecimalString;
  readonly amount: DecimalString;
  readonly memo: string | null;
  readonly status: ProcessStatus;
  readonly displayOrder: number;
  readonly editable: boolean;
  readonly locked: boolean;
};

export type WorkOrderProcessesReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly flowSummary: readonly {
    readonly stepCode: "order" | "material" | "cutting" | "process" | "inspection" | "shipment";
    readonly status: ProcessStatus;
  }[];
  readonly processes: readonly WorkOrderProcessReadModel[];
  readonly entityVersion: EntityVersion;
};

export type WorkOrderAssetReadModel = {
  readonly assetType: "image" | "attachment";
  readonly id: ImageId | AttachmentId;
  readonly filename: string;
  readonly optionalTitle: string | null;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly displayOrder: number;
  readonly isRepresentative: boolean;
  readonly includeInDocument: boolean;
  readonly state: ImageAssetState;
  readonly viewUrl: ControlledFileUrl | null;
  readonly uploadedAt: IsoDateTime;
};

export type WorkOrderAssetPage = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly items: readonly WorkOrderAssetReadModel[];
  readonly nextCursor: import("@/lib/domain/work-orders/contracts/primitives").OpaqueCursor | null;
  readonly hasMore: boolean;
  readonly limit: number;
  readonly entityVersion: EntityVersion;
};

export type WorkOrderRevisionReadModel = {
  readonly id: WorkOrderRevisionId;
  readonly revisionNumber: RevisionNumber;
  readonly status: WorkOrderRevisionStatus;
  readonly reason: string | null;
  readonly finalizedAt: IsoDateTime | null;
};

export type GeneratedDocumentReadModel = {
  readonly id: GeneratedDocumentId;
  readonly revisionId: WorkOrderRevisionId;
  readonly documentType: WorkOrderDocumentType;
  readonly displayDocumentNumber: DisplayDocumentNumber;
  readonly status: GeneratedDocumentStatus;
  readonly rendererVersion: string;
  readonly documentSchemaVersion: number;
  readonly generatedAt: IsoDateTime | null;
  readonly revokedAt: IsoDateTime | null;
  readonly accessTokenAvailable: boolean;
  readonly previewUrl: ControlledFileUrl | null;
};

export type WorkOrderDocumentsReadModel = {
  readonly workOrderId: WorkOrderId;
  readonly currentRevisionId: WorkOrderRevisionId;
  readonly revisions: readonly WorkOrderRevisionReadModel[];
  readonly documents: readonly GeneratedDocumentReadModel[];
  readonly includeConfiguration: {
    readonly representativeImage: boolean;
    readonly sizeColor: boolean;
    readonly materials: boolean;
    readonly processes: boolean;
    readonly attachmentCount: number;
  };
  readonly previewReady: boolean;
  readonly entityVersion: EntityVersion;
};

export type WorkOrderDocumentPage = {
  readonly workOrderId: WorkOrderId;
  readonly currentRevisionId: WorkOrderRevisionId;
  readonly items: readonly GeneratedDocumentReadModel[];
  readonly nextCursor: import("@/lib/domain/work-orders/contracts/primitives").OpaqueCursor | null;
  readonly hasMore: boolean;
  readonly limit: number;
  readonly entityVersion: EntityVersion;
};

export type WorkOrderHistoryEventReadModel = {
  readonly id: string;
  readonly commandCode: string;
  readonly changeSummary: string | null;
  readonly occurredAt: IsoDateTime;
};

export type WorkOrderHistoryPage = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly items: readonly WorkOrderHistoryEventReadModel[];
  readonly nextCursor: import("@/lib/domain/work-orders/contracts/primitives").OpaqueCursor | null;
  readonly hasMore: boolean;
  readonly limit: number;
  readonly entityVersion: EntityVersion;
};
