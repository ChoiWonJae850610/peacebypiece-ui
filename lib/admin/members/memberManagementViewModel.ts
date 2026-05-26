import type {
  MemberJoinRequestLoadStatus,
  MemberJoinRequestPreview,
  MemberListLoadStatus,
  MemberListPreview,
  MemberManagementSummaryCard,
} from "@/lib/admin/members/memberManagementPresentation";

export type MemberManagementTab = "invite" | "members";

export type MemberManagementTabPreview = {
  id: MemberManagementTab;
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
  countLabel: string;
};

type AdminTranslate = (key: string, fallback: string) => string;

type MemberManagementSummaryViewModelInput = {
  baseSummaryCards: readonly MemberManagementSummaryCard[];
  members: readonly MemberListPreview[];
  joinRequests: readonly MemberJoinRequestPreview[];
  memberListLoadStatus: MemberListLoadStatus;
  joinRequestLoadStatus: MemberJoinRequestLoadStatus;
};

export type MemberDirectoryFilterState = {
  searchQuery: string;
  statusFilter: string;
  roleFilter: string;
};

type MemberDirectoryFilterableRow = {
  name: string;
  email: string;
  phone: string;
  status: string;
  roleId?: string | null;
};

type MemberManagementTabPreviewInput = {
  t: AdminTranslate;
  invitationCount: number;
  memberCount: number;
  joinRequestCount: number;
};

function getInactiveMemberCount(members: readonly MemberListPreview[]): number {
  return members.filter(
    (member) => member.status === "suspended" || member.status === "rejected",
  ).length;
}

function getPendingApprovalCount(
  members: readonly MemberListPreview[],
  joinRequests: readonly MemberJoinRequestPreview[],
): number {
  return (
    joinRequests.length +
    members.filter((member) => member.status === "pending").length
  );
}

export function buildMemberManagementSummaryViewModel({
  baseSummaryCards,
  members,
  joinRequests,
  memberListLoadStatus,
  joinRequestLoadStatus,
}: MemberManagementSummaryViewModelInput): readonly MemberManagementSummaryCard[] {
  const activeMemberCount = members.filter(
    (member) => member.status === "approved",
  ).length;
  const pendingApprovalCount = getPendingApprovalCount(members, joinRequests);
  const inactiveMemberCount = getInactiveMemberCount(members);
  const membersLoaded = memberListLoadStatus === "loaded";
  const approvalsLoaded = membersLoaded && joinRequestLoadStatus === "loaded";

  return baseSummaryCards.map((card) => {
    if (card.id === "activeMembers") {
      return {
        ...card,
        value: String(activeMemberCount),
        status: membersLoaded ? "ready" : card.status,
      };
    }

    if (card.id === "pendingApprovals") {
      return {
        ...card,
        value: String(pendingApprovalCount),
        status: approvalsLoaded
          ? pendingApprovalCount > 0
            ? "pending"
            : "ready"
          : card.status,
      };
    }

    if (card.id === "inactiveMembers") {
      return {
        ...card,
        value: String(inactiveMemberCount),
        status: membersLoaded
          ? inactiveMemberCount > 0
            ? "pending"
            : "ready"
          : card.status,
      };
    }

    return card;
  });
}

export function buildMemberManagementTabPreviews({
  t,
  invitationCount,
  memberCount,
  joinRequestCount,
}: MemberManagementTabPreviewInput): readonly MemberManagementTabPreview[] {
  return [
    {
      id: "invite",
      labelKey: "memberManagement.tabs.invite.label",
      fallbackLabel: "멤버 초대",
      descriptionKey: "memberManagement.tabs.invite.description",
      fallbackDescription: "이메일 또는 문자 초대를 생성합니다.",
      countLabel: t(
        "memberManagement.tabs.invite.count",
        "초대 {count}건",
      ).replace("{count}", String(invitationCount)),
    },
    {
      id: "members",
      labelKey: "memberManagement.tabs.members.label",
      fallbackLabel: "멤버 관리",
      descriptionKey: "memberManagement.tabs.members.description",
      fallbackDescription: "승인 대기와 전체 멤버를 한 목록에서 관리합니다.",
      countLabel: t(
        "memberManagement.tabs.members.count",
        "대상 {count}명",
      ).replace("{count}", String(memberCount + joinRequestCount)),
    },
  ] as const;
}

export function findMemberManagementTabPreview(
  tabs: readonly MemberManagementTabPreview[],
  activeTab: MemberManagementTab,
): MemberManagementTabPreview | null {
  return tabs.find((tab) => tab.id === activeTab) ?? null;
}

export function isMemberDirectoryLoading(
  memberListLoadStatus: MemberListLoadStatus,
  joinRequestLoadStatus: MemberJoinRequestLoadStatus,
): boolean {
  return memberListLoadStatus === "loading" || joinRequestLoadStatus === "loading";
}

export function filterMemberDirectoryRows<Row extends MemberDirectoryFilterableRow>(
  rows: readonly Row[],
  filters: MemberDirectoryFilterState,
): Row[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery =
      !query ||
      row.name.toLowerCase().includes(query) ||
      row.email.toLowerCase().includes(query) ||
      row.phone.toLowerCase().includes(query);
    const matchesStatus =
      filters.statusFilter === "all" || row.status === filters.statusFilter;
    const matchesRole =
      filters.roleFilter === "all" ||
      (filters.roleFilter === "none" && !row.roleId) ||
      row.roleId === filters.roleFilter;

    return matchesQuery && matchesStatus && matchesRole;
  });
}
