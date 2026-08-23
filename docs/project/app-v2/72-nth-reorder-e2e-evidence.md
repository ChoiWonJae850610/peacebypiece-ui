# Alpha.67 Nth Reorder E2E Evidence

Document type: **Immutable Evidence**

Status: `ALPHA67_NTH_REORDER_E2E_IPHONE_QA_REQUIRED`

## Accepted scope

- Issued/finalized 본생산 original and direct Reorder are the only eligible direct sources.
- The server owns direct source/revision, stable original root, and next series-wide round.
- Receipt idempotency, root locking, and the migration `019` unique index own retry/concurrency.
- Product/spec configuration is copied; Size/Color quantities and operational lifecycle state
  are reset. New total quantity and optional due date are request-owned.
- Only current representative image and explicit final-revision `output_include` attachments are
  copied to independent asset IDs/keys; filename heuristics are forbidden.
- Mobile exposes create, direct new-Overview navigation, and original-plus-direct-Reorders history.
- The new Reorder uses the existing first-issue command; Rework creation and Additional Process
  Order remain outside scope.

## Copy/reset matrix

| Domain | Alpha.67 rule |
| --- | --- |
| WorkOrder product identity and reusable revision specification | `COPY_SPEC`; new id, document identity, draft workflow state, timestamps, version, lineage, round, total, and due date |
| Size/Color definitions and ordering | `COPY_RESET_LIFECYCLE`; definitions copied and every production allocation set to `0` |
| Finished Spec rows | `COPY_SPEC`; codes and canonical stored measurement values copied without changing inch `1/8` semantics |
| Fabric/Accessory | `COPY_RESET_LIFECYCLE`; reusable definition/vendor/unit/price/manufacturing memo copied, order/archive/timestamp/event state reset |
| Production process | `COPY_RESET_LIFECYCLE` + `RECALCULATE`; reusable process/partner/unit price/memo copied, quantity projected from the new total, amount recalculated, order state reset |
| Representative image | `COPY_SPEC`; only the current representative copied to a new asset id and object key |
| Attachments | `COPY_SPEC` only for explicit final-revision `output_include` membership, with a new asset id/object key |
| Issue/revision history, generated PDF, access/share/QR tokens, execution events, cancellation/completion timestamps | `DO_NOT_COPY` |

## Runtime and concurrency proof

The retained isolated DEV/TEST family is `QA A67 N차 리오더 60CD30A2` (source short reference
`6db7529cbd98`). The runtime E2E produced direct rounds `1`, `2`, and `3`; round `3` was requested
from an earlier direct source after round `2`, proving series-wide allocation. A repeated identical
request returned the same WorkOrder, while two distinct concurrent requests received different
rounds. Sample, never-issued draft, Rework, and cancelled sources each returned the canonical
eligibility conflict. The original plus rounds `1..3` read model was ordered correctly, list filtering
returned exactly three Reorders, copied asset references were independent, and the third Reorder
issued its own first document successfully. Eight isolated rows are retained for physical QA;
production and owner-fixture mutations remain zero.

The canonical R2 Worker signed transport performs the physical object copies. Direct S3 transport
was rejected after a DEV/TEST TLS transport failure; no filename heuristic or metadata-only alias was
substituted. The cumulative current-maker issue guard now resolves the configured supported approval
and `document-r0` capability, so alpha.67 can issue the new Reorder without weakening production or
legacy guards.

Canonical Verify completed `162/162 PASS`, `FAIL 0`, `SKIP 0` under Windows Node `24.14.0`; changed
fingerprint: `052bbee65b512f1a059b1c5dd780f4f1e683957e4a1b9449fb5b44b5da45d0f2`.

## Safety boundary

APP_VERSION remains `2.0.0-alpha.66`. DEV/TEST ledger remains `20/20`; migration `021`,
production mutation, owner-fixture mutation, version bump, commit, push, and release are zero.
The permanent inventory increases from `161` to `162`. Automated checks do not infer owner
physical-iPhone acceptance.
