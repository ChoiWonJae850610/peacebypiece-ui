# WAFL Codex Runtime, Data and PC Safety

Document type: **Permanent Rules — Runtime, Data and PC Safety**

Entry point: [09-codex-working-rules.md](09-codex-working-rules.md)

This document owns canonical runner use, process ownership, remote-operation safety, mutation accounting, and the Mandatory PC Resource and Remote-Operation Audit.

## 1. Runtime authority and canonical runner

- Runtime is read-only by default. A bounded dev/test mutation exists only when the Delta names the exact target, command, expected versions/events/receipts, and maximum effect.
- Codex operates the canonical runner. Do not require the owner to run npm, Next, Expo, cloudflared, or Tailscale commands.
- The runner controls only its named roles and configuration. A previous mutation switch is not persistent authority.
- Production DB/R2/API, schema/migration, seed, cleanup, reset, rollback, PDF/token lifecycle, and business writes remain zero unless exact authority exists.
- Tailscale and Chrome Remote Desktop are protected remote-access services. Do not stop or restart them.
- Reboot, shutdown, logoff, Windows Update restart, network-adapter reset, registry workaround, service deletion, and unapproved scheduled-task changes are forbidden during remote operation.

Environment details belong to `06-expo-environment-setup.md`; commands and sequence belong to `41-external-mobile-qa-runbook.md`.

## 2. Process ownership and safe stop

Ownership requires marker role and run identity plus exact PID, normalized StartTime/CreationDate, executable path, CommandLine, and expected backend. PID or process name alone is never ownership.

- Use the strict CIM metadata path when available.
- A bounded exact-PID WMI fallback is allowed only when the runner contract permits it and it reproduces the full ownership tuple.
- A current StartTime mismatch is protected PID reuse: send no signal.
- A same-StartTime executable or command mismatch is an ownership failure.
- Never use name-based or broad Node/cloudflared/Tailscale termination, wildcard taskkill, `tailscale down`, unconditional Serve/Funnel reset, service stop, or broad port cleanup.

Stop only exact runner-owned roles. Verify ownership count, role PIDs, ports, Serve ownership release, Funnel state, and unrelated-process impact afterward.

Port availability gates are scoped to WAFL ownership, not the entire PC. In particular, the external-QA `port 3000` invariant means that no WAFL-owned or unresolved-provenance listener may own port 3000. A listener from another project is allowed only when exact PID, parent PID, executable path, and CommandLine path provenance are available and prove that neither the process nor its parent/command belongs to the current WAFL repository or runner records. Unknown or incomplete metadata fails closed. Never stop, alter, or relabel a verified unrelated listener merely to make WAFL READY.

## 3. Transport and Funnel

Unless an exact Delta changes the specialist environment:

- Metro uses private Tailscale LAN HTTP under Development-only ATS.
- Developer authentication and business API use tailnet-only Tailscale Serve HTTPS.
- Current App-first Preview/Viewer uses the same tailnet-only Tailscale Serve HTTPS origin. Quick Tunnel, cloudflared, and Funnel are not current physical-QA transports.
- The forbidden-tunnel gate is provenance-aware like the port-3000 gate. WAFL-owned cloudflared, any Quick Tunnel, any Funnel, any cloudflared ingress targeting the WAFL repository/runtime, Next 3100, Metro 8081, the current Tailscale Serve host, or any unresolved cloudflared provenance fails closed. A signed, foreign, named-tunnel Windows service may remain running only when exact process/service provenance and its live diagnostic ingress config prove that every route is parseable and disjoint from WAFL hosts and ports. Never print the token, tunnel identity, ingress hostname, credentials, or raw diagnostic config, and never stop or relabel a verified unrelated shared service merely to make WAFL READY.
- Next DeveloperAutoConnect binds `127.0.0.1`, never `0.0.0.0` or a public/LAN address.
- Tailscale Funnel is forbidden.
- Host/path allowlists are exact; request `Host` is authority and `x-forwarded-host` is not.

The normal latest Maker physical-QA runtime is cumulative: its canonical profile contains every still-supported finalized Maker capability plus the selected current Delta capability. Selecting a new feature mode must not silently remove older Maker authoring capabilities. One pure canonical capability owner supplies both internal command guards and the Tailscale method/path gate; feature-specific historical profiles may remain only as bounded test/evidence modes. A new current profile must extend the semantic superset contract, remain dev/test-only and production-closed, and preserve exact route/method, tenant, permission, version, idempotency, Event, and Receipt boundaries. A green set of isolated historical feature modes does not prove the latest Maker runtime READY.

