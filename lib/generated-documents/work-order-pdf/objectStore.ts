import "server-only";

export type GeneratedDocumentObjectMetadata = {
  readonly key: string;
  readonly contentType: "application/pdf";
  readonly fileSizeBytes: number;
  readonly contentSha256: string;
};

export interface GeneratedDocumentObjectStore {
  putPdf(input: GeneratedDocumentObjectMetadata & { readonly body: Buffer }): Promise<GeneratedDocumentObjectMetadata>;
  headPdf(key: string): Promise<GeneratedDocumentObjectMetadata | null>;
  getPdf(key: string): Promise<Buffer | null>;
  deletePdf(key: string): Promise<void>;
}

export interface GeneratedDocumentR2Transport {
  put(input: GeneratedDocumentObjectMetadata & { readonly body: Buffer }): Promise<void>;
  head(key: string): Promise<GeneratedDocumentObjectMetadata | null>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export class R2WorkerGeneratedDocumentObjectStore implements GeneratedDocumentObjectStore {
  constructor(private readonly transport: GeneratedDocumentR2Transport) {}

  async putPdf(input: GeneratedDocumentObjectMetadata & { readonly body: Buffer }) {
    await this.transport.put(input);
    return input;
  }

  headPdf(key: string) { return this.transport.head(key); }
  getPdf(key: string) { return this.transport.get(key); }
  deletePdf(key: string) { return this.transport.delete(key); }
}
