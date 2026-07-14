export type DocumentAccessTokenStatus = "active" | "expired" | "revoked";

export type DocumentAccessTokenSummary = {
  readonly tokenId: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
  readonly rotatedFromTokenId: string | null;
  readonly lastAccessedAt: string | null;
  readonly accessCount: number;
  readonly status: DocumentAccessTokenStatus;
};

export type CreatedDocumentAccessToken = DocumentAccessTokenSummary & {
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
  readonly expiresAt: string;
  readonly accessCount: number;
  readonly storageObjectKey: string;
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
};

export type PublicDocumentViewerMetadata = {
  readonly title: "작업지시서";
  readonly displayDocumentNumber: string;
  readonly expiresAt: string;
  readonly accessCount: number;
};
