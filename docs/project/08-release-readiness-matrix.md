# Release Readiness Matrix

Status values: `Blocked`, `Planned`, `In Progress`, `Ready`, `Verified`.

| Area | Release condition | Current status | Required evidence | Owner |
| --- | --- | --- | --- | --- |
| Build and Type | production build and type checks pass | Verified | latest build result and contract log | Codex |
| Git and Deployment | master synchronized, clean, Vercel QA deployed | Verified | repo-state and deployment check | Codex/User |
| Runtime Gates | internal/dev/system routes follow approved runtime policy | In Progress | runtime audit and route contracts | ChatGPT/Codex |
| Permission | role and tenant enforcement verified in UI and server paths | In Progress | permission audit and role matrix | ChatGPT/Codex |
| WAFL UI | shared components cover release-critical screens | In Progress | adoption inventory and visual QA | ChatGPT/User |
| Responsive | PC, iPad, Galaxy Tab, iPhone/mobile workflows pass | In Progress | browser/device matrix | User/Codex |
| Mutation Safety | duplicate save, stale write, retry, lock behavior covered | In Progress | mutation contracts and manual regression | Codex |
| Data Integrity | schema/repository invariants and tenant isolation pass | In Progress | DB contracts and smoke tests | Codex |
| PDF | template, renderer, lifecycle, access, and QA approved | Blocked | PDF specification and sample approval | ChatGPT/User/Codex |
| R2 and Storage | key policy, quota, retention, reconciliation approved | Blocked | storage policy and dry-run evidence | ChatGPT/User/Codex |
| System Admin | dashboard and operational controls productized | In Progress | system-admin QA matrix | ChatGPT/Codex |
| Functions | catalog, safety grades, and execution coverage complete | In Progress | functions automation profile | Codex |
| Simulator/Seed | scenario fixtures are safe and reproducible | Planned | fixture catalog and reset/seed guards | ChatGPT/Codex |
| i18n | customer-facing strings use canonical locales | In Progress | string scan and locale QA | Codex |
| Performance | critical screens meet agreed interaction targets | Planned | bundle/render/interaction measurements | Codex |
| Playwright | release-critical journeys automated | Planned | passing CI/local report | Codex |
| Security/Privacy | secrets, auth, tenant, upload, and audit risks cleared | In Progress | security checklist and audits | ChatGPT/Codex |
| Operations | backup, incident, support, retention, and release runbook ready | Planned | operational documentation | ChatGPT/User |
| Legal/Policy | customer-facing policies approved and versioned | In Progress | approved policy versions | User |

## Release Blocking Rule

Any `Blocked` item in PDF, R2/storage, permission, runtime, data integrity, security/privacy, or legal/policy prevents production release when the feature is active or required by the commercial plan.

## Evidence Rule

A row can become `Verified` only when its evidence path, date/version, and remaining risk are recorded. Verbal confirmation alone is insufficient for release-critical areas.
