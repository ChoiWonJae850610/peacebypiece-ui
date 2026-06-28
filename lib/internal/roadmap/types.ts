export type RoadmapStatus =
  | "planned"
  | "in_progress"
  | "implemented"
  | "verification_pending"
  | "user_test_needed"
  | "user_decision_needed"
  | "completed"
  | "paused"
  | "canceled";

export type RoadmapImpact = "none" | "read_only" | "guarded" | "pending_decision";

export type RoadmapResult = {
  completedSummary: string[];
  commitHash: string;
  verificationResult: string;
  remainingIssues: string[];
  userConfirmationRequired: boolean;
  userConfirmationResult: string;
};

export type RoadmapPreparationRecord = {
  commitHash: string;
  summary: string[];
  verificationResult: string;
};

export type RoadmapVersionDetail = {
  version: string;
  status: RoadmapStatus;
  title: string;
  userSummary: string[];
  visibleChanges: string[];
  expectedUi: string[];
  developmentPurpose: string[];
  developmentUiStructure: string[];
  scope: string[];
  outOfScope: string[];
  implementationPrinciples: string[];
  successConditions: string[];
  failureConditions: string[];
  cautions: string[];
  stopConditions: string[];
  permissionImpact: RoadmapImpact;
  permissionNotes: string[];
  dbImpact: RoadmapImpact;
  dbImpactNotes: string[];
  r2Impact: RoadmapImpact;
  r2ImpactNotes: string[];
  migrationRequired: boolean;
  migrationNotes: string;
  automaticTests: string[];
  manualTests: string[];
  expectedChangeAreas: string[];
  futureDependencies?: string[];
  userDecisionsRequired?: string[];
  preparationHistory?: RoadmapPreparationRecord[];
  recommendedCommitMessage: string;
  nextVersionBoundary: string[];
  completionConditions: string[];
  result: RoadmapResult;
};

export type ProductizationRoadmapSummary = {
  appVersion: string;
  featureProgressPercent: number;
  productizationProgressPercent: number;
  currentWorkVersion: string;
  nextWorkVersion: string;
  canonicalPolicy: string;
  statusLabels: Record<RoadmapStatus, string>;
  impactLabels: Record<RoadmapImpact, string>;
  versions: RoadmapVersionDetail[];
};
