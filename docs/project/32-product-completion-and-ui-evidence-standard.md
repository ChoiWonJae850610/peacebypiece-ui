# Product Completion and UI Evidence Standard

Status: CONFIRMED
Baseline: 0.24.34.3.1
Owner intent: product-facing work is complete only when the running product matches the requested location, wording, visual system, and interaction flow.

## 1. Completion Levels

Every implementation report must classify each user-visible requirement with exactly one of these levels.

1. `LEVEL_1_CODED`
   - Source code or documents were added or changed.
   - This level does not prove that the route is mounted or usable.
2. `LEVEL_2_STATIC_VERIFIED`
   - Relevant contracts, lint, typecheck, and build pass.
   - This level does not prove runtime behavior or visual placement.
3. `LEVEL_3_RUNTIME_VERIFIED`
   - The localhost application was opened with the required role/session.
   - The route, API calls, interactions, and failure states were exercised.
4. `LEVEL_4_PRODUCT_VERIFIED`
   - Runtime behavior is verified.
   - The feature appears in the exact requested screen/section/order.
   - Customer copy, responsive layout, canonical WAFL components, and the requested interaction flow match the owner requirement.
   - Required screenshot, locator, console, network, and trace evidence exists.

For UI work, only `LEVEL_4_PRODUCT_VERIFIED` may be reported as `완료` or `completed`.

Allowed incomplete status labels:

- `CODE_COMPLETE`
- `STATIC_VERIFIED`
- `RUNTIME_QA_INCOMPLETE`
- `PRODUCT_QA_INCOMPLETE`
- `BLOCKED`

A roadmap or report must not convert `NOT_RUN`, `PENDING_USER_QA`, or missing visual evidence into `completed`.

## 2. Requirement Evidence Matrix

Every UI version must include a requirement matrix in its verification result or final report.

Required columns:

- Owner requirement
- Exact route and component
- Exact expected location/order
- Canonical WAFL component/import
- Runtime interaction
- Desktop evidence
- Mobile evidence
- iPad evidence when relevant
- Console/network result
- Completion level
- PASS/FAIL/NOT_RUN

One `FAIL` or `NOT_RUN` in a mandatory product requirement means the UI version is not product-complete.

## 3. Exact Layout Rules

Layout instructions must be expressed as component and DOM placement rules, not only as prose such as "put it on the right".

Example for the workorder size feature:

- Desktop canonical host: `WorkOrderSidePanel`.
- Required section order:
  1. 디자인
  2. 첨부 파일
  3. 공장 전달사항
  4. 사이즈·치수
- The center workorder body must not render the size editor or a duplicate size summary.
- Tablet/mobile may use their canonical drawer/sheet, but must preserve the same information hierarchy.
- A locator assertion must prove both the required host and the absence of the forbidden duplicate host.

A component that exists but is mounted in the wrong screen or section is `CODE_COMPLETE`, not product-complete.

## 4. Canonical WAFL UI Registry

Before adding a new UI primitive, inspect and reuse these canonical foundations.

- Modal: `components/common/ui/WaflModal.tsx`
- Modal structure helpers when required: `components/common/modal/ModalShell.tsx`, `ModalHeader.tsx`, `ModalBody.tsx`, `ModalFooter.tsx`
- Button: `components/common/ui/WaflButton.tsx`
- Action button: `components/common/ui/WaflActionButton.tsx`
- Number input: `components/common/ui/WaflNumberInput.tsx`
- Select: `components/common/ui/WaflSelect.tsx`
- Selectable card: `components/common/ui/WaflSelectableCard.tsx`
- Admin data table: `components/admin/common/WaflDataTable.tsx`
- Responsive admin table shell: `components/admin/common/responsiveTable/AdminResponsiveTableShell.tsx`

Rules:

- Import the canonical component directly or use an existing shared wrapper that imports it.
- Do not create a screen-local overlay using `fixed inset-0`, a custom `role="dialog"`, or a second focus/scroll-lock implementation when `WaflModal` or the canonical modal shell can be used.
- Do not reproduce button, input, select, card, table, radius, shadow, border, or color grammar with screen-local arbitrary classes when the canonical component already provides it.
- If a required primitive does not exist, add it under the shared WAFL layer, document it here, expose it in the internal UI catalog when applicable, and then consume it from the feature.
- Visual similarity alone is not sufficient. Source-level import/usage evidence is required.

Static contracts should reject known screen-local modal overlays and verify canonical imports for the target feature.

## 5. Customer-facing Copy

Customer routes must not expose implementation or operator terminology unless the route is explicitly an internal system-admin diagnostic screen.

Examples of prohibited customer copy:

