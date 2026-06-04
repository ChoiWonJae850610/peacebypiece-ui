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
} from "@/lib/admin/members/memberManagementPresentation";
import {
  buildMemberManagementSummaryViewModel,
  filterMemberDirectoryRows,
  isMemberDirectoryLoading,
} from "@/lib/admin/members/memberManagementViewModel";
import type { AdminTableSortState } from "@/lib/admin/common/types";
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
import AdminSummaryMetricCards from "@/components/admin/common/AdminSummaryMetricCards";
import WaflPageHero from "@/components/admin/common/WaflPageHero";
import {
  AdminModal,
  AdminModalFooterActions,
} from "@/components/admin/layout/AdminModal";
import AdminMemberPermissionDetailBody from "@/components/admin/members/AdminMemberPermissionDetailBody";
import {
  buildMemberInvitationTableColumns,
  type PendingMemberInvitationRow,
  type MemberInvitationSortKey,
} from "@/components/admin/members/AdminMemberInvitationTableColumns";
import {
  buildMemberDirectoryColumns,
  type JoinRequestReviewAction,
  type MemberDirectoryRow,
  type MemberDirectoryStatus,
  type MemberDirectoryStatusFilter,
  type MemberDirectorySortKey,
} from "@/components/admin/members/AdminMemberDirectoryTableColumns";
import AdminMemberInvitationSection from "@/components/admin/members/AdminMemberInvitationSection";
import AdminMemberDirectorySection from "@/components/admin/members/AdminMemberDirectorySection";

import ToastMessage, { showWaflLoadingToast, type ToastTone } from "@/components/common/ToastMessage";


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
    fallbackLabel: "재직중",
  },
  {
    value: "suspended",
    labelKey: "memberManagement.memberDirectory.statuses.suspended",
    fallbackLabel: "비활성",
  },
  {
    value: "withdrawal_requested",
    labelKey: "memberManagement.memberDirectory.statuses.withdrawal_requested",
    fallbackLabel: "탈퇴 요청",
  },
  {
    value: "withdrawn",
    labelKey: "memberManagement.memberDirectory.statuses.withdrawn",
    fallbackLabel: "탈퇴 완료",
  },
] as const;

function toMemberDirectoryStatus(status: AdminCompanyMemberRecord["status"]): MemberDirectoryStatus {
  if (status === "withdrawal_requested") return "withdrawalRequested";
  return status;
}

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

