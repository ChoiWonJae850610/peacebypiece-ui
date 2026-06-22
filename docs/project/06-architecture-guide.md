# PeaceByPiece Architecture Guide

## Architecture Goals

- Keep UI, domain rules, repositories, runtime gates, and infrastructure adapters separable.
- Preserve tenant and role boundaries across every read and mutation path.
- Prefer typed contracts and shared facades over cross-screen imports.
- Keep diagnostic, simulator, and system-admin capabilities non-customer-facing and auditable.

## Layer Boundaries

### App and Route Layer

`app/` owns routing, layouts, server/client boundaries, and route-level guards. It should not contain reusable domain calculations or direct infrastructure policy.

### Feature Layer

`features/` owns domain workflows and screen-specific composition. Large feature files should extract presentation helpers, hooks, and typed state without changing business behavior.

### Component Layer

`components/` owns reusable WAFL primitives and composed patterns. Components must not silently bypass permission, mutation, or tenant rules.

### Library Layer

`lib/` owns domain contracts, repositories, shared utilities, i18n, runtime policy, and infrastructure facades. Direct DB/R2 access should remain behind named repositories or adapters.

### Tools and Tests

`tools/` owns guarded automation, simulator, pipeline, and release utilities. `tests/` owns contract and regression evidence. Destructive commands require explicit confirmation and environment restriction.

## Dependency Direction

Preferred direction:

`app → features → components/lib contracts → repositories/adapters`

Avoid:

- components importing route modules;
- UI code importing raw DB/R2 clients;
- feature modules reaching into another feature's private implementation;
- runtime/permission policy duplicated in screen-local code;
- archived docs used as current implementation authority.

## Data and Mutation Rules

- Every mutation must identify actor, tenant/company, target resource, expected revision or sequence, and result.
- UI locks prevent duplicate action but do not replace server-side validation.
- Stale writes, partial saves, and retry behavior must be explicit.
- Audit records must not expose secrets or raw tokens.
- DB/R2 logical usage and physical object state are separate concepts.

## Runtime and Permission Rules

- Runtime availability and user authorization are separate checks.
- System-admin tools require active system-admin authorization and additional operation guards where destructive.
- Customer roles receive least-privilege UI and server enforcement.
- Production must never rely on UI hiding alone.

## PDF and Storage Boundaries

- PDF rendering consumes a versioned document model rather than arbitrary screen DOM.
- Template, renderer, storage lifecycle, access policy, and audit metadata are separate modules.
- R2 object keys must include stable tenant/resource namespaces without embedding secrets.
- Quota accounting, physical reconciliation, retention, trash, and purge remain independently testable.

## Change Strategy

1. Establish contract and test boundary.
2. Extract low-risk types/helpers.
3. Split composition from domain behavior.
4. Move infrastructure access behind adapters.
5. Verify behavior before visual or policy changes.
6. Record remaining debt in PB backlog.
