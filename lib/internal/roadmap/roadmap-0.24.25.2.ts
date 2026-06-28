import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_25_2: RoadmapVersionDetail = {
  version: "0.24.25.2",
  title: "/id-control Production QA Impersonation Allowlist",
  status: "implemented",
  userSummary: [
    "Allows explicitly enabled production QA impersonation for active system administrators only.",
    "Keeps /id-control listing read-only by default and requires separate server flags before switch/clear actions can run.",
  ],
  visibleChanges: [
    "The /id-control action buttons use the options API response as their source of truth.",
    "Production switch/restore remains disabled unless both WAFL_ENABLE_DEV_TEST_CONTEXT and WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT are set to 1.",
  ],
  expectedUi: [
    "Allowed active system administrators can switch into seeded test-company roles for Vercel production device QA.",
    "Disabled states show whether the base dev/test flag or the production impersonation flag is missing.",
  ],
  developmentPurpose: [
    "Support real-device Vercel QA without opening production impersonation broadly.",
    "Separate active system-admin allowlist, server-only flags, target allowlist, and audit logging.",
  ],
  developmentUiStructure: [
    "Reuse the existing /id-control page and DevTestConsoleClient.",
    "Keep target listing independent from action enablement.",
  ],
  scope: [
    "/id-control production QA impersonation action gate",
    "server-only production impersonation flag",
    "options/switch/clear route consistency",
    "overlay application guard",
    "contracts and release artifacts",
  ],
  outOfScope: [
    "0.24.26 Public Signup, Verification, Approval, and Trial",
    "general production customer impersonation",
    "DB migration",
    "DB/R2 mutation",
    "Cloudflare Worker changes",
  ],
  implementationPrinciples: [
    "Production impersonation is opt-in and server-only.",
    "NEXT_PUBLIC values are never used for security decisions.",
    "Targets must come from buildDevTestContextOptions and repository allowlisted seed/test data.",
    "Switch and clear keep audit logs and never log raw cookie payloads or secrets.",
  ],
  successConditions: [
    "Production with WAFL_ENABLE_DEV_TEST_CONTEXT off keeps listing visible and switch disabled.",
    "Production with WAFL_ENABLE_DEV_TEST_CONTEXT on but WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT off keeps switch disabled.",
    "Production with both flags on lets active system-admin switch to valid seed targets.",
    "Non-system-admin and invalid targets remain blocked.",
  ],
  failureConditions: [
    "Production impersonation becomes enabled by default.",
    "A public environment variable controls impersonation.",
    "A raw user id outside the target allowlist can be impersonated.",
    "Audit logging is removed from switch or restore.",
  ],
  cautions: [
    "Set WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT only for controlled Vercel QA windows.",
    "Disable the production impersonation flag after device QA if it is no longer needed.",
  ],
  stopConditions: [
    "A broader support impersonation policy is required.",
    "Production DB/R2 mutation is required.",
    "A schema change is required.",
  ],
  permissionImpact: "guarded",
  permissionNotes: [
    "Active system-admin DB allowlist remains required.",
    "The production server flag adds an execution gate; it does not change /id-control access for general users.",
  ],
  dbImpact: "read_only",
  dbImpactNotes: [
    "Only existing system-admin and seed target metadata are read.",
    "No DB mutation or migration is included.",
  ],
  r2Impact: "none",
  r2ImpactNotes: ["No R2 or Cloudflare Worker path is touched."],
  migrationRequired: false,
  migrationNotes: "DB migration none.",
  automaticTests: [
    "targeted ESLint",
    "tsc --noEmit",
    "authorization-runtime-boundary-contract",
    "dev-test-context-system-admin-contract",
    "system-admin-internal-access-contract",
    "internal-system-routes-contract",
    "unicode-encoding-contract",
    "next build",
    "git diff --check",
  ],
  manualTests: [
    "Vercel production with only WAFL_ENABLE_DEV_TEST_CONTEXT=1: target list visible, switch disabled.",
    "Vercel production with both WAFL_ENABLE_DEV_TEST_CONTEXT=1 and WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT=1: allowed system-admin can switch to a seed target.",
    "Restore returns to the original system-admin session.",
    "General customer user direct /id-control and API access remain blocked.",
    "PC Chrome, mobile Safari, and mobile Chrome button states and impersonation banner are visible.",
  ],
  expectedChangeAreas: [
    "lib/dev/testContext/config.ts",
    "lib/dev/testContext/service.ts",
    "app/api/dev/test-context/*",
    "app/dev/test-console/DevTestConsoleClient.tsx",
    "app/id-control/page.tsx",
    "tests/*system-admin*",
    "docs/*",
    "lib/internal/roadmap/*",
  ],
  recommendedCommitMessage: "0.24.25.2 id-control production QA impersonation gate",
  nextVersionBoundary: [
    "0.24.26 - Public Signup, Verification, Approval, and Trial",
    "Do not broaden production impersonation into general support access without a separate policy version.",
  ],
  completionConditions: [
    "implementation complete",
    "required verification PASS",
    "commit and push complete",
    "4. Newest contains only latest ZIP and matching repo-state",
  ],
  result: {
    completedSummary: [
      "Added WAFL_ENABLE_PRODUCTION_DEV_TEST_CONTEXT as the explicit production impersonation action flag.",
      "Changed /id-control buttons to use the options API action state instead of page props.",
      "Kept switch/clear audit logging and allowlisted target lookup boundaries.",
    ],
    commitHash: "pending until final Git commit",
    verificationResult:
      "PASS: targeted ESLint, tsc --noEmit, next build, authorization-runtime-boundary-contract, dev-test-context-system-admin-contract, system-admin-internal-access-contract, internal-system-routes-contract, workspace-member-session-guard-contract, unicode-encoding-contract, and git diff --check.",
    remainingIssues: ["Vercel production real-device QA must set the server env values and confirm behavior."],
    userConfirmationRequired: true,
    userConfirmationResult: "Manual PC/mobile production QA remains required after deployment.",
  },
};
