export const systemEn = {
  eyebrow: "PeaceByPiece System",
  title: "Super admin operations",
  description: "A base page for expanding customer invitations, tenant operations, and work-order recommendation rules from the super-admin perspective.",
  versionLabel: "Version",
  moveToWorkspace: "Go to workspace",
  cards: {
    companies: {
      title: "Company management",
      description: "Area for customer creation, admin invitations, and activation checks.",
      badge: "Next",
    },
    invites: {
      title: "Invitations and roles",
      description: "Area for tenant admin invitations, role assignments, and seat status.",
      badge: "Prepared",
    },
    categoryRules: {
      title: "Recommendation rules",
      description: "Area for managing title-keyword to category recommendation rules from the super-admin view.",
      badge: "High priority",
    },
  },
  companySection: {
    title: "Company preview",
    description: "Sample company list for direct super-admin management.",
    adminLabel: "Company admin",
  },
  ruleSection: {
    title: "Recommendation rule preview",
    description: "A base list that will later grow into a dedicated /system rule-management screen.",
    keywordsLabel: "Keywords",
    recommendationLabel: "Recommendation",
  },
} as const;
