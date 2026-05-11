export const MEMBER_WORKSPACE_CARD_STATUS = {
  available: "available",
  planned: "planned",
} as const;

export type MemberWorkspaceCardStatus =
  (typeof MEMBER_WORKSPACE_CARD_STATUS)[keyof typeof MEMBER_WORKSPACE_CARD_STATUS];

export type MemberWorkspaceCardId =
  | "workorder"
  | "personalSettings";

export type MemberWorkspaceCard = {
  id: MemberWorkspaceCardId;
  href: string;
  status: MemberWorkspaceCardStatus;
  section: "work" | "settings";
};

export const MEMBER_WORKSPACE_CARDS: readonly MemberWorkspaceCard[] = [
  {
    id: "workorder",
    href: "/worker",
    status: MEMBER_WORKSPACE_CARD_STATUS.available,
    section: "work",
  },
  {
    id: "personalSettings",
    href: "/me/settings",
    status: MEMBER_WORKSPACE_CARD_STATUS.available,
    section: "settings",
  },
] as const;

export const MEMBER_WORKSPACE_CARD_SECTIONS = ["work", "settings"] as const;

export type MemberWorkspaceCardSection =
  (typeof MEMBER_WORKSPACE_CARD_SECTIONS)[number];

export function getMemberWorkspaceCardsBySection(
  section: MemberWorkspaceCardSection,
): MemberWorkspaceCard[] {
  return MEMBER_WORKSPACE_CARDS.filter((card) => card.section === section);
}
