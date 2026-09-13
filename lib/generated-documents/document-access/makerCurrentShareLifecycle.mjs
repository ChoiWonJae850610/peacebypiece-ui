export function resolveDocumentAccessTokenStatusAt(input, authoritativeNowMs) {
  if (input.revokedAt !== null) return "revoked";
  if (input.expiresAt !== null && Date.parse(input.expiresAt) <= authoritativeNowMs) return "expired";
  return "active";
}

export function resolveMakerCurrentShareLineage(input) {
  const baseCandidates = input.tokens.filter((token) => (
    token.tokenHash === input.baseTokenHash
    && token.rotatedFromTokenId === null
  ));
  if (baseCandidates.length > 1) return { valid: false, head: null, activeTokenId: null };

  let head = baseCandidates[0] ?? null;
  const visited = new Set();
  while (head) {
    if (visited.has(head.tokenId)) return { valid: false, head: null, activeTokenId: null };
    visited.add(head.tokenId);
    const expectedChildHash = input.deriveReplacementTokenHash(head.tokenId);
    const children = input.tokens.filter((token) => (
      token.rotatedFromTokenId === head.tokenId
      && token.tokenHash === expectedChildHash
    ));
    if (children.length > 1) return { valid: false, head: null, activeTokenId: null };
    if (children.length === 0) break;
    head = children[0];
  }

  const activeTokenId = head
    && resolveDocumentAccessTokenStatusAt(head, input.authoritativeNowMs) === "active"
    ? head.tokenId
    : null;
  return { valid: true, head, activeTokenId };
}