Parse Tailscale config structurally. Funnel is enabled only when an active item explicitly has `AllowFunnel: true`. Empty JSON or false/null/missing values are disabled. A non-empty Serve object alone is not Funnel. Parse failure or unknown schema is not PASS. Normal teardown does not silently mutate Funnel configuration.

Server-mediated third-party APIs use one fixed HTTPS upstream and a server-only credential owner.
Credentials must never enter `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, a mobile bundle, client response,
source fixture, Result, or log. The server proxy requires the normal authenticated permission
guard, validates and bounds every input, uses a timeout and bounded response parser, returns only
the typed fields the client needs, disables caching, and exposes stable WAFL errors without raw
provider payloads. External-QA ingress must admit only the exact current-profile method/path.

## 4. Mutation baseline and effect accounting

Before Runtime, record the exact WorkOrder/revision/material versions, event/receipt counts, migration ledger, and any additional in-scope object/row/document/token counts. Define the expected delta before interaction.

- One explicit Check or command may issue at most one request.
- Automatic save, duplicate submit, automatic retry, automatic rollback, and compensating cleanup/delete are forbidden.
- Read-only audits must not touch timestamps, versions, sequences, events, receipts, documents, or object state.
- Compare the same baseline after automated QA, device QA, and stop.
- Any unknown mutation, unexplained partial effect, target/fingerprint change, tenant leak, or effect outside budget stops work immediately.
- Preserve partial effects and source/runtime/data state. Do not repair data without a separate exact approval.

## 5. Mandatory PC Resource and Remote-Operation Audit

Until the owner explicitly changes this rule, every WAFL task performs a read-only audit at:

1. start-of-work preflight;
2. immediately before Runtime start;
3. after automated Runtime QA;
4. immediately before requesting physical-device QA;
5. after runner stop and before final verification.

Documentation-only or static-only work audits at start and immediately before final verification. If QA resumes after a material delay or on another calendar day, audit again before resumption.

Each checkpoint records actual KST and:

- at least three short-interval total CPU samples, average/range, and sustained top CPU consumers;
- total, used, and available physical memory;
- system and repository drive free space;
- disk active time, queue, throughput, or another bounded abnormal-I/O indicator;
- runner role PID, ownership, CPU, and memory for Next, Metro, Serve, and runner-owned cloudflared when present;
- unexpected duplicate or unowned Node/Next/Metro/Serve/cloudflared processes;
- Tailscale and Chrome Remote Desktop service state;
- Serve configuration and structural `AllowFunnel: true` count;
- remote-access stability risk;
- CPU/GPU/system temperature and thermal throttling only when a reliable Windows or already-installed approved read-only path exists.

Do not infer temperature. When unavailable, record exactly:

`Temperature: unavailable with approved read-only tooling`

Do not install monitoring software, drivers, services, native/BIOS utilities, or external programs. The audit must not stress/benchmark, change fan/power/priority, restart services, kill processes, clear caches/memory, optimize disks, edit registry, or manipulate Windows Update.

Judge repeated samples in context. Distinguish a transient build/test spike from sustained idle or QA-wait load. Investigate unexplained sustained CPU/I/O, low capacity, duplicate/mismatched processes, stopped remote services, enabled Funnel, confirmed throttling, remote instability, or a material unexplained checkpoint delta.

For a clear anomaly or remote-operation risk:

1. do not request device QA or restart Runtime;
2. keep remote services running;
3. preserve source, Runtime, markers, logs, and data;
4. perform read-only cause analysis;
5. declare `PC_RESOURCE_OR_REMOTE_OPERATION_RISK_HANDOFF_REQUIRED`;
6. provide the Failure Handoff defined in `09c`;
7. do not clean, kill, reboot, shut down, or log off without owner approval.

## 6. Evidence and reporting

Evidence records checkpoint, actual KST, CPU samples and average/range, top consumers, memory, drive capacity, disk-I/O assessment, runner roles/resources/ownership, remote services, Serve/Funnel, temperature availability, abnormal finding count, risk, and `PASS` or `HANDOFF REQUIRED`.

The final report summarizes every applicable checkpoint, peak/notable resource use, final capacity, unexpected-process count, remote-operation risk, remote-service preservation, and unrelated-process impact.
