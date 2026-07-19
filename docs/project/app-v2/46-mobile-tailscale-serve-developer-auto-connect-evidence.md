# Alpha.47 Mobile Tailscale Serve Developer Auto-connect Evidence

## Scope and baseline

Alpha.47 starts from completed alpha.46 commit `d70b7902623e4a4aeeb7a108b5df9790bd41cbf9`. It reuses the installed ATS-corrected iOS Development Build number 1. Native dependencies, Expo SDK, ATS, EAS, schema, migration, business data, R2, PDF, token, and production state are outside scope.

The normal external developer flow must no longer require viewing the home PC or entering a one-time code. Tailscale Serve provides a stable tailnet-only HTTPS origin for developer authentication and WorkOrder API. Expo Metro remains private Tailscale LAN; the Cloudflare Quick Tunnel remains Preview/Viewer transport.

## Identity and workspace boundary

Only `Tailscale-User-Login` on one exact Serve host is an authorization input. Multiple, empty, oversized, comma-containing, control-character, or invalid values are rejected. Display name, profile picture, forwarded host, source IP alone, and request-body identity are never authorization sources.

The runner derives the current user-owned Tailscale login in process memory and hashes it. A read-only DB preflight resolves the sole active WAFL system administrator and hashes that email separately. The two exact process-local hashes form the approved one-to-one mapping; no account or email is modified. Raw identities, full hashes, DB credentials, and full DB fingerprint are not logged or tracked.

The effective workspace target is exactly the current simulator authority `wafl-fn-company-a`, with one approved company administrator. The provisional `test-company-a` identifier is not used. System-administrator identity is never used directly as a workspace session.

The approved follow-up preflight ran exactly once and passed: Tailscale node online and user-owned, active system administrator count one, Company A target count one, company-admin read authority, approved dev/test fingerprint, and DB/R2/PDF/token/production mutation zero.

## Endpoint, transport, and mobile flow

`POST /api/dev/mobile-connect/auto` is admitted only on the exact Serve host in non-production DeveloperAutoConnect mode. It accepts no identity or company body fields. On success it reuses the existing signed WAFL session cookie with HttpOnly, Secure, SameSite=Lax, Path=/, and a maximum two-hour lifetime; no cookie, token, email, or internal ID appears in the response body.

The mobile API origin is `EXPO_PUBLIC_WAFL_API_BASE_URL` on exact Serve HTTPS. Preview/Viewer continues to use `EXPO_PUBLIC_WAFL_WEB_BASE_URL` on exact Cloudflare HTTPS. Metro receives public origins and a boolean mode flag only. Identity hashes, DB fingerprint, session secret, and Command approval are absent from the bundle.

Boot checks `auth/me` once. A 401 causes at most one automatic Serve connection attempt, followed by one authenticated session check and list load. There is no automatic retry loop or polling. Explicit disconnect clears the cookie and suppresses immediate same-process reconnection; a cold restart may auto-connect again. The existing eight-character, one-use, expiring code flow remains available only as manual fallback.

## Serve ownership and safety

Next binds only `127.0.0.1`. Foreground Tailscale Serve is tracked as a runner-owned child. Existing Serve or Funnel configuration blocks startup; there is no automatic merge or reset. Funnel is never enabled. First-time HTTPS consent is an owner checkpoint and is never accepted automatically.

Canonical stop required three preserved partial handoffs before its final PASS. The first two partial runs observed transient loss of the exact Serve process CIM metadata and correctly refused PID-only termination. The bounded correction keeps the normal exact CIM path and, only when the exact marker-owned Serve PID has no initial CIM object, permits one exact-PID WMI metadata lookup. PID, owner marker, UTC start/creation second, canonical executable path, exact Serve command line, and backend `http://127.0.0.1:3100` must all match before one exact-PID termination; missing or mismatched metadata remains a hard stop.

