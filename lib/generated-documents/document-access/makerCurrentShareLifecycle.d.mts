export type MakerCurrentShareLifecycleToken = {
  readonly tokenId: string;
  readonly tokenHash: string;
  readonly rotatedFromTokenId: string | null;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
};

export declare function resolveDocumentAccessTokenStatusAt(
  input: Pick<MakerCurrentShareLifecycleToken, "expiresAt" | "revokedAt">,
  authoritativeNowMs: number,
): "active" | "expired" | "revoked";

export declare function resolveMakerCurrentShareLineage(input: {
  readonly tokens: readonly MakerCurrentShareLifecycleToken[];
  readonly baseTokenHash: string;
  readonly authoritativeNowMs: number;
  readonly deriveReplacementTokenHash: (predecessorTokenId: string) => string;
}): {
  readonly valid: boolean;
  readonly head: MakerCurrentShareLifecycleToken | null;
  readonly activeTokenId: string | null;
};
