# 2.0.0-alpha.61 Mobile WorkOrder Create and DeveloperAutoConnect Evidence

Status: `ALPHA61_FINALIZATION_COMPLETE`

## Result and boundary

- Result version: `2.0.0-alpha.61`.
- Alpha.61 entered from synchronized alpha.60 HEAD/origin `67f4f49884666429ca29c7b0571f907c168b5f8b`.
- Completed scope: bounded mobile creation of an editable WorkOrder draft, immediate size/color/quantity editing through existing command boundaries, and the alpha.47 DeveloperAutoConnect transport correction.
- Exclusions: schema/migration, dependency or native/EAS changes, production/R2/PDF/token mutation, user-business-data mutation, a second automated product Runtime, and unrelated archive/restore redesign.

## Product and architecture

- The mobile create sheet uses the existing WorkOrder command boundary, typed validation/policy owner, list controller, and API client. It does not duplicate create semantics in screen-local code.
- Draft creation retains company/member/permission, editable-revision, expected-version, idempotency, Event, and Receipt guards. The created draft accepts the existing size, color, and quantity commands.
- Targeted contracts passed for alpha.61 creation, alpha.59 size/color/quantity regression, alpha.25 command API compatibility, alpha.46 runtime boundary, and alpha.53 architecture boundary.

## DeveloperAutoConnect

- The canonical alpha.47 WAFL-owned flow remains mobile boot authentication followed by `mobileSessionController.autoConnect()` and the guarded development auto-connect endpoint.
- External runtime startup dynamically resolves the current Tailscale IPv4 and supplies it to Metro advertisement, the iOS manifest launch URL, and the development-client redirect. No Tailscale address is hardcoded.
- A Windows LAN IPv4 Metro advertisement is a READY failure. Runtime readiness requires the current Tailscale host for Metro advertisement, iOS manifest launch, and the WAFL-owned Development Client launch path; live listeners alone are insufficient.
- Canonical contracts for the advertised host and the permanent `WAFL 런타임 해줘` / `WAFL 런타임 준비` shorthand passed.
- Owner physical iPhone verification passed after completely closing and reopening the Development Build: without manual URL input it entered WAFL automatically, and no `192.168.*:8081` address was selected. Product QA and this auto-connect QA were not rerun during finalization.

## Exact QA cleanup

- One exact dev/test fixture named `QA A61 신규 작업지시서` in the approved QA company was read and verified as one draft WorkOrder/revision with `L`, `네이비`, and a single quantity cell of `100`; generated documents and tokens were zero.
- One bounded transaction removed exactly its quantity cell, size, color, revision, and WorkOrder. No material rows existed in its accepted final state.
- Mutable residual after cleanup was zero. All four matching Event rows and four Receipt rows were preserved; every Receipt reference was detached by the canonical composite identity `company_id + command_code + idempotency_key`.
- The cleanup did not touch user WorkOrders, master data, migrations, R2, PDFs, tokens, or production.

## Final verification and delivery

- The final fingerprint passed bundled Node 24 Canonical Verify, root/mobile TypeScript, changed-file lint, Expo public config, Next production build, document/Unicode/PowerShell checks, mutation audit, and `git diff --check`.
- Root package metadata remains unchanged. Mobile package/version surfaces and `APP_VERSION` are synchronized to `2.0.0-alpha.61`.
- This immutable evidence intentionally excludes its containing commit hash and final artifact hashes; the post-push repo-state and final Result own those identities.

## Later boundary

Alpha.62 is routing metadata only for finished-measurement editing with explicit cm/inch persistence and a system size/POM snapshot connection. It is not started or authorized by alpha.61 completion.
