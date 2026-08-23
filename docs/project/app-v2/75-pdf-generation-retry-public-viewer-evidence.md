# Alpha.67 PDF Generation Retry / Public Viewer Evidence

Document type: **Immutable Evidence**

Checkpoint: `ALPHA67_PDF_GENERATION_RETRY_PUBLIC_VIEWER_IPHONE_REQA_REQUIRED`

## Scope

This checkpoint remediates the remaining mobile PDF generation/retry and Safari viewer blockers.
It does not redesign Nth Reorder copy/reset/history, issue numbering, material lifecycle, or the
public viewer security model.

## Root cause

The mobile transport applied its generic 15-second deadline to the synchronous PDF render, R2 put,
R2 head/get integrity check, and DB finalize path. A physical request that crossed that deadline
aborted client-side while the server could still be pending or complete. The workbench then
collapsed the outcome into failure, and a later new-key retry encountered an already-generated or
still-pending identity without a canonical reconciliation path. Direct server smoke did not use
the mobile deadline and therefore did not reproduce this parity boundary.

Separately, the generated-document read model exposes `inlineUrl`/`downloadUrl` for authenticated
workspace use. Mobile `보기` passed that internal URL directly to Safari, where the React Native
workspace cookie is absent; the correct `API_SESSION_REQUIRED` response was therefore rendered as
JSON. The failure was route ownership, not a reason to weaken workspace authentication.

## Remediation

- The mobile generate client uses a bounded 120-second document deadline and reconciles generated,
  pending, timeout, and failed status through the canonical document list.
- Under the generation-scope lock, a current generated or recent pending row is linked to the new
  receipt and returned. Generation-only retry does not issue, finalize a revision, or create a
  duplicate document.
- An authenticated viewer-target read reconstructs and hash-verifies the already persisted
  embedded-QR access identity, then returns the canonical `/v` URL. It creates no manual-share
  token and exposes no storage key.
- Safari exchanges the fragment token for the existing public viewer session and reads the PDF
  through public file/download routes. The internal file route remains workspace-session guarded.

## Automated evidence

- Windows Node `24.14.0` runtime used the same mobile method/path/payload/idempotency/session shape.
- Initial issued-Reorder PDF generation, R2-backed generated-document read, and status
  reconciliation passed.
- A distinct-key retry returned the same generated document, with revision/issue replay zero and
  duplicate generated-document zero.
- `/v` page, public session, PDF file, and download succeeded without a workspace session.
- The internal file route without a workspace session remained HTTP 401 `API_SESSION_REQUIRED`.
- Canonical Verify inventory: `165/165`, FAIL `0`, SKIP `0`.
- Migration ledger: `20/20`; migration `021`: absent.
- Production/owner-fixture mutation: `0/0`.

## Physical boundary

Owner-observed Reorder spec copy, zero-initialized Size/Color quantities, Work History, and source
immutability remain preserved partial physical PASS. This checkpoint does not infer the repaired
generation/viewer experience or full alpha.67 acceptance.

`PHYSICAL_RESULT_NOT_INFERRED`
