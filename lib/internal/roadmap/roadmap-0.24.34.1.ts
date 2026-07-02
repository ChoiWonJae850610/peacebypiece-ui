import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_1: RoadmapVersionDetail = {
  version: "0.24.34.1",
  title: "Public Signup First-Draft Flow Fix and Repo-state Metadata Correction",
  status: "completed",
  userSummary: [
    "Fixes the public Trial signup first-draft loop after Google OAuth when the applicant session exists but no signup application row has been created yet.",
    "Corrects 0.24.34 repo-state metadata so approved dev/test migration and audit results are recorded explicitly instead of not provided.",
  ],
  visibleChanges: [
    "Authenticated signup applicants without an application now see the first-draft company form instead of being sent back to the Google signup CTA.",
    "The certificate section explains that company information must be saved before certificate upload is enabled.",
  ],
  expectedUi: [
    "Applicant session present and application missing shows the editable draft form.",
    "Certificate status failure is isolated to the certificate section and does not clear applicant/application state.",
    "Consent status failure is isolated to the consent section and does not clear applicant/application state.",
  ],
  developmentPurpose: [
    "Remove the real first-entry loop in the public signup path.",
    "Keep 0.24.34 workorder size/PDF implementation intact while correcting release metadata.",
  ],
  developmentUiStructure: [
    "Reuse the existing SignupApplicationDashboard and signup application APIs.",
    "Add only the minimum route/client guards needed for first-draft state separation.",
  ],
  scope: [
    "APP_VERSION 0.24.34.1 and roadmap/current-state synchronization.",
    "Certificate GET without application returns a safe empty certificate state.",
    "Signup dashboard separates applicant/application, consent, and certificate loading errors.",
    "First draft save creates the application and enables certificate upload after reload.",
    "Repo-state metadata publication records the 0.24.34 migration/audit results explicitly.",
    "Contracts, targeted ESLint, typecheck, build, mutation audit, commit/push, and handoff.",
  ],
  outOfScope: [
    "0.24.35 Company-wide Export implementation.",
    "Workorder size/PDF feature expansion.",
    "Actual PG, actual email, Worker source change/deploy, production migration, or production mutation.",
  ],
  implementationPrinciples: [
    "Confirmed public signup policy is not re-asked.",
    "Application null is a normal first-draft state, not a fatal signup error.",
    "Certificate upload mutations still require a saved application.",
    "No raw token, cookie, secret, signed URL, or production endpoint is logged or exposed.",
  ],
  successConditions: [
    "Applicant-without-application contract passes.",
    "Certificate GET without application returns ok true and certificate null.",
    "Certificate/consent error isolation contracts pass.",
    "Draft is excluded from system-admin queue and submitted applications remain included.",
    "0.24.34 metadata correction contract passes.",
    "Required build and verification pass.",
  ],
  failureConditions: [
    "Production DB/R2/Worker access is detected.",
    "A new migration, Worker deployment, actual OAuth secret change, actual PG/email, or 0.24.35 scope becomes required.",
    "Residual DB/R2 fixtures cannot be cleaned to 0 in an integration run.",
  ],
  cautions: [
    "Actual Google OAuth round trip remains manual QA unless a user-provided live session is available.",
    "Do not treat first-draft absence of application as a queue-visible signup request.",
  ],
  stopConditions: [
    "Production mutation is required.",
    "A destructive or new additive migration is required.",
    "The same Playwright/integration stage fails twice after an in-scope fix.",
    "Worker change/deploy or 0.24.35 Export implementation becomes necessary.",
  ],
  permissionImpact: "guarded",
  permissionNotes: [
    "Public signup applicant routes remain bound to the applicant session.",
    "System-admin signup queue remains actual system-admin only.",
  ],
  dbImpact: "guarded",
  dbImpactNotes: [
    "No new migration is expected.",
    "Dev/test fixture integration may create synthetic rows only when explicitly run and must clean them to 0.",
  ],
  r2Impact: "guarded",
  r2ImpactNotes: [
    "No Worker change or deployment.",
    "No R2 mutation is required for this patch unless an existing dev/test certificate regression is explicitly run.",
  ],
  migrationRequired: false,
  migrationNotes: "No DB migration for 0.24.34.1.",
  automaticTests: [
    "public signup first-draft contract",
    "certificate no-application contract",
    "dashboard isolated error handling contract",
    "0.24.34 metadata publication contract",
    "roadmap 0.24.34.1 contract",
    "targeted ESLint",
    "tsc --noEmit",
    "next build",
    "mutation audit",
    "git diff checks",
  ],
  manualTests: [
    "Actual Google OAuth round trip into /pending?type=signup.",
    "Actual iPhone/iPad OAuth and file picker behavior.",
    "Actual Vercel session refresh.",
  ],
  expectedChangeAreas: [
    "components/signup/SignupApplicationDashboard.tsx",
    "app/api/signup/application/certificate/route.ts",
    "tools/pipeline/*",
    "lib/internal/roadmap/*",
    "docs/*",
    "tests/*signup*",
    "tests/*metadata*",
  ],
  futureDependencies: [
    "0.24.35 Company-wide Export Execution remains the next official version.",
  ],
  recommendedCommitMessage: "0.24.34.1 공개가입 최초 신청서 진입 오류와 repo-state 메타데이터 보정",
  nextVersionBoundary: [
    "0.24.35 - Company-wide Export Execution.",
    "Do not start Export in this patch.",
  ],
  completionConditions: [
    "APP_VERSION 0.24.34.1 and roadmap/current-state are synchronized.",
    "First-draft signup loop is fixed.",
    "Repo-state metadata no longer reports 0.24.34 migration/audit as not provided.",
    "Verification, commit, push, and 4. Newest handoff complete.",
  ],
  result: {
    completedSummary: [
      "Certificate GET without a saved application now returns an empty certificate state.",
      "Signup dashboard now preserves applicant/application state when consent or certificate loading fails.",
      "Repo-state metadata publication was corrected for workorder-size-pdf migration/audit evidence.",
    ],
    commitHash: "pending final commit",
    verificationResult: "pending final verification",
    remainingIssues: [
      "Actual Google OAuth and real-device Safari/file-picker QA remain manual.",
    ],
    userConfirmationRequired: false,
    userConfirmationResult: "Automatic validation covers the code path; live OAuth remains manual QA.",
  },
};
