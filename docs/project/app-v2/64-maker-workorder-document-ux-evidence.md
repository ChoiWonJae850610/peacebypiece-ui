# Alpha.64 Maker WorkOrder and Document UX Evidence

Document type: **Immutable Evidence**

Status: `ALPHA64_FINALIZATION_COMPLETE`

Result version: `2.0.0-alpha.64`

## Accepted result

Alpha.64 finalizes the cumulative Maker mobile release candidate on the alpha.63 architecture.
It preserves one `alpha64-current-maker` capability profile across Overview, image/attachment,
Size/Color, Finished Spec and saved specs, typed Fabric/Accessory authoring, Production read
baseline, and the Maker R0 document workbench. The same profile is owned by the internal guard
and external QA gate.

The accepted mobile architecture uses Design System v2 and one canonical shared input/sheet
stack. It includes continuous free-settle sheet drag, generation-safe open/close/reopen and
nested handoff, one continuous entrance, body-owned focus reveal, adaptive reel/form sizing,
real sibling footers, typed field/numeric semantics, and the canonical inline owner. The visible
Maker rail is `개요 / 이미지·첨부 / 사이즈·색상 / 원부자재 / 제작 / 문서`.

Finished Spec supports category-aware WAFL/company items, direct reusable creation, saved-spec
save/update/apply, cm and exact 1/8-inch display/input, and zero-row draft bootstrap through the
existing one-batch POM command. WorkOrder Size remains the finished-spec Size source of truth.
The accepted table geometry is a stable `82×44` cell with a centered `60×34` editable value
surface, `11/11` horizontal breathing room, a `5`-point bottom-grid gap, one hairline, and zero
focus geometry shift. The owner physically accepted Finished Spec cm and Size/Color quantity
underlines before finalization.

The document boundary uses immutable Revision snapshots, immediate R0 PDF generation, R2,
controlled Viewer delivery, selected attachment output, manual share sessions, and revocable
managed QR access. Quick Delivery remains a session-local real-data UI foundation; Juso address
search stays in-app through the authenticated server-only proxy. Quick persistence, R1,
Factory/AI expansion, and successful-document regeneration/deletion remain deferred.

## Safety and verification boundary

- Owner physical-iPhone final QA: `PASS`.
- Canonical Verify: Node `24.14.0`, full permanent inventory, failure `0`, skip `0`.
- Migration ledger: `18/18`; migration `019`: `0`.
- Production mutation: `0`.
- Owner-fixture mutation: `0`; read-only audit only.
- Dependency/native/EAS expansion: `0`.
- Force push/history rewrite: `0`.
- Final commit, pushed HEAD, release ZIP, and repo-state facts are owned by the matching
  post-push `repo-state-2.0.0-alpha.64-*` record because a source file cannot contain the hash
  of the commit that contains itself.

## Deferred category-change policy

Changing or clearing a WorkOrder major category must never automatically delete existing
Finished Spec rows or measurement values and must never silently remap them. The category only
changes future recommendation/default-catalog scope. The informational warning
`대분류가 변경되었습니다. 기존 완성 스펙 항목과 치수를 확인해주세요.` is
`DEFERRED / POST-alpha.64`; it is not a destructive confirmation gate and cannot reset data.

The next implementation boundary is the `제작` tab. Sketch/drawing API integration follows it
under a separately approved Delta.
