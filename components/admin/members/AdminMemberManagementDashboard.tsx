"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMemberInviteRoleOptions,
  toMemberJoinRequestPreviews,
  toMemberListPreviews,
  getMemberManagementSummaryCards,
  getAssignableMemberRolePreviews,
  type MemberJoinRequestLoadStatus,
  type MemberListLoadStatus,
  type MemberManagementStatus,
} from "@/lib/admin/members/memberManagementPresentation";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { AdminCompanyMemberRecord } from "@/lib/admin/members/memberTypes";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  getCompanyAdminMemberRoleTemplateCode,
  getDefaultAssignableMemberRoleTemplateCode,
  getMemberRoleTemplatePermissions,
  hasEveryMemberPermission,
  toAssignableMemberRoleTemplateCode,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";
import {
  countVisibleSimplePermissionControls,
  normalizeSimplePermissionCodes,
  toggleSimplePermissionControl,
  type SimplePermissionControl,
} from "@/lib/admin/members/memberSimplePermissionControls";
import AdminPanelSection from "@/components/admin/common/AdminPanelSection";
import AdminSegmentedTabs from "@/components/admin/common/AdminSegmentedTabs";
import AdminSummaryMetricCards from "@/components/admin/common/AdminSummaryMetricCards";
import { AdminSection } from "@/components/admin/common/AdminSection";
import {
  AdminModal,
  AdminModalFooterActions,
} from "@/components/admin/layout/AdminModal";
import AdminMemberPermissionDetailBody from "@/components/admin/members/AdminMemberPermissionDetailBody";
import AdminMemberInviteBuilderPanel from "@/components/admin/members/AdminMemberInviteBuilderPanel";
import AdminMemberDirectoryControls from "@/components/admin/members/AdminMemberDirectoryControls";
import {
  buildMemberInvitationTableColumns,
  type PendingMemberInvitationRow,
} from "@/components/admin/members/AdminMemberInvitationTableColumns";
import {
  buildMemberDirectoryColumns,
  type JoinRequestReviewAction,
  type MemberDirectoryRow,
  type MemberDirectoryStatusFilter,
} from "@/components/admin/members/AdminMemberDirectoryTableColumns";
import {
  AdminStatusBadge,
  type AdminStatusBadgeTone,
} from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
import ToastMessage from "@/components/common/ToastMessage";

function getStatusTone(status: MemberManagementStatus): AdminStatusBadgeTone {
  if (status === "ready") return "success";
  if (status === "pending") return "warning";
  return "neutral";
}

type JoinRequestListResponse = {
  ok?: boolean;
  joinRequests?: JoinRequestRecord[];
  error?: string;
};

type JoinRequestReviewResponse = {
  ok?: boolean;
  action?: "approved" | "rejected";
  error?: string;
};

type MemberListResponse = {
  ok?: boolean;
  members?: AdminCompanyMemberRecord[];
  error?: string;
};

type MemberUpdateResponse = {
  ok?: boolean;
  member?: AdminCompanyMemberRecord;
  error?: string;
};

function getEmailMatchTone(
  status: "matched" | "mismatched" | "unknown",
): AdminStatusBadgeTone {
  if (status === "matched") return "success";
  if (status === "mismatched") return "warning";
  return "neutral";
}


type MemberInvitationListResponse = {
  ok?: boolean;
  invitations?: InvitationRecord[];
  error?: string;
  message?: string;
};


type MemberDetailDraft = {
  displayName: string;
  phone: string;
  status: AdminCompanyMemberRecord["status"];
  roleTemplateCode: MemberPermissionRoleTemplateCode;
  permissionCodes: MemberPermissionCode[];
};

type MemberStatusOption = {
  value: AdminCompanyMemberRecord["status"];
  labelKey: string;
  fallbackLabel: string;
};

const EDITABLE_MEMBER_STATUS_OPTIONS: readonly MemberStatusOption[] = [
  {
    value: "approved",
    labelKey: "memberManagement.memberDirectory.statuses.approved",
    fallbackLabel: "사용 중",
  },
  {
    value: "suspended",
    labelKey: "memberManagement.memberDirectory.statuses.suspended",
    fallbackLabel: "비활성",
  },
] as const;

function getMemberDetailStatusOptions(
  currentStatus: AdminCompanyMemberRecord["status"] | null | undefined,
): readonly MemberStatusOption[] {
  if (
    !currentStatus ||
    EDITABLE_MEMBER_STATUS_OPTIONS.some((option) => option.value === currentStatus)
  ) {
    return EDITABLE_MEMBER_STATUS_OPTIONS;
  }

  return [
    {
      value: currentStatus,
      labelKey: `memberManagement.memberDirectory.statuses.${currentStatus}`,
      fallbackLabel: currentStatus,
    },
    ...EDITABLE_MEMBER_STATUS_OPTIONS,
  ];
}


