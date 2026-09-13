import type { CurrentDocumentShareTarget, DocumentAccessTokenSummary } from "@/domain/mobileContract";

export type CurrentShareLinkActionModel = {
  readonly tokenId: string;
  readonly openUrl: string;
  readonly copyUrl: string;
  readonly nativeShareUrl: string;
  readonly generatedDocumentId: string;
};

export function resolveCurrentShareLinkActionModel(input: {
  readonly target: CurrentDocumentShareTarget | null;
  readonly tokens: readonly DocumentAccessTokenSummary[];
  readonly generatedDocumentId: string | null;
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly generationNumber: number | null;
}): CurrentShareLinkActionModel | null {
  const { target } = input;
  if (!target || !input.generatedDocumentId || input.generationNumber === null
      || target.generatedDocumentId !== input.generatedDocumentId
      || target.workOrderId !== input.workOrderId
      || target.revisionId !== input.revisionId
      || target.generationNumber !== input.generationNumber
      || !/^https:\/\//u.test(target.viewerUrl)) return null;
  const canonical = input.tokens.find((token) => token.tokenId === target.tokenId
    && token.tokenPurpose === "manual_share"
    && token.status === "active"
    && token.isMakerCurrentShare === true);
  if (!canonical) return null;
  return {
    tokenId: target.tokenId,
    openUrl: target.viewerUrl,
    copyUrl: target.viewerUrl,
    nativeShareUrl: target.viewerUrl,
    generatedDocumentId: target.generatedDocumentId,
  };
}