function toggleAdminTableSort<TKey extends string>(
  current: AdminTableSortState<TKey>,
  key: TKey,
): AdminTableSortState<TKey> {
  if (current.key !== key) {
    return { key, direction: "asc" };
  }
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

function compareAdminTableValues(a: string | null | undefined, b: string | null | undefined) {
  const left = String(a ?? "").trim();
  const right = String(b ?? "").trim();
  return left.localeCompare(right, "ko-KR", { numeric: true, sensitivity: "base" });
}

function sortMemberDirectoryRows(
  rows: readonly MemberDirectoryRow[],
  sortState: AdminTableSortState<MemberDirectorySortKey>,
): MemberDirectoryRow[] {
  return [...rows].sort((a, b) => {
    const readValue = (row: MemberDirectoryRow): string => {
      if (sortState.key === "role") return row.roleId ?? "";
      return String(row[sortState.key] ?? "");
    };
    const result = compareAdminTableValues(readValue(a), readValue(b));
    return sortState.direction === "asc" ? result : -result;
  });
}

function sortPendingInvitations(
  rows: readonly PendingMemberInvitationRow[],
  sortState: AdminTableSortState<MemberInvitationSortKey>,
): PendingMemberInvitationRow[] {
  return [...rows].sort((a, b) => {
    const readValue = (row: PendingMemberInvitationRow): string => {
      if (sortState.key === "expires") return row.expiresAt;
      if (sortState.key === "createdAt") return row.createdAt;
      return row.status;
    };
    const result = compareAdminTableValues(readValue(a), readValue(b));
    return sortState.direction === "asc" ? result : -result;
  });
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
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] =
    useState<MemberDirectoryStatusFilter>("all");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [expiresInDays, setExpiresInDays] = useState("7d");
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingMemberInvitationRow[]
  >([]);
  const [invitationSortState, setInvitationSortState] = useState<
    AdminTableSortState<MemberInvitationSortKey>
  >({ key: "createdAt", direction: "desc" });
  const [memberDirectorySortState, setMemberDirectorySortState] = useState<
    AdminTableSortState<MemberDirectorySortKey>
  >({ key: "approvedAt", direction: "desc" });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<ToastTone>("info");
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
  const [joinRequestRoleDrafts, setJoinRequestRoleDrafts] = useState<
    Record<string, MemberPermissionRoleTemplateCode>
  >({});
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
  const invitations = useMemo(
    () => sortPendingInvitations(pendingInvitations, invitationSortState),
    [invitationSortState, pendingInvitations],
  );
  const invitationTableColumns = useMemo(
    () =>
      buildMemberInvitationTableColumns({
        t,
        revokingInviteId,
        onCopyInviteLink: handleCopyInviteLink,
        onShareInviteLink: handleShareInviteLink,
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
      status: toMemberDirectoryStatus(member.status),
      requestedAt: "-",
      approvedAt: member.approvedAtLabel,
      lastActiveAt: member.lastActiveLabel,
      member,
      memberRecord: memberRecords.find((record) => record.id === member.id),
    }));

    return [...pendingRows, ...memberRows];
  }, [joinRequests, memberRecords, members]);

  const filteredMemberDirectoryRows = useMemo(() => {
    const filteredRows = filterMemberDirectoryRows(memberDirectoryRows, {
      searchQuery: memberSearchQuery,
      statusFilter: memberStatusFilter,
      roleFilter: memberRoleFilter,
    });
    return sortMemberDirectoryRows(filteredRows, memberDirectorySortState);
  }, [
    memberDirectoryRows,
    memberDirectorySortState,
    memberRoleFilter,
    memberSearchQuery,
    memberStatusFilter,
  ]);

  const handleInvitationSort = (sortKey: MemberInvitationSortKey) => {
    setInvitationSortState((current) => toggleAdminTableSort(current, sortKey));
  };

  const handleMemberDirectorySort = (sortKey: MemberDirectorySortKey) => {
    setMemberDirectorySortState((current) => toggleAdminTableSort(current, sortKey));
  };

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
  const summaryCards = useMemo(
    () =>
      buildMemberManagementSummaryViewModel({
        baseSummaryCards,
        members,
        joinRequests,
        memberListLoadStatus,
        joinRequestLoadStatus,
      }),
    [
      baseSummaryCards,
      joinRequestLoadStatus,
      joinRequests,
      memberListLoadStatus,
      members,
    ],
  );
  const canSubmitInvite = canCreateInvite && !isCreatingInvite;
  const memberDirectoryLoading = isMemberDirectoryLoading(
    memberListLoadStatus,
    joinRequestLoadStatus,
  );

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

  function handleMemberStatusChange(status: AdminCompanyMemberRecord["status"]) {
    setMemberDetailDraft((previous) =>
      previous
        ? {
            ...previous,
            status,
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
      setFeedbackTone("success");
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
    showWaflLoadingToast(
      t(
        "memberManagement.inviteBuilder.feedback.cancelling",
        "초대를 취소하는 중입니다.",
      ),
    );

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

      setFeedbackTone("success");
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
    setFeedbackTone("success");
    setFeedbackMessage(
      t(
        "memberManagement.inviteBuilder.feedback.copied",
        "링크가 복사되었습니다.",
      ),
    );
  }

  async function handleShareInviteLink(inviteUrl: string) {
    if (!inviteUrl || typeof navigator === "undefined") return;

    const shareTitle = t(
      "memberManagement.inviteBuilder.share.title",
      "WAFL 초대 링크",
    );
    const shareText = t(
      "memberManagement.inviteBuilder.share.text",
      "WAFL 멤버 초대 링크입니다.",
    );

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteUrl,
        });
        setFeedbackTone("success");
        setFeedbackMessage(
          t(
            "memberManagement.inviteBuilder.feedback.shared",
            "초대 링크 공유창을 열었습니다.",
          ),
        );
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
      setFeedbackTone("info");
      setFeedbackMessage(
        t(
          "memberManagement.inviteBuilder.feedback.shareFallbackCopied",
          "공유를 지원하지 않는 기기라 링크를 복사했습니다.",
        ),
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
      setFeedbackTone("info");
      setFeedbackMessage(
        t(
          "memberManagement.inviteBuilder.feedback.shareFallbackCopied",
          "공유를 지원하지 않는 기기라 링크를 복사했습니다.",
        ),
      );
    }
  }

  return (
    <div className="flex min-h-fit w-full min-w-0 touch-pan-y flex-col gap-4 overflow-visible overscroll-auto pb-10 2xl:pb-6">
      <WaflPageHero
        eyebrow={t("memberManagement.visualHero.eyebrow", "Team management")}
        title={t("memberManagement.visualHero.title", "멤버와 권한을 관리합니다.")}
        description={t("memberManagement.visualHero.description", "가입 승인, 재직 상태, 역할과 권한을 한 화면에서 확인합니다.")}
      >
        <AdminSummaryMetricCards
          cards={summaryCards.map((card) => ({
            id: card.id,
            label: t(`memberManagement.summary.${card.id}.label`, card.id),
            value: `${card.value}명`,
            helper: t(`memberManagement.summary.${card.id}.description`, ""),
          }))}
        />
      </WaflPageHero>

      <div className="flex w-full min-w-0 flex-col gap-4">
        <AdminMemberDirectorySection
          t={t}
          filteredMemberDirectoryRows={filteredMemberDirectoryRows}
          memberDirectoryColumns={memberDirectoryColumns}
          memberSearchQuery={memberSearchQuery}
          memberStatusFilter={memberStatusFilter}
          memberRoleFilter={memberRoleFilter}
          inviteRoleOptions={inviteRoleOptions}
          memberListLoadError={memberListLoadError}
          joinRequestLoadError={joinRequestLoadError}
          isLoading={memberDirectoryLoading}
          onSearchQueryChange={setMemberSearchQuery}
          onStatusFilterChange={setMemberStatusFilter}
          onRoleFilterChange={setMemberRoleFilter}
          onOpenMemberDetail={handleOpenMemberDetail}
          memberDirectorySortState={memberDirectorySortState}
          onMemberDirectorySort={handleMemberDirectorySort}
        />

        <AdminMemberInvitationSection
          t={t}
          invitations={invitations}
          invitationTableColumns={invitationTableColumns}
          expiresInDays={expiresInDays}
          inviteError={inviteError}
          isCreatingInvite={isCreatingInvite}
          canSubmitInvite={canSubmitInvite}
          onExpiresInDaysChange={setExpiresInDays}
          onCreateInvite={handleCreateInvite}
          invitationSortState={invitationSortState}
          onInvitationSort={handleInvitationSort}
        />
      </div>

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
            statusOptions={selectedMemberStatusOptions}
            onStatusChange={handleMemberStatusChange}
            onRoleTemplateChange={handleRoleTemplateChange}
            onApplyRoleTemplatePermissions={handleApplyRoleTemplatePermissions}
            onToggleSimplePermissionControl={handleToggleSimplePermissionControl}
          />
        ) : null}
      </AdminModal>

      <ToastMessage message={feedbackMessage} tone={feedbackTone} />
    </div>
  );
}
