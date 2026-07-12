import type { MaterialType, MeasurementUnit, WorkOrderDocumentType } from "@/lib/domain/work-orders/contracts/enums";
import type {
  AttachmentId,
  ClientRequestId,
  ColorId,
  DecimalString,
  EntityVersion,
  GeneratedDocumentId,
  IdempotencyKey,
  ImageId,
  IsoDate,
  MaterialId,
  MaterialLineId,
  MaterialOrderId,
  PartnerId,
  PomColumnId,
  ProcessId,
  RevisionNumber,
  SizeRowId,
  SizeTemplateId,
  WorkOrderId,
  WorkOrderRevisionId,
} from "@/lib/domain/work-orders/contracts/primitives";

export const COLOR_SIZE_CELL_BATCH_MAX = 250;
export const REORDER_ITEM_BATCH_MAX = 100;

export type CommandRequest = {
  readonly clientRequestId: ClientRequestId;
};

export type VersionedWorkOrderCommand = CommandRequest & {
  readonly workOrderId: WorkOrderId;
  readonly expectedVersion: EntityVersion;
};

export type IdempotentWorkOrderCommand = VersionedWorkOrderCommand & {
  readonly idempotencyKey: IdempotencyKey;
};

export type CreateWorkOrderDraftCommand = CommandRequest & {
  readonly idempotencyKey: IdempotencyKey;
  readonly productName: string;
  readonly productTypeCode?: string | null;
  readonly seasonCode?: string | null;
  readonly itemCode?: string | null;
  readonly dueDate?: IsoDate | null;
  readonly totalQuantity?: number | null;
  readonly memo?: string | null;
};

export type PatchWorkOrderBasicInfoCommand = VersionedWorkOrderCommand & {
  readonly patch: {
    readonly productName?: string;
    readonly productTypeCode?: string | null;
    readonly seasonCode?: string | null;
    readonly itemCode?: string | null;
    readonly dueDate?: IsoDate | null;
    readonly totalQuantity?: number | null;
    readonly memo?: string | null;
  };
};

export type WorkOrderDraftCommandResult = {
  readonly workOrderId: WorkOrderId;
  readonly revisionId: WorkOrderRevisionId;
  readonly revisionNumber: RevisionNumber;
  readonly status: "draft";
  readonly revisionStatus: "draft";
  readonly displayDocumentNumber: null;
  readonly productName: string;
  readonly productTypeCode: string | null;
  readonly seasonCode: string | null;
  readonly itemCode: string | null;
  readonly dueDate: IsoDate | null;
  readonly totalQuantity: number;
  readonly memo: string | null;
};

export type AddWorkOrderImageCommand = VersionedWorkOrderCommand & {
  readonly imageId: ImageId;
  readonly optionalTitle?: string | null;
};

export type ReorderWorkOrderImagesCommand = VersionedWorkOrderCommand & {
  readonly orderedImageIds: readonly ImageId[];
};

export type SetRepresentativeImageCommand = VersionedWorkOrderCommand & {
  readonly imageId: ImageId;
};

export type RemoveWorkOrderImageCommand = VersionedWorkOrderCommand & {
  readonly imageId: ImageId;
};

export type UpdateImageOptionalTitleCommand = VersionedWorkOrderCommand & {
  readonly imageId: ImageId;
  readonly optionalTitle: string | null;
};

export type ToggleAttachmentPdfIncludeCommand = VersionedWorkOrderCommand & {
  readonly attachmentId: AttachmentId;
  readonly includeInDocument: boolean;
};

export type AddMaterialLineCommand = VersionedWorkOrderCommand & {
  readonly materialType: MaterialType;
  readonly materialId?: MaterialId | null;
  readonly name: string;
  readonly partnerId?: PartnerId | null;
  readonly colorOption?: string | null;
  readonly unitCode: string;
};

export type MaterialLinePatch = {
  readonly name?: string;
  readonly materialId?: MaterialId | null;
  readonly partnerId?: PartnerId | null;
  readonly colorOption?: string | null;
  readonly requiredQuantity?: DecimalString;
  readonly allowanceQuantity?: DecimalString;
  readonly inventoryUsageQuantity?: DecimalString;
  readonly orderQuantity?: DecimalString;
  readonly unitCode?: string;
  readonly unitPrice?: DecimalString;
  readonly memo?: string | null;
};