function resolveMemberInvitationErrorMessage(
  t: ReturnType<typeof useAdminTranslation>,
  errorCode: string | null | undefined,
  fallbackLabel: string,
): string {
  const normalized = String(errorCode ?? "").trim().toUpperCase();

  if (normalized === "INVITATION_ROUTE_ERROR") {
    return t(
      "memberManagement.inviteBuilder.errors.route",
      "멤버 초대 링크를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (normalized === "INVITATION_POLICY_REJECTED") {
    return t(
      "memberManagement.inviteBuilder.errors.policy",
      "멤버 초대 조건을 확인할 수 없습니다. 회사 관리자 권한으로 다시 시도해 주세요.",
    );
  }

  if (normalized === "INVITATION_NOT_FOUND") {
    return t(
      "memberManagement.inviteBuilder.errors.notFound",
      "해당 초대 링크를 찾을 수 없습니다.",
    );
  }

  if (normalized === "INVITATIONS_LOAD_FAILED") {
    return t(
      "memberManagement.inviteBuilder.errors.load",
      "초대 링크 목록을 불러오지 못했습니다.",
    );
  }

  if (normalized === "INVITATION_CREATE_FAILED") {
    return t(
      "memberManagement.inviteBuilder.errors.create",
      "초대 링크를 생성하지 못했습니다.",
    );
  }

  if (normalized === "INVITATION_REVOKE_FAILED") {
    return t(
      "memberManagement.inviteBuilder.errors.revoke",
      "초대 링크를 취소하지 못했습니다.",
    );
  }

  return fallbackLabel;
}


function buildMemberDetailDraft(member: AdminCompanyMemberRecord): MemberDetailDraft {
  return {
    displayName: member.displayName?.trim() || member.name,
    phone: member.phone?.trim() || "",
    status: member.status,
    roleTemplateCode: toAssignableMemberRoleTemplateCode(member.roleTemplateCode),
    permissionCodes: normalizeSimplePermissionCodes(member.permissionCodes),
  };
}


function getMemberDetailErrorCode(errorCode: string): string {
  if (errorCode.includes("could not determine data type")) {
    return "MEMBER_UPDATE_FAILED";
  }
  return errorCode;
}

const MEMBER_INVITE_PANEL_HEIGHT_CLASS = "h-[452px] min-h-[452px]";
const MEMBER_INVITE_PANEL_CONTENT_CLASS = "flex min-h-0 flex-1 flex-col pt-4";
const MEMBER_INVITATION_TABLE_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col pt-4";
const MEMBER_INVITATION_TABLE_VIEWPORT_CLASS = "min-h-0 flex-1";

type MemberManagementTab = "invite" | "members";

type MemberManagementTabPreview = {
  id: MemberManagementTab;
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
  countLabel: string;
};

function getLoadStatusLabelKey(
  status: MemberJoinRequestLoadStatus | MemberListLoadStatus,
): string {
  if (status === "loaded") return "dbConnected";
  if (status === "loading") return "dbLoading";
  if (status === "failed") return "dbFailed";
  return "dbPending";
}

function getAbsoluteInviteUrl(inviteUrl: string): string {
  if (typeof window === "undefined") return inviteUrl;
  return new URL(inviteUrl, window.location.origin).toString();
}

function toPendingMemberInvitationRow(
  invitation: InvitationRecord,
): PendingMemberInvitationRow {
  return {
    id: invitation.id,
    inviteUrl: getAbsoluteInviteUrl(
      invitation.inviteUrlPath ?? `/invite/member/${invitation.id}`,
    ),
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
    status: invitation.status,
  };
}

function resolveExpiresAt(expiresInDays: string): string {
  const days = Number.parseInt(expiresInDays.replace("d", ""), 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) ? days : 7));
  return expiresAt.toISOString();
}

