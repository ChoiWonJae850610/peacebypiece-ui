# WAFL v2 Mobile Architecture Foundation Evidence

## Result and boundary

- Work started at `2026-07-23 08:13 KST` from synchronized, clean `master` at baseline `2.0.0-alpha.52`, HEAD/origin `509998e13dfb40fbfa99b201de7031074b5203a4`.
- Result version: `2.0.0-alpha.53` after all remaining delivery gates pass.
- Current checkpoint: `ALPHA53_FINAL_CANONICAL_VERIFY_STALE_VERSION_ASSERTION_REMEDIATED_VERIFY_PENDING`.
- Scope is behavior-preserving mobile architecture, contracts, validation, policy, formatting, theme, and behavior-test foundation. Business data, API meaning, schema/migration, R2/PDF/token, production, native/EAS, material order lifecycle, and UI redesign remain excluded.

## Architecture audit and dependency direction

- Before extraction, `MobileWorkOrderApp.tsx` was `1,508` lines and directly owned session initialization/recovery, list/detail/material queries, navigation selection, overview/material/lifecycle mutation orchestration, draft validation, API error interpretation, editability checks, material cache/request identity, and screen composition.
- The composition entry is now `5` lines and renders `MobileWorkOrderExperience`. Feature views live under `features/work-orders/list`, `features/work-orders/overview`, and `features/materials`.
- Application boundaries own explicit mutation gating, session gateway, navigation/lifecycle state, and query state. Work-order query and mutation gateways separate read and Command infrastructure. Material cache, business validation, editability policy, mobile-safe DTO/error contract, display formatting, and WAFL theme tokens have explicit owners.
- Dependency direction is composition shell -> feature UI -> application controller/hook -> domain policy/contract/validation -> API infrastructure. Domain modules import no React Native, Next, PostgreSQL, Node filesystem, environment, R2, or PDF implementation.
- `MobileApiErrorCode | string` was replaced by a known-code union plus explicit unknown classification and separately retained raw code. Customer presentation and raw diagnostics remain separate.
- The central experience coordinator remains intentionally bounded to cross-feature composition and dirty-guard coordination; alpha.54 reel adapters and later material-order commands have policy/controller extension points without adding direct API calls to the composition shell.
- No dependency, package/lockfile, navigation framework, state/query framework, native plugin, or EAS change was introduced. Reel Picker production implementation is deferred to alpha.54.

## Validation, policy, formatter, and tests

- Business validation and canonical patch construction moved to pure domain helpers. Temporary empty/`0.` numeric drafts and focus state remain mobile UI concerns.
- Work-order, overview-field, active material, archived/locked material, read-only calculated field, and lifecycle-action rules use pure policy functions instead of repeated status strings.
- Number, decimal, quantity/unit, Korean won, due-date, trailing-zero, order-quantity, and material-amount display/calculation behavior is owned by the mobile display boundary. Formulae remain `max(required + allowance - inventory, 0)` and canonical order quantity multiplied by unit price.
- Four alpha.53 contracts characterize alpha.52 behavior, application reducers/controllers, policy, known/unknown errors, dependency direction, forbidden server imports, feature boundaries, theme ownership, and permanent PC-resource audit rules.
- Historical alpha.44-alpha.52 source-path assertions were routed to the extracted owner modules without deleting their behavior/security meaning. Deterministic formatter, validation, date-state, navigation, session, query-state, explicit mutation, duplicate-submit, and request-count behavior now runs as pure tests.
- The first post-device Final Canonical Verify reached all build and audit stages but failed because `19` current-version assertions across `10` historical alpha.44-alpha.51 contracts still fixed `2.0.0-alpha.52`. This was a test-maintenance defect, not a product, Runtime, data, or QA regression.
- Those contracts now use one bounded helper that reads canonical `APP_VERSION` and requires the mobile constant, mobile package/lock, Expo appVersion, Current Baseline, and roadmap current-result version to agree. The alpha.51 next-candidate assertion is derived from that canonical alpha. All `10` affected contracts passed together (`10 passed / 0 failed`); the historical `2.0.0-alpha.52-dev-test-mobile-core-inline-runtime` approval string remains unchanged.

