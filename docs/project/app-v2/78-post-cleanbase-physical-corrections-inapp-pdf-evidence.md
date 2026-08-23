# 78. Alpha.67 post-clean-base physical corrections and in-app PDF evidence

Status: native in-app-viewer implementation and Development Build continuation evidence. Owner
physical PASS is not inferred.

## Implemented bounded corrections

- Image upload completion uses a 90-second derivative-aware command boundary. Timeout/network
  ambiguity polls the existing receipt and deterministic image identity with the same idempotency
  key. It does not replay the completion pipeline and refreshes image projections as soon as the
  existing completion is confirmed.
- Size/Color deletion recomputes the visible matrix total and every total projection. The existing
  server transaction owns allocation-cell deletion, canonical WorkOrder/revision total updates, and
  Finished Spec Size/value synchronization.
- Readiness and issue share Basic Process count/status facts. Missing and not-yet-requested rows emit
  exact stable blockers and route to 제작. Issue atomically completes only the requested Basic Process,
  finalizes the revision, marks the WorkOrder issued, and records a receipt-guarded completion event.
- Fabric and Accessory share hard `사용부위 30` and `메모 100` limits plus the Basic Process counter
  presentation. Server validation uses the same constants and never truncates.
- Current Basic Process memo is factory-delivery memo truth; the legacy revision field is fallback
  only. Detail, issue snapshot, preview, and PDF use the resolver. Additional memos remain row-local.
- PDF cover classification decodes structured category identity into human-readable labels such as
  `남성 · 상의 · 티셔츠`; internal `wafl-*` tuples are not used when labels resolve.

## Native authenticated viewer continuation

The live audit resolves Expo SDK 55 / React Native 0.83 to one PDF renderer owner:
`react-native-pdf 7.0.4`, its required transport peer `react-native-blob-util 0.24.7`, and the matching
SDK-55 CNG adapters at `13.0.0`. No WebView, second file-system library, or second PDF engine is
installed. The renderer consumes a temporary local file downloaded from the existing workspace-
authenticated internal document route. Transport requires HTTP 200 plus `application/pdf` and a
non-empty file, preserves the workspace cookie boundary, exposes neither R2 nor a secret-bearing
URL, and cleans the cache on close/retry.

The viewer is full-screen inside WAFL with safe-area back navigation, vertical page scrolling,
page indicator, pinch/double-tap zoom, and a bounded retry state. Public `/v` remains share-only and
Save remains actual download. The matching iOS Development Build must still be provisioned,
installed by the owner if EAS cannot install it remotely, and connected to the strict physical-QA
runtime before the success checkpoint. Permanent contract inventory becomes `169`; migration ledger
remains `20/20`; migration `021`, production mutation, and owner-fixture mutation remain zero.
`PHYSICAL_RESULT_NOT_INFERRED`.
