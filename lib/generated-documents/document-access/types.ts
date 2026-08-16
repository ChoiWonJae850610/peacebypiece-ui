export type DocumentAccessTokenStatus = "active" | "expired" | "revoked";
export type DocumentAccessTokenPurpose = "manual_share" | "embedded_qr";

export type DocumentAccessTokenSummary = {
  readonly tokenId: string;
  readonly tokenPurpose: DocumentAccessTokenPurpose;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
  readonly rotatedFromTokenId: string | null;
  readonly lastAccessedAt: string | null;
  readonly accessCount: number;
  readonly status: DocumentAccessTokenStatus;
};

export type CreatedEmbeddedQrAccessToken = {
  readonly tokenId: string;
  readonly generatedDocumentId: string;
  readonly tokenPurpose: "embedded_qr";
  readonly rawToken: string;
  readonly tokenHash: string;
  readonly viewerUrl: string;
  readonly qrSvg: string;
  readonly expiresAt: null;
  readonly idempotentReplay: boolean;
};

export type CreatedDocumentAccessToken = Omit<DocumentAccessTokenSummary, "expiresAt"> & {
  readonly expiresAt: string;
  readonly generatedDocumentId: string;
  readonly displayDocumentNumber: string;
  readonly rawToken: string;
  readonly viewerUrl: string;
  readonly qrSvg: string;
  readonly idempotentReplay: boolean;
};

export type PublicDocumentAccessMetadata = {
  readonly tokenId: string;
  readonly companyId: string;
  readonly generatedDocumentId: string;
  readonly displayDocumentNumber: string;
  readonly documentType: string;
  readonly expiresAt: string | null;
  readonly accessCount: number;
  readonly storageObjectKey: string;
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
  readonly deliveryAttachments: readonly PublicDocumentDeliveryAttachment[];
};

export type PublicDocumentDeliveryAttachment = {
  readonly revisionAssetId: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly storageObjectKey: string;
  readonly sizeBytes: number;
  readonly contentSha256: string;
  readonly displayOrder: number;
};

export type PublicDocumentViewerMetadata = {
  readonly title: "작업지시서";
  readonly displayDocumentNumber: string;
  readonly expiresAt: string | null;
  readonly accessCount: number;
  readonly attachments: readonly {
    readonly ref: string;
    readonly filename: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly inlineSupported: boolean;
    readonly inlineUrl: string | null;
    readonly downloadUrl: string;
  }[];
};