## Static and automated Runtime verification

- Targeted ESLint, root/mobile TypeScript, alpha.44-alpha.53 relevant contracts, Next production build, Expo public config, and Expo dependency check passed under process-local Node `v24.14.0`.
- Pre-device canonical Verify passed at `2026-07-23 08:39 KST` with ChangedFingerprint `5a2ece26cbe5f3e0943c8302391deb0609c2a14f8e0e586211ccf8f4ccd20206`.
- Mutation audit scanned `1,356` source files and reported `203` findings / high-risk `0`. Migration and package/lockfile guards passed.
- The canonical read-only DeveloperAutoConnect runner started once. Four runner roles passed exact marker/start-time ownership, Next listened only on `3100`, Metro on `8081`, port `3000` remained unused, exact Serve targeted localhost Next, Funnel remained disabled, and Tailscale/Chrome Remote Desktop remained Running.
- Bounded Runtime preflight passed auth/Company context, list/detail, active/archived material GET, manifest `200`, and one complete JavaScript bundle `200` without redirects. Command API was blocked; successful PATCH/DELETE/archive/restore/order requests were `0`.
- Runtime preflight before/after state stayed WorkOrder/revision/material `34/34/14`, event/receipt `67/26`, due date `2026-07-30`, total quantity `10`, and migration ledger `13/13`. Business, document/token, production, schema, R2/PDF, native, and EAS deltas were `0`.

## Mandatory PC resource and remote-operation audit

- Permanent Rules gained `3A. Mandatory PC Resource and Remote-Operation Audit` in `09-codex-working-rules.md`. It applies to subsequent WAFL work until the owner changes it and preserves all existing Runtime, ownership, security, failure, and remote-service rules.
- The rule was approved after alpha.53 start and Runtime start, so detailed resource values for those earlier checkpoints are `NOT_RUN` rather than reconstructed. The `2026-07-23 09:06:26 KST` audit is the first governed measurement and serves both post-automated-Runtime and immediate pre-device-QA checkpoints.
- Total CPU samples were `19.0%`, `13.0%`, and `14.0%`; average `15.3%`, range `13.0-19.0%` across `12` logical processors. The initial top normalized consumer was `svchost` at `12.2%` and fell to `2.3%` then below the final top-five threshold, so no sustained unexplained high-CPU process was found.
- Physical memory was `31.12 GB` total, `11.42 GB` used (`36.7%`), and `19.70 GB` available.
- System and repository both use `C:`: `1,906.8 GB` total, `1,197.4 GB` free (`62.8%`). Disk active time samples were `0/0/0%`, queue `0/0/0`, and throughput `0.00-0.53 MB/s`; abnormal I/O was `0`.
- Runner resources: cloudflared PID `29732`, average CPU `0.00%`, working/private memory `38.1/64.8 MB`; Next PID `44908`, `0.00%`, `199.7/221.9 MB`; Tailscale Serve PID `19896`, `0.00%`, `15.7/50.3 MB`; Expo/Metro PID `27792`, `0.07%`, `679.0/749.8 MB`. All four were `ownership-candidate/start-time-match`.
- Unowned WAFL-like process count was `0`; ports `3000/3100/8081` were `0/1/1` with the two listeners owned by Next and Expo. Exact Serve configuration passed. Funnel parsed successfully, enabled was false, and `AllowFunnel: true` count was `0`.
- Tailscale and Chrome Remote Desktop were Running/Automatic. `Temperature: unavailable with approved read-only tooling`; no driver, utility, service, or dependency was installed.
- Abnormal finding count: `0`. Remote-operation risk: `0`. Unrelated-process impact: `0`. Assessment: `PC_RESOURCE_AND_REMOTE_OPERATION_AUDIT_PASS`.

## Physical-device QA and teardown

