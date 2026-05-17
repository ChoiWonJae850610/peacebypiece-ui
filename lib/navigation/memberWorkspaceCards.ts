import { hasSomeMemberPermission, type MemberPermissionCode } from "@/lib/permissions";

export const MEMBER_WORKSPACE_CARD_STATUS = {
  available: "available",
  planned: "planned",
} as const;

export type MemberWorkspaceCardStatus =
  (typeof MEMBER_WORKSPACE_CARD_STATUS)[keyof typeof MEMBER_WORKSPACE_CARD_STATUS];

export type MemberWorkspaceCardId = "workorder" | "partners" | "standards";

export type MemberWorkspaceCard = {
  id: MemberWorkspaceCardId;
  href: string;
  status: MemberWorkspaceCardStatus;
  section: "work" | "settings";
  requiredPermissions: readonly MemberPermissionCode[];
};

export const MEMBER_WORKSPACE_CARDS: readonly MemberWorkspaceCard[] = [
  {
    id: "workorder",
    href: "/worker",
    status: MEMBER_WORKSPACE_CARD_STATUS.available,
    section: "work",
    requiredPermissions: ["workorder.read", "workorder.create"],
  },
  {
    id: "partners",
    href: "/workspace/partners",
    status: MEMBER_WORKSPACE_CARD_STATUS.planned,
    section: "work",
    requiredPermissions: ["partner.read", "partner.create", "partner.update", "partner.delete"],
  },
  {
    id: "standards",
    href: "/workspace/standards",
    status: MEMBER_WORKSPACE_CARD_STATUS.planned,
    section: "work",
    requiredPermissions: ["standards.read", "standards.create", "standards.update", "standards.delete"],
  },
] as const;

export const MEMBER_WORKSPACE_CARD_SECTIONS = ["work", "settings"] as const;

export type MemberWorkspaceCardSection =
  (typeof MEMBER_WORKSPACE_CARD_SECTIONS)[number];

export type MemberWorkspaceCardVisibilityInput = {
  permissionCodes: readonly MemberPermissionCode[];
};

export function getVisibleMemberWorkspaceCards(
  input: MemberWorkspaceCardVisibilityInput,
): MemberWorkspaceCard[] {
  return MEMBER_WORKSPACE_CARDS.filter((card) =>
    hasSomeMemberPermission(
      { permissionCodes: input.permissionCodes },
      card.requiredPermissions,
    ),
  );
}

export function getMemberWorkspaceCardsBySection(
  section: MemberWorkspaceCardSection,
  input: MemberWorkspaceCardVisibilityInput,
): MemberWorkspaceCard[] {
  return getVisibleMemberWorkspaceCards(input).filter((card) => card.section === section);
}
