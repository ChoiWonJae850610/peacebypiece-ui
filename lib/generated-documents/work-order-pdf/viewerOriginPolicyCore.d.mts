export const TEMPORARY_EXTERNAL_QA_ONLY: "TEMPORARY_EXTERNAL_QA_ONLY";
export type PdfViewerOriginPolicyInput = {
  readonly origin: string;
  readonly runtime: "development" | "test" | "staging" | "production";
  readonly persistence: "generated-document" | "temporary-qa";
  readonly developmentOnly?: boolean;
  readonly marker?: typeof TEMPORARY_EXTERNAL_QA_ONLY;
};
export function assertPdfViewerOriginPolicy(input: PdfViewerOriginPolicyInput): string;
