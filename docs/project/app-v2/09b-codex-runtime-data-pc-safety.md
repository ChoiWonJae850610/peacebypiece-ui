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

## 3. Transport and Funnel

Unless an exact Delta changes the specialist environment:

- Metro uses private Tailscale LAN HTTP under Development-only ATS.
- Developer authentication and business API use tailnet-only Tailscale Serve HTTPS.
- Preview/Viewer uses runner-owned Cloudflare Quick Tunnel HTTPS.
- Next DeveloperAutoConnect binds `127.0.0.1`, never `0.0.0.0` or a public/LAN address.
- Tailscale Funnel is forbidden.
- Host/path allowlists are exact; request `Host` is authority and `x-forwarded-host` is not.

Parse Tailscale config structurally. Funnel is enabled only when an active item explicitly has `AllowFunnel: true`. Empty JSON or false/null/missing values are disabled. A non-empty Serve object alone is not Funnel. Parse failure or unknown schema is not PASS. Normal teardown does not silently mutate Funnel configuration.

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