The third run terminated the marker-owned Serve process and cleared its localhost proxy, but a stale Expo PID had already been reused by an unrelated process. Its current StartTime differed from the marker StartTime, so no termination signal was sent. PID reuse is now classified as the original runner process already stopped, not as an ownership failure; matching StartTime with a path or command mismatch remains a hard failure. On the final canonical stop the reused PID was no longer occupied, all four runner roles were recorded already stopped, skip count was zero, state became `stopped`, Serve configuration was empty, and ports 3000/3100/8081 had zero listeners.

Funnel status is parsed structurally. A Serve object is not treated as public Funnel exposure; only an explicit `AllowFunnel: true` is enabled. Final true count was zero, Funnel configuration was unchanged, Tailscale remained Running, and unrelated-process termination count was zero. No `serve reset`, `funnel reset`, broad process kill, or Tailscale service operation was used.

The default alpha.47 mode is read-only. WorkOrder POST/PATCH, materials, processes, revisions, lazy APIs, R2/file, PDF/token, production access, and localhost:3000 dependency are absent from the normal flow. The alpha.46 explicit mutation switch remains separate and is not activated by identity success.

## Serve, Metro, and bounded runtime evidence

- exact identity and auto-connect contract: PASS
- historical exact API-change guards and alpha.43-46 regressions: PASS
- read-only mapping preflight: one active system administrator, one exact Company A company-admin target, approved fingerprint, and mutation zero
- Serve HTTPS: DNS, TCP 443, TLS handshake, hostname, certificate validity, and unauthenticated `auth/me` 401 readiness PASS
- Funnel: disabled and unchanged
- bounded cookie-jar preflight: auto 200, authenticated `auth/me` 200, exact Company A/company-admin, list 200 with 30 items, disconnect success, final cookie count zero
- Metro manifest: final cumulative request count four; HTTP 200 `application/expo+json`; `launchAsset.url`, `extra.expoClient.hostUri`, and `extra.expoGo.debuggerHost` all advertised the exact current Tailscale endpoint
- Metro bundle: final cumulative request count one; HTTP 200 `application/javascript`; no redirect; non-empty complete response; body not executed, evaluated, logged, or persisted
- raw manifest, URL, JavaScript, login, email, full hash, cookie, and session persistence: zero

The preserved Next logs do not contain request-level access entries. The bounded PC preflight counts above are exact; per-route iPhone counts are unavailable and are not inferred. Command mode stayed blocked and no WorkOrder POST/PATCH, material/process/revision command, automatic retry loop, polling, or business mutation path was enabled.

## External cellular iPhone acceptance

The owner reported the external cellular run as PASS: iPhone Tailscale connected, WAFL launched without viewing the home PC or issuing/entering a code, developer auto-connect worked, disconnect worked, explicit reconnect worked, app close/reopen worked, and cold-restart auto-connect worked. The owner reported no error, crash, red screen, or infinite loading.

The final owner statement did not separately identify Company A/list/detail/`QA_DRAFT_A` request results or manual fallback-screen entry. Those items are not promoted to a new alpha.47 physical-device PASS: Company A/list were proven in the bounded preflight, normal list/detail behavior is preserved by regression contracts and earlier physical-device evidence, and manual fallback remains proven by source/contracts plus alpha.44 runtime.

## Final effects and delivery

- normal-flow localhost:3000 request and connection-code issue/exchange: zero by owner report; localhost:3000 had no listener during the final run
- business/DB/schema/migration mutation: zero
- R2 PUT/GET/DELETE, PDF/token, production access/mutation: zero
- native dependency, ATS, EAS Build, and EAS Update: zero
- Tailscale Serve was runner-owned, Funnel stayed disabled, and canonical stop restores the prior empty Serve configuration while leaving Tailscale running
- final canonical stop: `stopped`, ownership skip zero, all recorded runner roles already stopped, Serve config empty, ports 3000/3100/8081 listener zero, unrelated termination zero

Final status is `ALPHA47_TAILSCALE_SERVE_DEVELOPER_AUTO_CONNECT_COMPLETE`. Final Verify, stop, Git, Source ZIP, and repo-state identities are authoritative in the matching alpha.47 repo-state; no temporary origin, identity material, Runtime audit file, or Serve snapshot is included in source delivery.