- system-admin
- provisioning
- readiness / fake readiness
- production
- consent evidence
- raw DB/R2/Worker terms
- internal enum values
- raw API error codes
- raw storage keys or signed URLs

Customer copy must describe:

- the current state,
- the next user action,
- the expected result.

Static string checks are supporting evidence only. The final copy must be inspected in the running page screenshots.

## 6. Localhost Browser Evidence

UI work must use Playwright against localhost and generate evidence automatically.

Minimum flow:

1. Start the canonical localhost server.
2. Load the required authenticated role/session.
3. Open the target route.
4. Wait for the page-specific ready locator, not only network idle.
5. Exercise the required interaction.
6. Assert exact placement and absence of forbidden duplicates.
7. Capture desktop and mobile screenshots; capture iPad when tablet layout is affected.
8. Record console errors and failed requests.
9. Save a Playwright trace for failures and for high-risk product flows.
10. Write a manifest containing route, viewport, role, evidence file, assertions, and result.

Recommended evidence layout:

```text
artifacts/ui-qa/<version>/
  manifest.json
  signup/
  workorder/
  system/
  traces/
  network/
```

`artifacts/` remains excluded from Git and handoff ZIPs. Verification logs must record the evidence manifest path and the expected screenshot list.

Mandatory UI completion evidence:

- desktop screenshot,
- mobile screenshot,
- iPad screenshot when tablet behavior is in scope,
- open-modal or post-interaction screenshot,
- required locator assertions,
- console error count 0,
- unexpected failed request count 0,
- no indefinite loading state,
- trace/network diagnostics for any failure.

If the environment cannot generate this evidence, report `PRODUCT_QA_INCOMPLETE`; do not report completion.

## 7. Authentication and Secrets for Browser QA

Credentials, cookies, tokens, and Google account passwords must never be committed or placed in the source ZIP.

Allowed local inputs:

- `.env.local`
- `.env.playwright.local`
- a secret file outside the repository
- a gitignored Playwright `storageState` file
- approved dev/test session-switch tooling

Preferred order:

1. Reuse a gitignored Playwright `storageState` produced by a one-time authenticated login.
2. Use the approved dev/test account/session switcher.
3. Automate the real Google OAuth form only when the account allows it and CAPTCHA/2FA does not block it.

When local credential automation is used:

- verify the file is ignored by Git,
- verify menu 7 excludes it from the full ZIP,
- mask secrets in logs,
- prevent password fields from appearing in screenshots and traces,
- never print the credential value in reports.

The Google OAuth round trip and the post-OAuth product screens are separate evidence items. A blocked OAuth challenge must not prevent automatic validation of post-login product screens through an approved stored session.

## 8. Runtime Loading and Full Reset Policy

Full Reset is not a generic fix for loading or UI failures.

Before recommending or executing Full Reset, collect:

- failing API URL,
- HTTP status and duration,
- response or server error,
- console error,
- loading-state transition evidence,
- required migration presence and apply status,
- schema mismatch evidence,
- query/join timing evidence when relevant.

Full Reset is allowed only when the evidence proves that a reset is required and the user explicitly approves the destructive action. Prefer the narrow migration/apply/repair path when possible.

Every data-driven screen must leave the loading state on success and failure. A request failure must show a customer-safe error state and retry action instead of an indefinite spinner.

## 9. Product Completion Report

Final reports for UI versions must include:

- completion level for every requirement,
- requirement evidence matrix,
- exact canonical imports used,
- exact target component and section order,
- screenshots/evidence manifest,
- console and failed-request counts,
- browser/viewport matrix,
- runtime API result,
- unresolved `NOT_RUN` or `PENDING_USER_QA` items,
- whether Full Reset was required and the evidence supporting that decision.

A list of changed files, passing build, or passing static contracts is not sufficient evidence of product completion.

## 10. Immediate 0.24.34.4 Application

The first implementation governed by this standard is `0.24.34.4`.

Mandatory scope:

- diagnose and fix the workorder list/detail indefinite loading problem without assuming Full Reset,
- place the size summary under 디자인 → 첨부 파일 → 공장 전달사항 in the canonical right-side panel and remove the center duplicate,
- replace the screen-local size modal overlay with the canonical WAFL modal and shared controls,
- run the complete signup submission → system-admin queue → approval → Trial → workspace dev/test E2E,
- audit customer-facing copy in the actual localhost screens,
- generate localhost Playwright screenshots, locators, console/network evidence, and traces,
- report completion only when every mandatory item reaches `LEVEL_4_PRODUCT_VERIFIED`.

`0.24.35 Company-wide Export Execution` remains blocked until the mandatory 0.24.34.4 product evidence is complete.
