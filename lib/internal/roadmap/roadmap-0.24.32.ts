import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_32: RoadmapVersionDetail = {
  version: "0.24.32",
  title: "PG Billing and Subscription Operations",
  status: "completed",
  userSummary: [
    "Connects the 0.24.31 PG-neutral billing foundation to additive persistence, guarded services, APIs, and simulator-safe operation paths.",
    "Keeps actual PG provider selection, merchant secrets, production payment, production email delivery, production export, and production deletion out of scope.",
  ],
  visibleChanges: [
    "Signup approval now requires persisted payment readiness before Trial provisioning.",
    "Company-admin and system-admin billing operation APIs expose quotes, cancel/reverse-cancel, simulator conversion, and deletion dry-run paths without raw PG or R2 exposure.",
    "Canonical PowerShell and verification profiles understand the billing operations migration/audit/simulator workflow.",
  ],
  expectedUi: [
    "Workspace subscription and system billing screens remain focused on billing/subscription sections, not a dashboard redesign.",
    "Real card entry and live PG payment remain unavailable until provider selection and credential approval.",
  ],
  developmentPurpose: [
    "Make 0.24.31 PARTIAL items executable through additive DB schema and idempotent services.",
    "Provide dev/test simulator integration seams for Trial conversion, retry, termination/recovery, export, notification outbox, and correction auto-reject.",
  ],
  developmentUiStructure: [
    "Reuse existing workspace subscription and system billing navigation.",
    "Expose operation APIs with server-side tenant and same-origin guards.",
  ],
  scope: [
    "APP_VERSION 0.24.32 and current-state/roadmap synchronization.",
    "Additive billing operations migration.",
    "Payment readiness persistence and signup approval gate.",
    "Subscription lifecycle, invoice, payment attempt, transaction, refund, retry, notification, export, termination, and recovery persistence foundation.",
    "Provider-neutral simulator operation services and company/system API routes.",
    "PowerShell billing audit/migration/simulator menu connections and verification profile.",
  ],
  outOfScope: [
    "Actual PG provider selection, SDK, merchant secret, billing key issuance, production webhook, real charge, or real refund.",
    "Actual external email delivery.",
    "Production company export, production deletion, broad R2 prefix deletion, or real customer billing backfill.",
    "Worker source change or deployment.",
    "0.24.33 or later feature implementation.",
  ],
  implementationPrinciples: [
    "Existing company_subscriptions snapshot remains backward compatible; canonical lifecycle state is additive in billing_subscription_states.",
    "Money remains integer KRW with VAT-included policy.",
    "Provider-neutral references and simulator evidence never store raw card data, raw provider payload, secrets, signed URLs, or raw R2 URLs.",
    "All mutation runners are dev/test guarded, idempotent, and expected to clean up synthetic fixtures.",
  ],
  successConditions: [
    "Additive schema contract verifies tables, tenant keys, idempotency, integer money, and sensitive field exclusion.",
    "Payment readiness, approval gate, subscription operations, retry, export, notification, correction, and guard contracts pass.",
    "Targeted ESLint, tsc --noEmit, next build, mutation audit, git diff checks, commit, push, and 4. Newest handoff complete.",
  ],
  failureConditions: [
    "Destructive migration or production apply is required.",
    "Actual PG credential/provider/email provider is required.",
    "Residual DB/R2 fixture state is nonzero after integration.",
    "Worker source change or deployment becomes necessary.",
  ],
  cautions: [
    "0.24.32 is PG-neutral operations persistence and simulator execution, not live payment processing.",
    "Dev/test migration execution must use approved fingerprint guards.",
    "Production export/deletion remain blocked.",
  ],
  stopConditions: [
    "Production DB/R2/Worker access is detected.",
    "Actual PG or email secret is needed.",
    "A destructive migration or real customer backfill is required.",
  ],
  permissionImpact: "guarded",
  permissionNotes: [
    "Company-admin billing operations are tenant scoped.",
    "System-admin billing operations require actual active system-admin session.",
    "Signup approval payment readiness is checked server-side.",
  ],
  dbImpact: "guarded",
  dbImpactNotes: [
    "Additive migration file is added for billing operations.",
    "Dev/test apply is allowed only through the approved migration guard.",
  ],
  r2Impact: "guarded",
  r2ImpactNotes: [
    "Company export foundation uses exact keys and no raw R2 URL exposure.",
    "No Worker source change is required.",
  ],
  migrationRequired: true,
  migrationNotes: "Additive migration: db/migrations/patch_0_24_32_billing_operations.sql.",
  automaticTests: [
    "billing operations schema contract",
    "billing operations service contract",
    "billing approval gate contract",
    "billing PowerShell menu contract",
    "roadmap 0.24.32 contract",
    "roadmap development contract",
    "targeted ESLint",
    "tsc --noEmit",
    "next build",
    "git diff --check",
  ],
  manualTests: [
    "Dev/test billing migration apply and simulator integration after approved fingerprint confirmation.",
    "Vercel QA for subscription billing operation copy and guarded action responses.",
  ],
  expectedChangeAreas: [
    "db/migrations/patch_0_24_32_billing_operations.sql",
    "lib/billing/*",
    "lib/signup/signupApplicationProvisioningRepository.ts",
    "app/api/admin/subscription/*",
    "app/api/system/billing/*",
    "tools/pipeline/*",
    "scripts/*billing*",
    "tests/*billing*",
  ],
  futureDependencies: [
    "Actual PG provider adapter, external scheduler deployment, email provider delivery, large export performance, and production deletion remain future approved work.",
  ],
  recommendedCommitMessage: "0.24.32 PG-neutral 결제 구독 운영 기반 완료",
  nextVersionBoundary: ["0.24.33 - next official roadmap item after 0.24.32 completion."],
  completionConditions: [
    "APP_VERSION 0.24.32",
    "Billing operations schema/service/API contracts pass.",
    "Actual PG integration false, actual email delivery false, Worker changed false.",
    "Commit/push complete and 4. Newest contains exactly latest ZIP and matching repo-state.",
  ],
  result: {
    completedSummary: [
      "Additive billing operations schema and provider-neutral persistence services were added.",
      "Signup approval now gates on persisted payment readiness.",
      "Company/system billing operation APIs and PowerShell verification workflow were connected.",
    ],
    commitHash: "recorded in final report after commit",
    verificationResult: "Pending final verification.",
    remainingIssues: [
      "Actual PG provider, production email delivery, production export/deletion, and live scheduler deployment remain deferred.",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "PENDING_DEV_TEST_MIGRATION_AND_SIMULATOR_QA",
  },
};