export default function AdminMemberManagementDashboard() {
  const t = useAdminTranslation();
  const baseSummaryCards = getMemberManagementSummaryCards();
  const manageableRoles = getAssignableMemberRolePreviews();
  const currentPermissionCodes = getMemberRoleTemplatePermissions(
    getCompanyAdminMemberRoleTemplateCode(),
  );
  const inviteRoleOptions = getMemberInviteRoleOptions();
  const [activeTab, setActiveTab] = useState<MemberManagementTab>("invite");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] =
    useState<MemberDirectoryStatusFilter>("all");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [expiresInDays, setExpiresInDays] = useState("7d");
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingMemberInvitationRow[]
  >([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [memberRecords, setMemberRecords] = useState<
    AdminCompanyMemberRecord[]
  >([]);
  const [memberListLoadStatus, setMemberListLoadStatus] =
    useState<MemberListLoadStatus>("idle");
  const [memberListLoadError, setMemberListLoadError] = useState<string | null>(
    null,
  );
  const [joinRequestRecords, setJoinRequestRecords] = useState<
    JoinRequestRecord[]
  >([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] =
    useState<MemberJoinRequestLoadStatus>("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<
    string | null
  >(null);
  const [reviewingJoinRequestId, setReviewingJoinRequestId] = useState<
    string | null
  >(null);
  const [joinRequestRoleDrafts, setJoinRequestRoleDrafts] = useState<Record<string, MemberPermissionRoleTemplateCode>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDetailDraft, setMemberDetailDraft] =
    useState<MemberDetailDraft | null>(null);
  const [memberDetailError, setMemberDetailError] = useState<string | null>(
    null,
  );
  const [isSavingMemberDetail, setIsSavingMemberDetail] = useState(false);
  const canCreateInvite = hasEveryMemberPermission(
    { permissionCodes: currentPermissionCodes },
    ["member.invite"],
  );

  const members = useMemo(
    () => toMemberListPreviews(memberRecords),
    [memberRecords],
  );
  const invitations = pendingInvitations;
  const invitationTableColumns = useMemo(
    () =>
      buildMemberInvitationTableColumns({
        t,
        revokingInviteId,
        onCopyInviteLink: handleCopyInviteLink,
        onCancelInvitation: handleCancelPendingInvitation,
      }),
    [revokingInviteId, t],
  );
  const joinRequests = useMemo(
    () => toMemberJoinRequestPreviews(joinRequestRecords),
    [joinRequestRecords],
  );

  const memberDirectoryRows = useMemo<MemberDirectoryRow[]>(() => {
    const pendingRows: MemberDirectoryRow[] = joinRequests.map((request) => ({
      id: `join-${request.id}`,
      source: "joinRequest",
      name: request.applicantName,
      email: request.applicantEmail || "-",
      phone: request.applicantPhoneLabel || "-",
      roleId: request.requestedRoleId,
      status: "pending",
      requestedAt: request.requestedAtLabel,
      approvedAt: "-",
      lastActiveAt: "-",
      joinRequest: request,
    }));

    const memberRows: MemberDirectoryRow[] = members.map((member) => ({
      id: `member-${member.id}`,
      source: "member",
      name: member.name,
      email: member.email || "-",
      phone: member.phone || "-",
      roleId: member.roleId,
      status: member.status,
      requestedAt: "-",
      approvedAt: member.approvedAtLabel,
      lastActiveAt: member.lastActiveLabel,
      member,
      memberRecord: memberRecords.find((record) => record.id === member.id),
    }));

    return [...pendingRows, ...memberRows];
  }, [joinRequests, memberRecords, members]);

  const filteredMemberDirectoryRows = useMemo(() => {
    const query = memberSearchQuery.trim().toLowerCase();
    return memberDirectoryRows.filter((row) => {
      const matchesQuery =
        !query ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query) ||
        row.phone.toLowerCase().includes(query);
      const matchesStatus =
        memberStatusFilter === "all" || row.status === memberStatusFilter;
      const matchesRole =
        memberRoleFilter === "all" ||
        (memberRoleFilter === "none" && !row.roleId) ||
        row.roleId === memberRoleFilter;
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [memberDirectoryRows, memberRoleFilter, memberSearchQuery, memberStatusFilter]);

  const selectedMemberRecord = useMemo(
    () =>
      selectedMemberId
        ? memberRecords.find((member) => member.id === selectedMemberId) ?? null
        : null,
    [memberRecords, selectedMemberId],
  );
  const selectedMemberRolePreview = useMemo(
    () =>
      manageableRoles.find((role) => role.id === memberDetailDraft?.roleTemplateCode) ??
      null,
    [manageableRoles, memberDetailDraft?.roleTemplateCode],
  );
  const selectedMemberStatusOptions = useMemo(
    () => getMemberDetailStatusOptions(selectedMemberRecord?.status),
    [selectedMemberRecord?.status],
  );
  const selectedMemberPermissionCount = memberDetailDraft
    ? countVisibleSimplePermissionControls(memberDetailDraft.permissionCodes)
    : 0;

  const memberDirectoryColumns = useMemo(
    () =>
      buildMemberDirectoryColumns({
        t,
        inviteRoleOptions,
        reviewingJoinRequestId,
        getJoinRequestReviewRoleId,
        onRoleDraftChange: (requestId, roleTemplateCode) =>
          setJoinRequestRoleDrafts((previous) => ({
            ...previous,
            [requestId]: roleTemplateCode,
          })),
        onReviewJoinRequest: (request, action) =>
          void handleReviewJoinRequest(request, action),
      }),
    [inviteRoleOptions, reviewingJoinRequestId, t, joinRequestRoleDrafts],
  );
  const summaryCards = useMemo(() => {
    const activeMemberCount = members.filter(
      (member) => member.status === "approved",
    ).length;
    const pendingApprovalCount =
      joinRequests.length +
      members.filter((member) => member.status === "pending").length;
    const inactiveMemberCount = members.filter(
      (member) => member.status === "suspended" || member.status === "rejected",
    ).length;
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
  }, [
    baseSummaryCards,
    joinRequestLoadStatus,
    joinRequests.length,
    memberListLoadStatus,
    members,
  ]);
  const canSubmitInvite = canCreateInvite && !isCreatingInvite;
  const tabPreviews: MemberManagementTabPreview[] = [
    {
      id: "invite",
      labelKey: "memberManagement.tabs.invite.label",
      fallbackLabel: "멤버 초대",
      descriptionKey: "memberManagement.tabs.invite.description",
      fallbackDescription: "이메일 또는 문자 초대를 생성합니다.",
      countLabel: t(
        "memberManagement.tabs.invite.count",
        "초대 {count}건",
      ).replace("{count}", String(invitations.length)),
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
      ).replace("{count}", String(members.length + joinRequests.length)),
    },
  ];

  async function loadMemberInvitations() {
    try {
      const response = await fetch("/api/invitations?scope=company_to_member", {
        cache: "no-store",
      });
      const payload = (await response.json()) as MemberInvitationListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? payload.error ?? "INVITATIONS_LOAD_FAILED");
      }

      setPendingInvitations(
        (payload.invitations ?? []).map(toPendingMemberInvitationRow),
      );
    } catch (error) {
      setInviteError(
        resolveMemberInvitationErrorMessage(
          t,
          error instanceof Error ? error.message : "INVITATIONS_LOAD_FAILED",
          t(
            "memberManagement.inviteBuilder.errors.load",
            "초대 링크 목록을 불러오지 못했습니다.",
          ),
        ),
      );
      setPendingInvitations([]);
    }
  }

  async function loadCompanyMembers() {
    setMemberListLoadStatus("loading");
    setMemberListLoadError(null);

    try {
      const response = await fetch(
        "/api/admin/members?status=all&limit=50",
        {
          cache: "no-store",
          headers: {
            "x-peacebypiece-permissions":
              "member.read,member.permission.update",
          },
        },
      );
      const payload = (await response.json()) as MemberListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "MEMBERS_LOAD_FAILED");
      }

      const nextMembers = payload.members ?? [];
      setMemberRecords(nextMembers);
      setMemberListLoadStatus("loaded");
    } catch (error) {
      setMemberRecords([]);
      setMemberListLoadStatus("failed");
      setMemberListLoadError(
        error instanceof Error ? error.message : "MEMBERS_LOAD_FAILED",
      );
    }
  }

  async function loadMemberJoinRequests() {
    setJoinRequestLoadStatus("loading");
    setJoinRequestLoadError(null);

    try {
      const response = await fetch(
        "/api/invitations/join-requests?requestType=member&status=pending&invitationScope=company_to_member&limit=50",
        { cache: "no-store" },
      );
      const payload = (await response.json()) as JoinRequestListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "JOIN_REQUESTS_LOAD_FAILED");
      }

      setJoinRequestRecords(payload.joinRequests ?? []);
      setJoinRequestLoadStatus("loaded");
    } catch (error) {
      setJoinRequestRecords([]);
      setJoinRequestLoadStatus("failed");
      setJoinRequestLoadError(
        error instanceof Error ? error.message : "JOIN_REQUESTS_LOAD_FAILED",
      );
    }
  }

  useEffect(() => {
    void loadMemberInvitations();
    void loadCompanyMembers();
    void loadMemberJoinRequests();
  }, []);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);



  function handleOpenMemberDetail(row: MemberDirectoryRow) {
    if (row.source !== "member" || !row.memberRecord) return;
    setSelectedMemberId(row.memberRecord.id);
    setMemberDetailDraft(buildMemberDetailDraft(row.memberRecord));
    setMemberDetailError(null);
  }

  function handleCloseMemberDetail() {
    if (isSavingMemberDetail) return;
    setSelectedMemberId(null);
    setMemberDetailDraft(null);
    setMemberDetailError(null);
  }

  function handleRoleTemplateChange(roleTemplateCode: MemberPermissionRoleTemplateCode) {
    setMemberDetailDraft((previous) =>
      previous
        ? {
            ...previous,
            roleTemplateCode: toAssignableMemberRoleTemplateCode(roleTemplateCode),
          }
        : previous,
    );
  }

  function handleApplyRoleTemplatePermissions() {
    setMemberDetailDraft((previous) =>
      previous
        ? {
            ...previous,
            permissionCodes: normalizeSimplePermissionCodes(
              getMemberRoleTemplatePermissions(previous.roleTemplateCode),
            ),
          }
        : previous,
    );
  }

  function handleToggleSimplePermissionControl(control: SimplePermissionControl) {
    setMemberDetailDraft((previous) =>
      previous
        ? {
            ...previous,
            permissionCodes: toggleSimplePermissionControl(
              previous.permissionCodes,
              control,
            ),
          }
        : previous,
    );
  }

  async function handleSaveMemberDetail() {
    if (!selectedMemberId || !memberDetailDraft || isSavingMemberDetail) return;
    if (selectedMemberPermissionCount === 0) {
      setMemberDetailError(
        t(
          "memberManagement.detailModal.errors.permissionRequired",
          "권한은 최소 1개 이상 선택해야 합니다.",
        ),
      );
      return;
    }

    setIsSavingMemberDetail(true);
    setMemberDetailError(null);

    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(selectedMemberId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-peacebypiece-permissions":
              "member.read,member.permission.update,member.suspend",
          },
          body: JSON.stringify({
            ...memberDetailDraft,
            permissionCodes: normalizeSimplePermissionCodes(
              memberDetailDraft.permissionCodes,
            ),
          }),
        },
      );
      const payload = (await response.json()) as MemberUpdateResponse;

      if (!response.ok || !payload.ok || !payload.member) {
        throw new Error(payload.error ?? "MEMBER_UPDATE_FAILED");
      }

      setMemberRecords((previous) =>
        previous.map((member) =>
          member.id === payload.member!.id ? payload.member! : member,
        ),
      );
      setFeedbackMessage(
        t(
          "memberManagement.detailModal.feedback.saved",
          "멤버 정보를 저장했습니다.",
        ),
      );
      setSelectedMemberId(null);
      setMemberDetailDraft(null);
      setMemberDetailError(null);
    } catch (error) {
      const errorCode = getMemberDetailErrorCode(
        error instanceof Error ? error.message : "MEMBER_UPDATE_FAILED",
      );
      const errorMessageMap: Record<string, string> = {
        MEMBER_PERMISSION_REQUIRED: t(
          "memberManagement.detailModal.errors.permissionRequired",
          "권한은 최소 1개 이상 선택해야 합니다.",
        ),
        SELF_PERMISSION_UPDATE_REMOVAL_BLOCKED: t(
          "memberManagement.detailModal.errors.selfPermissionBlocked",
          "본인의 권한 수정 권한은 직접 제거할 수 없습니다.",
        ),
        SELF_STATUS_UPDATE_BLOCKED: t(
          "memberManagement.detailModal.errors.selfStatusBlocked",
          "본인의 사용 상태는 직접 변경할 수 없습니다.",
        ),
        LAST_ADMIN_PERMISSION_REMOVAL_BLOCKED: t(
          "memberManagement.detailModal.errors.lastAdminBlocked",
          "마지막 관리자 권한은 제거할 수 없습니다.",
        ),
      };
      setMemberDetailError(
        errorMessageMap[errorCode] ??
          t(
            "memberManagement.detailModal.errors.updateFailed",
            "멤버 정보를 저장하지 못했습니다.",
          ),
      );
    } finally {
      setIsSavingMemberDetail(false);
    }
  }

  function getJoinRequestReviewRoleId(request: (typeof joinRequests)[number]): MemberPermissionRoleTemplateCode {
    return toAssignableMemberRoleTemplateCode(
      joinRequestRoleDrafts[request.id] ?? request.requestedRoleId,
    );
  }

  async function handleReviewJoinRequest(
    request: (typeof joinRequests)[number],
    action: JoinRequestReviewAction,
  ) {
    if (reviewingJoinRequestId) return;

    setReviewingJoinRequestId(request.id);

    try {
      const response = await fetch(
        `/api/invitations/join-requests/${encodeURIComponent(request.id)}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleTemplateCode: getJoinRequestReviewRoleId(request),
            permissionCodes: getMemberRoleTemplatePermissions(
              getJoinRequestReviewRoleId(request),
            ),
            reasonCode:
              action === "reject" ? "customer_admin_rejected" : undefined,
          }),
        },
      );
      const payload = (await response.json()) as JoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "JOIN_REQUEST_REVIEW_FAILED");
      }

      setFeedbackMessage(
        action === "approve"
          ? t(
              "memberManagement.reviewActions.approveSuccess",
              "가입 신청을 승인했습니다.",
            )
          : t(
              "memberManagement.reviewActions.rejectSuccess",
              "가입 신청을 거절했습니다.",
            ),
      );
      await loadMemberJoinRequests();
      await loadCompanyMembers();
      await loadMemberInvitations();
    } catch (error) {
      console.error("[admin:members] join request review failed", error);
      setFeedbackMessage(
        action === "approve"
          ? t(
              "memberManagement.reviewActions.approveError",
              "승인 처리에 실패했습니다.",
            )
          : t(
              "memberManagement.reviewActions.rejectError",
              "거절 처리에 실패했습니다.",
            ),
      );
    } finally {
      setReviewingJoinRequestId(null);
    }
  }

  async function handleCreateInvite() {
    if (!canSubmitInvite) return;

    const expiresAt = resolveExpiresAt(expiresInDays);

    setIsCreatingInvite(true);
    setInviteError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "company_to_member",
          recipientRole: getDefaultAssignableMemberRoleTemplateCode(),
          permissionPreset: getDefaultAssignableMemberRoleTemplateCode(),
          expiresAt,
          createdByUserId: undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "INVITATION_CREATE_FAILED");
      }

      setPendingInvitations((previous) => [
        {
          id: payload.invitation?.id ?? `local-${Date.now()}`,
          inviteUrl: getAbsoluteInviteUrl(
            payload.inviteUrl ??
              `/invite/member/${payload.rawToken ?? "pending"}`,
          ),
          expiresAt: payload.invitation?.expiresAt ?? expiresAt,
          createdAt: payload.invitation?.createdAt ?? new Date().toISOString(),
          status: payload.invitation?.status ?? "pending",
        },
        ...previous,
      ]);
      setFeedbackMessage(
        t(
          "memberManagement.inviteBuilder.feedback.created",
          "초대 링크가 생성되었습니다.",
        ),
      );
      await loadMemberInvitations();
    } catch (error) {
      setInviteError(
        resolveMemberInvitationErrorMessage(
          t,
          error instanceof Error ? error.message : "INVITATION_CREATE_FAILED",
          t(
            "memberManagement.inviteBuilder.errors.create",
            "초대 링크를 생성하지 못했습니다.",
          ),
        ),
      );
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function handleCancelPendingInvitation(
    invitation: PendingMemberInvitationRow,
  ) {
    if (
      revokingInviteId ||
      invitation.status === "accepted" ||
      invitation.status === "revoked" ||
      invitation.status === "cancelled"
    ) {
      return;
    }

    setRevokingInviteId(invitation.id);
    setInviteError(null);

    try {
      const response = await fetch(
        `/api/invitations/${encodeURIComponent(invitation.id)}/revoke`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? payload.error ?? "INVITATION_REVOKE_FAILED");
      }

      setFeedbackMessage(
        t(
          "memberManagement.inviteBuilder.feedback.cancelled",
          "초대를 취소했습니다.",
        ),
      );
      await loadMemberInvitations();
    } catch (error) {
      setInviteError(
        resolveMemberInvitationErrorMessage(
          t,
          error instanceof Error ? error.message : "INVITATION_REVOKE_FAILED",
          t(
            "memberManagement.inviteBuilder.errors.revoke",
            "초대 링크를 취소하지 못했습니다.",
          ),
        ),
      );
    } finally {
      setRevokingInviteId(null);
    }
  }

  async function handleCopyInviteLink(inviteUrl: string) {
    if (!inviteUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(inviteUrl);
    setFeedbackMessage(
      t(
        "memberManagement.inviteBuilder.feedback.copied",
        "링크가 복사되었습니다.",
      ),
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
      <section className="overflow-hidden rounded-[32px] border border-[var(--pbp-border-soft)] bg-[linear-gradient(135deg,var(--pbp-surface-base)_0%,var(--pbp-surface-soft)_48%,var(--pbp-brand-muted)_140%)] p-5 shadow-[var(--pbp-shadow-card)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--pbp-brand-soft)]">
              {t("memberManagement.visualHero.eyebrow", "Team operation")}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] pbp-text-primary sm:text-3xl">
              {t("memberManagement.visualHero.title", "멤버와 권한 흐름을 한 화면에서 관리하세요")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 pbp-text-muted">
              {t("memberManagement.visualHero.description", "초대 링크, 가입 승인, 재직 상태, 화면별 권한을 같은 기준으로 확인합니다.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge tone="brand">{t("memberManagement.visualHero.badge.role", "역할 기반")}</AdminStatusBadge>
            <AdminStatusBadge tone="info">{t("memberManagement.visualHero.badge.permission", "권한 관리")}</AdminStatusBadge>
          </div>
        </div>
        <AdminSummaryMetricCards
          cards={summaryCards.map((card) => ({
            id: card.id,
            label: t(`memberManagement.summary.${card.id}.label`, card.id),
            value: card.value,
            helper: t(`memberManagement.summary.${card.id}.description`, ""),
            badge: (
              <AdminStatusBadge tone={getStatusTone(card.status)}>
                {t(`memberManagement.statuses.${card.status}`, card.status)}
              </AdminStatusBadge>
            ),
          }))}
        />
      </section>

      <AdminSection
        eyebrow={t("memberManagement.eyebrow", "멤버 권한")}
        title={t(
          tabPreviews.find((tab) => tab.id === activeTab)?.labelKey ??
            "memberManagement.title",
          tabPreviews.find((tab) => tab.id === activeTab)?.fallbackLabel ??
            "멤버 관리",
        )}
        description={t(
          tabPreviews.find((tab) => tab.id === activeTab)?.descriptionKey ??
            "memberManagement.description",
          tabPreviews.find((tab) => tab.id === activeTab)?.fallbackDescription ??
            "초대, 승인, 권한, 재직 상태를 한 화면에서 관리합니다.",
        )}
        actions={
          <AdminSegmentedTabs
            items={tabPreviews.map((tab) => ({
              id: tab.id,
              label: t(tab.labelKey, tab.fallbackLabel),
              title: t(tab.descriptionKey, tab.fallbackDescription),
            }))}
            activeId={activeTab}
            onChange={setActiveTab}
          />
        }
        bodyClassName="mt-4"
        className="shrink-0 rounded-[30px]"
      >
        <div>
          {activeTab === "invite" ? (
            <section
              id="member-invite-builder"
              className="grid items-stretch gap-5 lg:grid-cols-[0.95fr_1.05fr]"
            >
              <AdminMemberInviteBuilderPanel
                t={t}
                className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
                contentClassName={MEMBER_INVITE_PANEL_CONTENT_CLASS}
                expiresInDays={expiresInDays}
                inviteError={inviteError}
                isCreatingInvite={isCreatingInvite}
                canSubmitInvite={canSubmitInvite}
                onExpiresInDaysChange={setExpiresInDays}
                onCreateInvite={handleCreateInvite}
              />

              <AdminPanelSection
                className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
                title={t(
                  "memberManagement.sections.invitations",
                  "초대 링크 목록",
                )}
                description={t(
                  "memberManagement.sections.invitationsDescription",
                  "사용 가능, 사용됨, 만료됨, 취소됨 상태를 확인하고 링크를 복사하거나 취소합니다.",
                )}
                meta={t(
                  "memberManagement.tabs.invite.count",
                  "초대 {count}건",
                ).replace("{count}", String(invitations.length))}
                contentClassName={MEMBER_INVITATION_TABLE_CONTENT_CLASS}
              >
                <AdminTable
                  items={invitations}
                  columns={invitationTableColumns}
                  getRowKey={(invitation) => invitation.id}
                  emptyLabel={t(
                    "memberManagement.empty.invitations.title",
                    "생성된 초대가 없습니다",
                  )}
                  emptyDescription={t(
                    "memberManagement.empty.invitations.description",
                    "초대를 생성하면 이 목록에서 링크 복사, 만료일 확인, 취소를 처리할 수 있습니다.",
                  )}
                  gridTemplateColumns="84px minmax(180px,1fr) 90px 90px 140px"
                  headerClassName="hidden shrink-0 gap-2 bg-[var(--pbp-surface-muted)] px-3 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)] md:grid"
                  rowBaseClassName="grid w-full min-w-0 gap-2 px-3 py-2.5 text-left text-[11px] md:items-center"
                  className={MEMBER_INVITATION_TABLE_VIEWPORT_CLASS}
                />
              </AdminPanelSection>
            </section>
          ) : null}

          {activeTab === "members" ? (
            <AdminPanelSection
              className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
              eyebrow={t("memberManagement.memberDirectory.eyebrow", "멤버 관리")}
              title={t("memberManagement.memberDirectory.title", "멤버 관리")}
              description={t(
                "memberManagement.memberDirectory.description",
                "승인 대기와 전체 멤버를 한 목록에서 확인하고 처리합니다.",
              )}
              meta={t(
                "memberManagement.tabs.members.count",
                "대상 {count}명",
              ).replace("{count}", String(memberDirectoryRows.length))}
              contentClassName="flex min-h-0 flex-1 flex-col pt-4"
            >
              <AdminMemberDirectoryControls
                t={t}
                searchQuery={memberSearchQuery}
                statusFilter={memberStatusFilter}
                roleFilter={memberRoleFilter}
                roleOptions={inviteRoleOptions}
                onSearchQueryChange={setMemberSearchQuery}
                onStatusFilterChange={setMemberStatusFilter}
                onRoleFilterChange={setMemberRoleFilter}
              />

              {memberListLoadError ? (
                <p className="mb-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                  {t(
                    "memberManagement.loadErrors.members",
                    "멤버 목록을 불러오지 못했습니다.",
                  )}{" "}
                  {memberListLoadError}
                </p>
              ) : null}
              {joinRequestLoadError ? (
                <p className="mb-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                  {t(
                    "memberManagement.loadErrors.joinRequests",
                    "승인 대기 신청 목록을 불러오지 못했습니다.",
                  )}{" "}
                  {joinRequestLoadError}
                </p>
              ) : null}
              <AdminTable
                items={filteredMemberDirectoryRows}
                columns={memberDirectoryColumns}
                getRowKey={(row) => row.id}
                emptyLabel={t(
                  "memberManagement.empty.memberDirectory.title",
                  "표시할 멤버가 없습니다",
                )}
                emptyDescription={t(
                  "memberManagement.empty.memberDirectory.description",
                  "승인 대기 신청 또는 등록된 멤버가 생성되면 이 목록에 표시됩니다.",
                )}
                isLoading={
                  memberListLoadStatus === "loading" ||
                  joinRequestLoadStatus === "loading"
                }
                loadingLabel={t(
                  "memberManagement.loading.memberDirectory.title",
                  "멤버 목록을 불러오는 중입니다",
                )}
                gridTemplateColumns="minmax(120px,1fr) minmax(160px,1.2fr) 110px 110px 96px 110px 110px 120px 140px"
                rowBaseClassName="grid w-full min-w-[1120px] gap-3 px-4 py-3 text-left text-xs md:items-center"
                headerClassName="hidden min-w-[1120px] gap-3 bg-[var(--pbp-surface-muted)] px-4 py-2 text-[10px] font-semibold text-[var(--pbp-text-muted)] md:grid"
                className="min-h-0 flex-1"
                onRowClick={handleOpenMemberDetail}
              />
            </AdminPanelSection>
          ) : null}

        </div>
      </AdminSection>

      <AdminModal
        open={Boolean(selectedMemberId && memberDetailDraft)}
        title={t(
          "memberManagement.detailModal.title",
          "멤버 권한 관리",
        )}
        description={t(
          "memberManagement.detailModal.description",
          "멤버 로우를 클릭해 작업지시서, 협력업체, 기준정보, 발주 권한을 관리합니다.",
        )}
        onClose={handleCloseMemberDetail}
        maxWidthClass="md:max-w-5xl"
        bodyClassName="space-y-4 [scrollbar-gutter:stable]"
        footer={
          <AdminModalFooterActions
            secondaryLabel={t("common.cancel", "취소")}
            primaryLabel={
              isSavingMemberDetail
                ? t("memberManagement.detailModal.actions.saving", "저장 중")
                : t("memberManagement.detailModal.actions.save", "저장")
            }
            onSecondary={handleCloseMemberDetail}
            onPrimary={() => void handleSaveMemberDetail()}
            secondaryDisabled={isSavingMemberDetail}
            primaryDisabled={isSavingMemberDetail || !memberDetailDraft}
            statusMessage={memberDetailError ?? ""}
            statusTone={memberDetailError ? "danger" : "neutral"}
          />
        }
      >
        {memberDetailDraft ? (
          <AdminMemberPermissionDetailBody
            t={t}
            draft={memberDetailDraft}
            selectedMember={selectedMemberRecord}
            selectedRolePreview={selectedMemberRolePreview}
            selectedPermissionCount={selectedMemberPermissionCount}
            manageableRoles={manageableRoles}
            onRoleTemplateChange={handleRoleTemplateChange}
            onApplyRoleTemplatePermissions={handleApplyRoleTemplatePermissions}
            onToggleSimplePermissionControl={handleToggleSimplePermissionControl}
          />
        ) : null}
      </AdminModal>

      <ToastMessage message={feedbackMessage} />
    </div>
  );
}
