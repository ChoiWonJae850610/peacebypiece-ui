declare const waflContractBrand: unique symbol;

type BrandedString<TName extends string> = string & {
  readonly [waflContractBrand]: TName;
};

type BrandedNumber<TName extends string> = number & {
  readonly [waflContractBrand]: TName;
};

export type WorkOrderId = BrandedString<"WorkOrderId">;
export type WorkOrderRevisionId = BrandedString<"WorkOrderRevisionId">;
export type CompanyId = BrandedString<"CompanyId">;
export type CompanyMemberId = BrandedString<"CompanyMemberId">;
export type PartnerId = BrandedString<"PartnerId">;
export type MaterialId = BrandedString<"MaterialId">;
export type MaterialLineId = BrandedString<"MaterialLineId">;
export type MaterialOrderId = BrandedString<"MaterialOrderId">;
export type ProcessId = BrandedString<"ProcessId">;
export type ImageId = BrandedString<"ImageId">;
export type AttachmentId = BrandedString<"AttachmentId">;
export type GeneratedDocumentId = BrandedString<"GeneratedDocumentId">;
export type SizeRowId = BrandedString<"SizeRowId">;
export type PomColumnId = BrandedString<"PomColumnId">;
export type ColorId = BrandedString<"ColorId">;
export type SizeTemplateId = BrandedString<"SizeTemplateId">;
export type ClientRequestId = BrandedString<"ClientRequestId">;
export type IdempotencyKey = BrandedString<"IdempotencyKey">;
export type CorrelationId = BrandedString<"CorrelationId">;
export type OpaqueCursor = BrandedString<"OpaqueCursor">;
export type OpaqueDocumentAccessToken = BrandedString<"OpaqueDocumentAccessToken">;
export type IsoDate = BrandedString<"IsoDate">;
export type IsoDateTime = BrandedString<"IsoDateTime">;
export type DecimalString = BrandedString<"DecimalString">;
export type CurrencyCode = BrandedString<"CurrencyCode">;
export type RevisionNumber = BrandedNumber<"RevisionNumber">;
export type EntityVersion = BrandedNumber<"EntityVersion">;

export type DisplayDocumentNumber = BrandedString<"DisplayDocumentNumber">;
export type ControlledFileUrl = BrandedString<"ControlledFileUrl">;