- The owner completed the bounded physical-iPhone regression and reported `전체 PASS, 저장 0회, 이상 현상 없음`.
- The accepted scope is app display, list search/status filter, detail/back navigation, exact overview/material field focus, keyboard visibility, X cancellation/restoration, due-date sheet open/close, background/re-entry, and absence of crash, red screen, or infinite loading.
- Check/save, add, archive/restore, order, PDF/share, and business mutation were not requested or performed. The result is not expanded beyond the requested non-saving regression.
- Canonical stop terminated the four exact runner-owned PIDs only. Runner state became stopped, every recorded role was dead, ports `3000/3100/8081` were `0/0/0`, Serve config was empty and ownership released, Funnel enabled was false with `AllowFunnel: true` `0`, and Tailscale/Chrome Remote Desktop remained Running. Unrelated-process termination was `0`.
- The post-stop read-only DB snapshot remained WorkOrder/revision/material `34/34/14`, event/receipt `67/26`, due date `2026-07-30`, total quantity `10`, and migration ledger `13/13`; alpha.53 business mutation and unknown/automatic/duplicate mutation were `0`.
- Post-stop resource audit at `2026-07-23 09:12:36 KST`: CPU `12.0/14.0/5.0%`, average `10.3%`, range `5.0-14.0%`; physical memory `31.12 GB` total, `10.56 GB` used (`33.9%`), `20.56 GB` available; `C:` free `1,197.4 GB` (`62.8%`); disk active time and queue `0/0/0`, throughput `0.00-0.49 MB/s`; abnormal finding `0`, remote-operation risk `0`.
- `Temperature: unavailable with approved read-only tooling`. No service, power, registry, driver, monitoring utility, reboot, shutdown, or logoff change occurred.
- Static-remediation resume audit at `2026-07-23 09:30:30 KST`: CPU `22.0/24.0/10.0%`, average `18.7%`, range `10.0-24.0%`; the initially elevated `svchost` sample fell from `13.2%` and `13.8%` to `1.8%`, so no sustained abnormal consumer was found. Physical memory was `31.12 GB` total, `10.57 GB` used (`34.0%`), and `20.55 GB` available. System/repository drive `C:` had `1,197.2 GB` free (`62.8%`). Disk active time and queue were `0/0/0`; throughput was `0.00-0.79 MB/s`. Runner-owned process and listener count remained `0`, Serve was empty, Funnel was disabled with `AllowFunnel: true` `0`, and Tailscale/Chrome Remote Desktop were Running. `Temperature: unavailable with approved read-only tooling`. Abnormal finding `0`; remote-operation risk `0`.
- Final-Verify preflight resource audit at `2026-07-23 09:37:36 KST`: CPU `5.0/2.0/0.0%`, average `2.3%`, range `0.0-5.0%`; the highest normalized process samples were `WmiPrvSE`, `macourtsafersvc`, and `MaEPSBrokerIrosSvc` at `0.4%` each, with no sustained abnormal consumer. Physical memory was `31.12 GB` total, `10.78 GB` used (`34.6%`), and `20.34 GB` available. System/repository drive `C:` had `1,197.2 GB` free (`62.8%`); disk active time `0%`, queue `0`, throughput `0.50 MB/s`. At `09:37:44 KST`, runner marker and owned processes were absent, ports `3000/3100/8081` were `0/0/0`, Serve was empty, Funnel parsed as disabled with `AllowFunnel: true` `0`, and Tailscale/Chrome Remote Desktop were Running/Automatic. `Temperature: unavailable with approved read-only tooling`. Abnormal finding `0`; remote-operation risk `0`; assessment `PC_RESOURCE_AND_REMOTE_OPERATION_AUDIT_PASS`.

## Final delivery

- Final canonical documents and `2.0.0-alpha.53` version metadata were applied after device QA and teardown.
- Final Verify/fingerprint, commit/push, Source ZIP, matching repo-state, and clean Git are recorded by the final workflow output and matching repo-state; they must match the facts reported at delivery.

## Extension boundary

- Alpha.54 can attach Reel Picker value/adapter state at feature/controller and shared formatter boundaries without direct root-component/API coupling.
- A later separately approved material-order lifecycle can reuse explicit mutation gating and material policy/gateway boundaries; alpha.53 adds no request/cancel/complete behavior.