export type PatchMaterialLineCommand = VersionedWorkOrderCommand & {
  readonly materialLineId: MaterialLineId;
  readonly patch: MaterialLinePatch;
};

export type ReorderMaterialLinesCommand = VersionedWorkOrderCommand & {
  readonly materialType: MaterialType;
  readonly orderedMaterialLineIds: readonly MaterialLineId[];
};

export type RemoveMaterialLineCommand = VersionedWorkOrderCommand & {
  readonly materialLineId: MaterialLineId;
};

export type RequestMaterialOrderCommand = IdempotentWorkOrderCommand & {
  readonly materialLineIds: readonly MaterialLineId[];
};

export type CancelMaterialOrderRequestCommand = VersionedWorkOrderCommand & {
  readonly materialLineId: MaterialLineId;
  readonly reason: string;
};

export type CompleteMaterialOrderCommand = IdempotentWorkOrderCommand & {
  readonly materialOrderId: MaterialOrderId;
  readonly materialLineIds: readonly MaterialLineId[];
};

export type PatchSizeSpecCellCommand = VersionedWorkOrderCommand & {
  readonly sizeRowId: SizeRowId;
  readonly pomColumnId: PomColumnId;
  readonly measurementUnit: MeasurementUnit;
  readonly displayValue: string | null;
  readonly decimalValue: DecimalString | null;
};

export type AddSizeRowCommand = VersionedWorkOrderCommand & {
  readonly sizeCode: string;
  readonly displayLabel: string;
};

export type AddPomColumnCommand = VersionedWorkOrderCommand & {
  readonly pomCode: string;
  readonly displayName: string;
};

export type RemoveSizeRowCommand = VersionedWorkOrderCommand & {
  readonly sizeRowId: SizeRowId;
};

export type RemovePomColumnCommand = VersionedWorkOrderCommand & {
  readonly pomColumnId: PomColumnId;
};

export type UpsertColorCommand = VersionedWorkOrderCommand & {
  readonly colorId?: ColorId;
  readonly displayName: string;
  readonly hexValue?: string | null;
};

export type ColorSizeQuantityCellInput = {
  readonly colorId: ColorId;
  readonly sizeRowId: SizeRowId;
  readonly quantity: DecimalString;
};

export type UpsertColorSizeQuantityCellsCommand = VersionedWorkOrderCommand & {
  readonly cells: readonly ColorSizeQuantityCellInput[];
};

export type SaveSizeTemplateCommand = VersionedWorkOrderCommand & {
  readonly templateName: string;
  readonly categoryCode: string;
};

export type LoadSizeTemplateCommand = VersionedWorkOrderCommand & {
  readonly templateId: SizeTemplateId;
};

export type AddProcessCommand = VersionedWorkOrderCommand & {
  readonly processTypeCode: string;
  readonly processName: string;
  readonly partnerId?: PartnerId | null;
};

export type ProcessPatch = {
  readonly processName?: string;
  readonly partnerId?: PartnerId | null;
  readonly quantity?: DecimalString;
  readonly dueDate?: IsoDate | null;
  readonly unitCode?: string;
  readonly unitPrice?: DecimalString;
  readonly memo?: string | null;
};

export type PatchProcessCommand = VersionedWorkOrderCommand & {
  readonly processId: ProcessId;
  readonly patch: ProcessPatch;
};

export type ReorderProcessesCommand = VersionedWorkOrderCommand & {
  readonly orderedProcessIds: readonly ProcessId[];
};

export type CompleteProcessCommand = IdempotentWorkOrderCommand & {
  readonly processId: ProcessId;
};

export type CreateRevisionDraftCommand = VersionedWorkOrderCommand & {
  readonly sourceRevisionId: WorkOrderRevisionId;
  readonly correctionReason: string;
};

export type IssueWorkOrderCommand = IdempotentWorkOrderCommand & {
  readonly revisionId: WorkOrderRevisionId;
  readonly requestedDocumentTypes: readonly WorkOrderDocumentType[];
};

export type CancelDraftRevisionCommand = VersionedWorkOrderCommand & {
  readonly revisionId: WorkOrderRevisionId;
  readonly reason: string;
};

export type RevokeGeneratedDocumentCommand = IdempotentWorkOrderCommand & {
  readonly generatedDocumentId: GeneratedDocumentId;
  readonly reason: string;
};

export type CommandAccepted<TResult> = {
  readonly result: TResult;
  readonly nextVersion: EntityVersion;
};
