import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_2: RoadmapVersionDetail = {
  version: "0.24.34.2",
  title: "Customer-facing Product UX, System Catalog, Size Editing, and Workorder PDF Integration Cleanup",
  status: "completed",
  userSummary: [
    "Cleans public signup, customer settings, system catalog, workorder size editing, and workorder PDF output into product-facing language.",
    "Keeps the next official Company-wide Export work reserved for 0.24.35.",
  ],
  visibleChanges: [
    "Public signup now presents plan cards, terms viewers, automatic draft creation on certificate selection, and a single submit action.",
    "Workorder size editing is summarized in the right panel and edited in a shared modal with inch whole-number plus 1/8 fraction controls.",
    "Workorder PDF output is a single action that automatically creates an incomplete or final PDF based on completeness.",
  ],
  expectedUi: [
    "Customer screens avoid internal implementation terms and raw error codes.",
    "System catalog exposes production categories, size sets, POMs, and default measurement chart concepts in one canonical management entry.",
    "Generated workorder PDFs appear with safe Korean filenames and customer-safe missing-object fallback.",
  ],
  developmentPurpose: [
    "Turn the 0.24.34 size/POM/PDF foundation into a cleaner customer-facing product path without starting Export.",
    "Remove UI language and action duplication that made completed foundations feel like internal tooling.",
  ],
  developmentUiStructure: [
    "Reuse existing signup, company file, system catalog, workorder size, generated document, and R2 viewer routes.",
    "Avoid new schema unless an additive dev/test migration is strictly required.",
  ],
  scope: [
    "APP_VERSION 0.24.34.2 and roadmap/current-state synchronization.",
    "Public signup customer language cleanup, plan cards, terms viewer, automatic draft on certificate selection, and single submit CTA.",
    "Customer company file copy cleanup and duplicate technical metadata reduction.",
    "System catalog 기준관리 navigation/content cleanup for product categories, size sets, POMs, and default measurement chart discovery.",
    "Workorder size right-panel summary and modal editing with Korean POM labels and inch 1/8 input.",
    "Single workorder PDF output action, automatic incomplete/final decision, safer filename, generated document link, and missing-object fallback.",
    "Contracts, targeted ESLint, typecheck, build, mutation audit, commit/push, and final handoff.",
  ],
  outOfScope: [
    "Company-wide Export execution.",
    "Termination/recovery/deletion scheduler execution.",
    "Actual PG, actual email provider, production migration, production PDF test, production data mutation, or unapproved Worker deploy.",
    "Broad public marketing site redesign or /workers redesign.",
  ],
  implementationPrinciples: [
    "Confirmed owner policy is not re-asked.",
    "Customer-facing copy must explain state and next action without exposing DB, R2, Worker, provisioning, fake readiness, payment readiness, or raw policy codes.",
    "Existing workorder PDF generation and private R2 lifecycle are reused; failure must not expose raw object keys or signed URLs.",
  ],
  successConditions: [
    "Customer-language contract passes for public signup, company files, system catalog, size modal, and PDF error states.",
    "Workorder print action contract verifies one print button, auto kind selection, safe filename, and missing-object page.",
    "Required contracts, targeted ESLint, tsc --noEmit, next build, mutation audit, and git diff checks pass.",
  ],
  failureConditions: [
    "The patch requires production DB/R2/Worker access, destructive migration, actual customer backfill, actual PG/email secrets, or 0.24.35 Export scope.",
    "PDF integration requires a Worker source change/deploy that is not separately approved.",
  ],
  cautions: [
    "Rendered PDF visual quality still needs human review on real devices before launch.",
    "This patch may improve code-level PDF flow but must not claim production PDF QA or Company-wide Export completion.",
  ],
  stopConditions: [
    "Production mutation is detected.",
    "Residual dev/test DB/R2 fixtures are not 0 after any integration run.",
    "A second bounded PDF or browser integration run fails after an in-scope fix.",
    "0.24.35 Company-wide Export implementation becomes necessary.",
  ],
  permissionImpact: "guarded",
  permissionNotes: [
    "Signup applicant, company member/admin, and system-admin boundaries remain unchanged.",
    "Workorder PDF routes remain tenant-scoped and permission-checked server-side.",
  ],
  dbImpact: "guarded",
  dbImpactNotes: [
    "No new migration is expected for this cleanup.",
    "Existing 0.24.34 additive schema remains the size/POM/PDF persistence foundation.",
  ],
  r2Impact: "guarded",
  r2ImpactNotes: [
    "The app reuses existing private R2 PDF paths.",
    "No Worker source change or deploy is expected.",
  ],
  migrationRequired: false,
  migrationNotes: "No new DB migration for 0.24.34.2 unless later validation proves an additive metadata gap.",
  automaticTests: [
    "customer product UX language contract",
    "workorder PDF unified action contract",
    "roadmap 0.24.34.2 contract",
    "workorder size spec contract",
    "workorder incomplete/final PDF contract",
    "workorder PDF viewer contract",
    "targeted ESLint",
    "tsc --noEmit",
    "next build",
    "mutation audit",
    "git diff checks",
  ],
  manualTests: [
    "Actual rendered PDF visual inspection.",
    "PC/iPad/mobile signup and size editing QA.",
    "Actual R2/PDF download/share QA if a live dev/test integration is run.",
  ],
  expectedChangeAreas: [
    "components/signup/SignupApplicationDashboard.tsx",
    "components/admin/settings/AdminCompanyFilesPanel.tsx",
    "app/(system)/system/catalog/page.tsx",
    "components/workorder/detail/WorkOrderSizeSpecPanel.tsx",
    "app/api/workorders/[workOrderId]/generated/workorder-pdf/*",
    "lib/workorder/generatedDocuments.ts",
    "lib/internal/roadmap/*",
    "docs/*",
    "tests/*",
    "tools/pipeline/*",
  ],
  futureDependencies: [
    "0.24.35 Company-wide Export Execution consumes current workorder PDFs and attachments.",
  ],
  recommendedCommitMessage: "0.24.34.2 고객 화면과 작업지시서 PDF 제품 UX 정리",
  nextVersionBoundary: [
    "0.24.35 - Company-wide Export Execution.",
    "Do not start Export in this patch.",
  ],
  completionConditions: [
    "APP_VERSION 0.24.34.2 and roadmap/current-state are synchronized.",
    "Public signup, company files, system catalog, size modal, and workorder PDF UX cleanup is complete.",
    "Verification, commit, push, and 4. Newest handoff complete.",
  ],
  result: {
    completedSummary: [
      "Public signup copy, plan selection, terms viewing, certificate selection, and submit flow were cleaned up.",
      "System catalog and company file UI language were made more customer/product-facing.",
      "Workorder size editing moved to a modal flow and workorder PDF output became a single automatic action.",
    ],
    commitHash: "pending final commit",
    verificationResult: "pending final verification",
    remainingIssues: [
      "Rendered PDF visual QA and real-device browser QA remain manual unless explicitly run.",
    ],
    userConfirmationRequired: false,
    userConfirmationResult: "Automatic validation covers code and contract paths; human visual QA remains separate.",
  },
};
