# WAFL External Mobile QA Runbook

Document role: canonical owner for external Runtime preflight, start, readiness, device handoff, status, and stop procedures. Permanent security/Git/failure rules belong to `09-codex-working-rules.md`; environment/native identity belongs to `06-expo-environment-setup.md`; device acceptance belongs to `05-device-test-plan.md`; historical runs belong to evidence.

## Supported topology

| Role | Transport | Boundary |
| --- | --- | --- |
| Metro | private Tailscale LAN HTTP | Development Build/ATS only |
| Developer auth and business API | Tailscale Serve HTTPS | tailnet-only, exact Serve host |
| Preview/Viewer | Cloudflare Quick Tunnel HTTPS | process-owned exact temporary host |
| Next backend | `127.0.0.1` | localhost-only |

Funnel is forbidden. `x-forwarded-host` is never host authority. Temporary origins, identity material, fingerprints, connection codes, cookies, tokens, and full private host/address values are not tracked.

## Preconditions

Before start, verify read-only:

- repository, branch, HEAD, origin, and clean/approved working state;
- active Version Delta and required static Verify;
- Tailscale service online and user-owned device identity resolvable;
- exact process-local developer identity mapping when DeveloperAutoConnect is used;
- approved dev/test DB fingerprint and Company context;
- production blocked and Command mode/effect budget exactly as declared;
- selected ports free or owned exactly as allowed by the Delta;
- no active unrelated Serve/Funnel configuration;
- cloudflared, Node, mobile dependencies, and installed Development Build remain compatible.

An existing Serve/Funnel configuration, HTTPS consent requirement, ambiguous identity/company mapping, production target, or unknown listener ownership is a stop condition. Do not reset, merge, approve, or kill broadly.

## Start

Use the canonical script once:

```powershell
.\tools\dev\start-wafl-external-qa.ps1 `
  -MobileTransport DeveloperAutoConnect `
  -NextPort 3100 `
  -ExpoPort 8081
```

Use `TailscaleLan` only when the active Delta explicitly retains the manual-code flow. `Lan` is diagnosis only and is not external-cellular acceptance. The legacy Expo tunnel remains disabled.

The runner must:

- derive and validate exact Tailscale/WAFL mapping without logging raw identity;
- start Next on `127.0.0.1` only;
- create one runner-owned foreground Serve proxy to that localhost backend;
- keep Funnel disabled;
- start one process-owned Cloudflare Quick Tunnel for Preview/Viewer;
- start Metro with Tailscale advertisement and public API/Preview origins only;
- inject DB fingerprint, identity hash pair, session secrets, and mutation approval only into the exact server process that needs them;
- write ownership marker/state only under ignored runtime paths;
- stop without automatic retry/rollback/cleanup when any stage fails.

The default DeveloperAutoConnect mode is read-only. A bounded mutation switch may be used only when the active Version Delta names it and its exact effect budget.

## Readiness

Before user QA, verify the exact checks named by the Delta. The standard read-only set is:

- runner state and ownership marker ready;
- Tailscale service and Serve HTTPS ready;
- Next localhost backend healthy;
- Cloudflare Preview/Viewer origin ready;
- Metro manifest and advertised Tailscale endpoint valid;
- one bounded bundle transfer when specifically required;
- API origin and Preview origin separated;
- production and Command mutation blocked;
- bounded session/auto-connect, `auth/me`, expected Company context, allowed reads, and disconnect;
- business/DB/R2/PDF/token/production effects zero.

Never reconstruct or log raw origins, manifest bodies, bundle source, cookie jars, identities, or UUIDs. Do not exceed request counts fixed by the active Delta.

## Status

Use:

```powershell
.\tools\dev\status-wafl-external-qa.ps1
```

Status is read-only. Report sanitized state, transport, readiness booleans, process-role liveness, guard mode, and short approved prefixes. Do not print session, token, raw identity, full fingerprint, or sensitive CommandLine arguments.

## Device handoff

After Codex preflight passes, ask the user once for the concrete flow in the active Delta. The handoff states:

- runner readiness;
- required Tailscale and cellular/LAN condition;
- installed WAFL Development Build reuse;
- exact Reload allowance;
- screens and interactions to verify;
- prohibited save/mutation actions;
- concise PASS/FAIL report fields.

Do not declare device PASS before the user reports the instructed result. Follow `05-device-test-plan.md` for completion classification.

## Stop

After required QA/effect audit, run once:

```powershell
.\tools\dev\stop-wafl-external-qa.ps1
```

The stop script owns exact process/config teardown. Do not supplement it with manual or name-based termination.

### Ownership decision

For each marker role:

1. no process at marker PID means already stopped;
2. same PID with different normalized StartTime/CreationDate means protected unrelated PID reuse, termination signal zero, original runner process already stopped;
3. same PID/time requires exact owner marker, executable, CommandLine, and expected role/backend before termination;
4. metadata failure or same-time executable/command mismatch is unresolved ownership failure and blocks stop completion.

For the exact marker-owned foreground Serve PID only, an initial exact CIM process miss may invoke one bounded exact-PID Windows/WMI metadata fallback. It must verify PID, run identity, normalized time, canonical executable, exact Serve command, localhost backend, and Funnel-disabled configuration. No second metadata fallback or kill retry is allowed.

### Funnel decision

Parse status/config JSON structurally:

- any explicit `AllowFunnel: true` means Funnel enabled and stop validation fails;
- false, null, or missing values do not enable Funnel;
- a foreground Serve object does not by itself mean Funnel;
- malformed or unknown JSON never becomes disabled PASS.

Do not run Serve reset, Funnel reset, `tailscale down`, service stop/restart, wildcard taskkill, broad Node/cloudflared termination, or reboot.

### Stop PASS

The standard PASS requires:

- runner state stopped and marker safely cleared;
- runner-owned cloudflared, Next, Metro, and foreground Serve ended or correctly already-stopped/PID-reused;
- protected unrelated process termination zero;
- Serve WAFL proxy removed and no unresolved ownership mismatch;
- explicit `AllowFunnel: true` count zero and Funnel configuration unchanged;
- expected listeners zero;
- Tailscale service Running;
- ownership skip zero unless the active failure handoff explicitly records otherwise.

If stop is partial, preserve marker, process/config evidence, and logs. Do not run another stop or manual kill without a new exact owner decision.

## Failure handling

On any Runtime failure:

- do not automatically restart, retry, clean ports, change transport, relax host/permission guards, or delete logs;
- preserve the last successful stage, exact command, elapsed time, owned PIDs, listeners, marker, Serve/Funnel state, and sanitized error;
- audit mutation effects read-only;
- produce the Failure Handoff required by `09-codex-working-rules.md`.

## Historical evidence

- split-transport foundation: `40-external-mobile-qa-foundation-evidence.md`;
- installed iOS build: `42-ios-development-build-evidence.md`;
- manual connection/real reads: `43-mobile-real-data-read-only-evidence.md`;
- developer auto-connect and stop hardening: `46-mobile-tailscale-serve-developer-auto-connect-evidence.md`;
- material Read external QA: `47-mobile-materials-real-read-evidence.md`.

These records are immutable. This runbook may evolve operational procedure without rewriting what those runs observed.
