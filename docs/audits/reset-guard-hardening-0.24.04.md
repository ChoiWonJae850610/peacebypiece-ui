# Reset Guard Hardening 0.24.04

## Executive Summary

0.24.04 hardens the PowerShell menu 9 `Reset Database Schema` path without running Reset, Seed, Cleanup, Migration, or R2 mutation. The SQL runner is now gated by the same safety shape used by Simulator DB mutation commands: non-production runtime, PostgreSQL URL shape, approved DB fingerprint match, `wafl-fn` prefix, and an exact destructive confirmation phrase.

The final confirmation phrase is:

```text
RESET WAF-FN SCHEMA
```

`tools/pipeline/peacebypiece-auto-pipeline.ps1` is now treated as the canonical tracked PowerShell entry point. The previous broad ignore rule for `peacebypiece-auto-pipeline*.ps1` was narrowed so the canonical file can be reviewed and committed normally, while patch, old-version, backup, temporary, and copied variants remain ignored.

## Existing Risk

Before this change, menu 9 loaded `.env.local`, checked `DATABASE_URL`, listed SQL files, and required the generic `RESET` phrase. It did not verify runtime allowlist, production block, approved fingerprint match, parsed host/database identity, `wafl-fn` prefix, or a specific fixture-scoped confirmation phrase before invoking `node scripts/run-sql-files.mjs`.

## Applied Guard

The new guard lives in `tools/pipeline/pipeline-common.ps1` as `TestResetDatabaseSchemaGuard`. `tools/pipeline/peacebypiece-auto-pipeline.ps1` calls it before any SQL runner invocation, using `tools/pipeline/pipeline.config.psd1` for `Simulator.AllowedRuntimes`, `Simulator.TestPrefix`, and `Simulator.ApprovedDbFingerprint`.

Guard checks:

| Check | Required result |
|---|---|
| Runtime | `development`, `dev`, `local`, `test`, or `demo` |
| Production | Explicitly blocked |
| Missing or unknown runtime | Blocked |
| DB URL | Present |
| DB protocol | `postgres` or `postgresql` |
| DB identity | Parsed host and database must be present, but not printed |
| Approved fingerprint | Must match configured approved fingerprint; value is not printed |
| Test prefix | `wafl-fn` |
| Confirmation | Exact `RESET WAF-FN SCHEMA` |
| Failure behavior | SQL runner is not called and guard returns non-zero `ExitCode` metadata |

## Blocked Scenarios

The contract test reads the canonical PowerShell entry point directly and covers:

- canonical file is not ignored by Git
- patch PowerShell variants remain ignored
- menu 9 guard call appears before the SQL runner command
- guard failure returns before the SQL runner can be invoked
- production runtime
- missing runtime
- unknown runtime
- fingerprint mismatch
- missing fingerprint
- invalid protocol
- prefix mismatch
- confirmation mismatch
- missing confirmation
- missing DB URL

## Log Sanitization

Reset guard logs only sanitized status:

```text
Runtime: development/test-style value or blocked
Target verification: PASS/BLOCKED
Approved fingerprint match: YES/NO
Prefix: wafl-fn
Destructive: YES
Production: BLOCKED/NO
```

It does not print:

- full DB URL
- username/password
- query string
- token/secret
- actual host name
- actual database name
- actual fingerprint

`tools/simulator/commands/db-data.mjs` was also updated so console/report output records DB identity presence and approval status instead of actual host, database, or fingerprint values.

## functions Environment Audit Contract

`tests/functions-environment-audit-contract.mjs` previously expected old text saying the seed adapter was intentionally unconnected before mutation. The implementation now has Simulator DB seed and cleanup adapters behind runtime/fingerprint/prefix/confirmation guards, so the contract was updated to verify implemented adapter state and sanitized DB/R2 logging.

## SSL Warning Decision

The known `pg` warning says current SSL modes such as `prefer`, `require`, and `verify-ca` are treated as `verify-full` by current packages but may change semantics in a future major version.

Decision for 0.24.04:

- Do not print or change real DB URLs.
- Do not modify `.env.local`.
- Do not change production DB settings.
- Record `sslmode=verify-full` as a follow-up configuration decision.
- Treat the warning as a non-blocking configuration risk unless a future package upgrade changes behavior.

## DELETE-SAFE Recheck

The 0.24.03 audit listed six DELETE-SAFE items. 0.24.04 rechecked them but did not delete anything.

| Item | Git tracking | Reference risk | 0.24.04 handling |
|---|---|---|---|
| `.next` | ignored | generated build output | Keep ignored; no deletion |
| `artifacts` | ignored | generated reports | Keep ignored; no deletion |
| `.tmp` | ignored/local temp | simulator local output | Keep ignored; no deletion |
| `test-results` | ignored | Playwright output | Keep ignored; no deletion |
| `playwright-report` | ignored | Playwright output | Keep ignored; no deletion |
| root `node_modules` | ignored | local dependencies | Keep local; no deletion |

Deferred:

- `cloudflare/pdf-generator-worker/node_modules` remains `DELETE-REVIEW`, not DELETE-SAFE, because it is tracked and needs deploy policy review in 0.24.05.

## Validation Plan

Required validation:

- `git diff --check`
- PowerShell syntax/static check
- `tests/reset-schema-guard-contract.ps1`
- `tests/functions-environment-audit-contract.mjs`
- `tests/dev-test-context-system-admin-contract.mjs`
- `tests/simulator-adapter-plan-contract.mjs`
- `tests/simulator-category-tree-contract.mjs`
- `npm run audit:wafl-mutations`
- `npm run build`

Full E2E is not required for this guard/documentation scope and should be reported as NOT RUN.

## Reset Execution Status

Actual Reset was not run. The change only verifies guard decision and command invocation blocking behavior.
