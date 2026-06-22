# PeaceByPiece Administrator Operations Design

## Purpose

This document defines the operational boundary between customer company administrators and PeaceByPiece system administrators. It is a product/operations contract, not permission to execute production mutations.

## Administrator Types

### Company Administrator

Operates only within the active company tenant:

- members, invitations, role assignments, and permitted role-policy settings;
- company profile and company-managed files;
- plan/storage usage visibility and warning response;
- workflow oversight and company audit/history views;
- policy agreement and account requests exposed to the company.

A company administrator cannot inspect or mutate another tenant, system configuration, raw infrastructure identifiers, or internal diagnostic controls.

### System Administrator

Operates the service control plane:

- company/account-request review and lifecycle status;
- service health, release state, storage metadata summaries, and incident coordination;
- guarded test/simulator tools and allowlisted account switching;
- operational policy/catalog review;
- audit review and support case handling.

System administrator status does not automatically grant unrestricted customer-content browsing. Content access requires a named support/legal purpose, least privilege, audit evidence, and product-policy approval.

## Operations Console Information Architecture

1. Overview: release, incidents, pending approvals, storage warnings, failed jobs.
2. Companies: lifecycle state, plan, member count, storage summary, policy status.
3. Approvals: company registration, account changes, exceptions, required evidence.
4. Storage: logical/physical usage, reconciliation state, quota warnings; metadata-first.
5. Functions/Jobs: catalog, safety grade, last result, dry-run availability; no hidden execution.
6. Audit: actor, tenant, action, target metadata, result, reason, correlation id.
7. Support: case record, scoped access request, action log, resolution.
8. Release: current version, readiness gates, verification evidence, rollback notes.

## Company Lifecycle

Suggested states:

`requested → review → active → restricted | suspended → closure_requested → retention/grace → purged`

- Approval and rejection require reason/evidence.
- Restriction, suspension, closure, and purge are distinct operations.
- Restoration paths are explicit where allowed.
- Destructive purge is never implied by UI status alone.
- Billing/plan changes, policy disagreement, and security incidents use separate reason codes.

## Operational Action Classes

| Class | Example | Default control |
| --- | --- | --- |
| Read-only | metadata dashboard, audit search | role/tenant guard |
| Reversible | restrict, suspend, logical trash | reason, confirmation, audit |
| Sensitive | role override, scoped support access | step-up approval and expiry |
| Destructive | purge, reset, production data repair | separate explicit approval, environment guard, dry-run where possible |

Bulk actions require preview, affected-count summary, exclusions, idempotency, partial-failure report, and exportable evidence.

## Approval and Four-Eyes Policy

High-impact production actions should support requester/approver separation. The record contains request reason, scope, evidence, risk, expiry, approver, execution result, and rollback/recovery status. Self-approval is disallowed for configured critical operations.

## Audit Contract

Audit records are append-oriented and include:

- actor and effective/impersonated identity;
- original identity when account switching is used;
- tenant and target resource metadata;
- action, reason, before/after summary where safe;
- timestamp, result, correlation id, and originating tool/profile;
- approval reference for sensitive/destructive operations.

Do not log passwords, tokens, signed URLs, raw secrets, full private file contents, or unnecessary personal data.

## Support Access

- Default support uses metadata and user-provided evidence.
- Any customer-content access is time-bounded, purpose-bound, minimally scoped, and visible in audit logs.
- Impersonation clearly shows current identity/company and provides restore-to-original-session.
- Production support tooling must not reuse dev/test seed shortcuts.

## Storage Operations

Administrators can view quota and reconciliation status. Increasing quota, correcting metadata, restoring trash, and purging objects are distinct operations. Physical R2 repair is not performed from a generic dashboard button; it uses a guarded operational workflow with dry-run evidence.

## Incident Operations

Severity, owner, affected tenants, mitigation, communication, data-integrity assessment, and closure evidence are recorded. Emergency actions remain audited and are reviewed after the incident. A rollback does not replace reconciliation or customer-impact review.

## Release Operations

A release view consumes the Release Readiness Matrix and shows gate evidence rather than a manual "ready" toggle. Commit/push to `master` is required for Vercel real-device QA before 1.0. Production release approval remains distinct from Vercel QA deployment.

## Minimum QA

- company administrator cannot cross tenant boundaries;
- system pages reject non-system administrators;
- effective/original identity is visible during test account switching;
- reversible/destructive actions have correct confirmation and audit behavior;
- approval state transitions reject invalid sequences;
- storage dashboards expose metadata, not unauthorized content;
- mobile/tablet/desktop admin layouts remain usable;
- empty, loading, error, partial failure, and stale data states are defined.

## Decisions Still Required

- commercial plan capacities and overage/blocking behavior;
- retention/grace/purge periods;
- exact support-content access policy;
- four-eyes operations list;
- customer-visible audit scope;
- production incident communication and escalation ownership.
