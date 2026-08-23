# 77. Alpha.67 Viewer, Share, and Clean-base evidence

Status: current alpha.67 implementation evidence. This document does not infer Owner physical PASS.

## Root cause and bounded remediation

The external-QA proxy admitted `/v` and its public session/file routes but the Tailscale Serve
allowlist omitted the `/_next` assets referenced by the HTML shell. Safari therefore displayed
server-rendered loading copy while the client component could not hydrate. The same allowlist now
admits GET/HEAD only for the exact `/_next` namespace; unrelated application routes remain denied.
The client also owns a 15-second abort boundary, secure invalid/expired/revoked wording, and a
network retry state so loading is never terminal.

Mobile native share previously supplied the same URL in both `message` and `url`, which can produce
duplicate handoff semantics across iOS/Kakao share targets. The canonical builder now emits one
message with product, quantity, due date, and one viewer URL. Managed-link presentation also exposes
created/expiry/access-count/last-access/status metadata without raw token disclosure.

## PDF design comparison

The preserved mock/confirmed document references and the current generated PDF use the same
document hierarchy: identity header, product/quantity information, size/spec tables, material and
process content, and controlled document access. The current PDF is inspected as the live artifact;
older mock/confirmed screens are comparison evidence only. No major PDF layout redesign is part of
this checkpoint.

The retained isolated QA PDF used for this comparison is a two-page document: one landscape cover
with product sketch, document identity, QR, quantity/category/color, and memo; followed by one
portrait continuation with fabric, accessory, and color-size quantity tables. Poppler rendering at
110 DPI showed legible Korean text, aligned table borders, intact QR, page numbering, and no clipped
or overlapping content. This matches the confirmed information hierarchy in the preserved PDF/share
spec and current issued-document component; the QA gradient image remains fixture content rather
than a document-style change.

## Reset safety model

The owner-authorized reset is DEV/TEST only. It requires a logical DB backup and verified KEEP,
DELETE, and R2 DELETE manifests before execution. The live schema contains no WAFL-provided/system
WorkOrder discriminator; target-company WorkOrders are authored business graphs, while shared
catalog/template/reference/configuration tables are independent KEEP owners. The reset therefore
deletes the target-company WorkOrder graphs only. It preserves document-number sequences, shared
catalog/template/reference/configuration, other companies, unrelated data, and all ambiguous or
unproven R2 metadata. Only canonical `companies/{company}/workorders/{id}/...` objects with a target
ID, no outside reference, and successful read/hash preflight may enter the R2 delete manifest.

Final execution evidence records exact counts and hashes without publishing raw tokens, credentials,
private object keys, or database URLs. `PHYSICAL_RESULT_NOT_INFERRED`.
