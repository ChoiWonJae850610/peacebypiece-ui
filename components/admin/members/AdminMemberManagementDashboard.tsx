"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMemberInviteRoleOptions,
  toMemberJoinRequestPreviews,
  toMemberListPreviews,
  getMemberManagementPermissionCards,
  getMemberManagementSummaryCards,
  getMemberPermissionCatalogPreviews,
  getMemberPermissionGroupPreviews,
  getMemberPermissionMatrixPreviews,
  getMemberRolePreviews,
  type MemberJoinRequestLoadStatus,
  type MemberListLoadStatus,
  type MemberManagementStatus,
} from "@/lib/admin/members/memberManagementPresentation";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import type { AdminCompanyMemberRecord } from "@/lib/admin/members/memberTypes";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  MEMBER_PERMISSION_CATALOG,
  getMemberRoleTemplatePermissions,
  hasEveryMemberPermission,
} from "@/lib/permissions";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import { AdminButton } from "@/components/admin/common/AdminButton";
import AdminPanelSection from "@/components/admin/common/AdminPanelSection";
import AdminSegmentedTabs from "@/components/admin/common/AdminSegmentedTabs";
import AdminSummaryMetricCards from "@/components/admin/common/AdminSummaryMetricCards";
import {
  ADMIN_FIELD_CONTAINER_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_SURFACE_PANEL_CLASS,
  ADMIN_TABLE_HEADER_CLASS,
  ADMIN_TABLE_ROW_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import {
  AdminStatusBadge,
  type AdminStatusBadgeTone,
} from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
import ToastMessage from "@/components/common/ToastMessage";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "@/lib/utils/phoneFormat";

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

type JoinRequestReviewAction = "approve" | "reject";

function getEmailMatchTone(
  status: "matched" | "mismatched" | "unknown",
): AdminStatusBadgeTone {
  if (status === "matched") return "success";
  if (status === "mismatched") return "warning";
  return "neutral";
}


type MemberInviteMethod = "email" | "phone";

type PendingMemberInvitationRow = {
  id: string;
  target: string;
  method: MemberInviteMethod;
  inviteUrl: string;
  expiresAt: string;
  status: "pending" | "sent" | "expired";
};


type MemberDirectoryStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "suspended"
  | "withdrawalRequested";

type MemberDirectoryRow = {
  id: string;
  source: "joinRequest" | "member";
  name: string;
  email: string;
  phone: string;
  roleId: string | null;
  status: "pending" | "approved" | "suspended" | "withdrawalRequested" | "withdrawn" | "rejected";
  requestedAt: string;
  approvedAt: string;
  lastActiveAt: string;
  joinRequest?: ReturnType<typeof toMemberJoinRequestPreviews>[number];
  member?: ReturnType<typeof toMemberListPreviews>[number];
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidKoreanMobilePhone(value: string): boolean {
  return /^01[016789][0-9]{7,8}$/.test(normalizePhoneNumber(value));
}

function getPendingInvitationExpiresLabel(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const editableMemberPermissionCodes = MEMBER_PERMISSION_CATALOG.filter(
  (permission) => !permission.systemOnly,
).map((permission) => permission.code);

const MEMBER_INVITE_PANEL_HEIGHT_CLASS = "h-[452px] min-h-[452px]";
const MEMBER_INVITE_PANEL_CONTENT_CLASS = "flex min-h-0 flex-1 flex-col pt-4";
const MEMBER_INVITATION_TABLE_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col pt-4";
const MEMBER_INVITATION_TABLE_VIEWPORT_CLASS = "min-h-0 flex-1";

type MemberManagementTab = "invite" | "members" | "permissions";

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

function resolveExpiresAt(expiresInDays: string): string {
  const days = Number.parseInt(expiresInDays.replace("d", ""), 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) ? days : 7));
  return expiresAt.toISOString();
}

export default function AdminMemberManagementDashboard() {
  const t = useAdminTranslation();
  const baseSummaryCards = getMemberManagementSummaryCards();
  const roles = getMemberRolePreviews();
  const permissionCards = getMemberManagementPermissionCards();
  const currentPermissionCodes =
    getMemberRoleTemplatePermissions("company_admin");
  const inviteRoleOptions = getMemberInviteRoleOptions();
  const groups = getMemberPermissionGroupPreviews();
  const catalogItems = getMemberPermissionCatalogPreviews();
  const matrixItems = getMemberPermissionMatrixPreviews();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    inviteRoleOptions[1]?.id ?? inviteRoleOptions[0]?.id ?? "viewer",
  );
  const [activeTab, setActiveTab] = useState<MemberManagementTab>("invite");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberStatusFilter, setMemberStatusFilter] =
    useState<MemberDirectoryStatusFilter>("all");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const selectedRole = useMemo(
    () =>
      inviteRoleOptions.find((role) => role.id === selectedRoleId) ??
      inviteRoleOptions[0],
    [inviteRoleOptions, selectedRoleId],
  );
  const [inviteMethod, setInviteMethod] = useState<MemberInviteMethod>("email");
  const [targetContact, setTargetContact] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7d");
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingMemberInvitationRow[]
  >([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
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
  const [joinRequestReviewMessage, setJoinRequestReviewMessage] = useState<
    string | null
  >(null);
  const [joinRequestReviewError, setJoinRequestReviewError] = useState<
    string | null
  >(null);
  const canCreateInvite = hasEveryMemberPermission(
    { permissionCodes: currentPermissionCodes },
    ["member.invite"],
  );

  const members = useMemo(
    () => toMemberListPreviews(memberRecords),
    [memberRecords],
  );
  const invitations = pendingInvitations;
  const invitationValidationError = useMemo(() => {
    const value = targetContact.trim();
    if (!value)
      return t(
        "memberManagement.inviteBuilder.validation.required",
        "초대 대상을 입력해 주세요.",
      );
    if (inviteMethod === "email" && !isValidEmail(value)) {
      return t(
        "memberManagement.inviteBuilder.validation.email",
        "이메일 형식으로 입력해 주세요.",
      );
    }
    if (inviteMethod === "phone" && !isValidKoreanMobilePhone(value)) {
      return t(
        "memberManagement.inviteBuilder.validation.phone",
        "휴대폰 번호 형식으로 입력해 주세요.",
      );
    }
    return null;
  }, [inviteMethod, targetContact, t]);
  const invitationTableColumns = useMemo<
    AdminTableColumn<PendingMemberInvitationRow>[]
  >(
    () => [
      {
        key: "target",
        label: t("memberManagement.tables.invitations.columns.target", "대상"),
        className: "min-w-0",
        render: (invitation) => (
          <span className="block truncate font-semibold pbp-text-primary" title={invitation.target}>
            {invitation.target}
          </span>
        ),
      },
      {
        key: "type",
        label: t("memberManagement.tables.invitations.columns.type", "방식"),
        className: "whitespace-nowrap",
        render: (invitation) => (
          <span className="font-semibold pbp-text-primary">
            {t(
              `memberManagement.invitationMethods.${invitation.method}`,
              invitation.method,
            )}
          </span>
        ),
      },
      {
        key: "link",
        label: t(
          "memberManagement.tables.invitations.columns.link",
          "초대 링크",
        ),
        className: "min-w-0",
        render: (invitation) => (
          <button
            type="button"
            onClick={() => void handleCopyInviteLink(invitation.inviteUrl)}
            className="max-w-full truncate rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-2.5 py-1 text-[11px] font-semibold pbp-text-primary transition hover:border-[var(--pbp-accent-border)]"
          >
            {t("memberManagement.inviteBuilder.actions.copy", "링크 복사")}
          </button>
        ),
      },
      {
        key: "expires",
        label: t(
          "memberManagement.tables.invitations.columns.expires",
          "만료일",
        ),
        className: "whitespace-nowrap",
        render: (invitation) => (
          <span className="pbp-text-muted">
            {getPendingInvitationExpiresLabel(invitation.expiresAt)}
          </span>
        ),
      },
      {
        key: "status",
        label: t("memberManagement.tables.invitations.columns.status", "상태"),
        className: "whitespace-nowrap",
        render: (invitation) => (
          <AdminStatusBadge
            tone={invitation.status === "expired" ? "warning" : "success"}
          >
            {t(
              `memberManagement.invitationStatuses.${invitation.status}`,
              invitation.status,
            )}
          </AdminStatusBadge>
        ),
      },
      {
        key: "actions",
        label: t("memberManagement.tables.invitations.columns.actions", "취소"),
        headerClassName: "text-center",
        className: "flex justify-center",
        render: (invitation) => (
          <button
            type="button"
            onClick={() => handleCancelPendingInvitation(invitation.id)}
            className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-sm font-semibold pbp-text-muted transition hover:border-[var(--pbp-danger-border)] hover:text-[var(--pbp-danger)]"
            aria-label={t(
              "memberManagement.inviteBuilder.actions.cancel",
              "초대 취소",
            )}
          >
            ×
          </button>
        ),
      },
    ],
    [t],
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
      roleId: null,
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
      phone: "-",
      roleId: member.roleId,
      status: member.status,
      requestedAt: "-",
      approvedAt: member.approvedAtLabel,
      lastActiveAt: member.lastActiveLabel,
      member,
    }));

    return [...pendingRows, ...memberRows];
  }, [joinRequests, members]);

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

  const memberDirectoryColumns = useMemo<AdminTableColumn<MemberDirectoryRow>[]>(
    () => [
      {
        key: "name",
        label: t("memberManagement.tables.memberDirectory.columns.name", "이름"),
        className: "min-w-0",
        render: (row) => (
          <span className="block truncate font-semibold pbp-text-primary" title={row.name}>
            {row.name || "-"}
          </span>
        ),
      },
      {
        key: "email",
        label: t("memberManagement.tables.memberDirectory.columns.email", "이메일"),
        className: "min-w-0",
        render: (row) => (
          <span className="block truncate pbp-text-muted" title={row.email}>
            {row.email || "-"}
          </span>
        ),
      },
      {
        key: "phone",
        label: t("memberManagement.tables.memberDirectory.columns.phone", "연락처"),
        className: "min-w-0",
        render: (row) => <span className="pbp-text-muted">{row.phone || "-"}</span>,
      },
      {
        key: "role",
        label: t("memberManagement.tables.memberDirectory.columns.role", "권한"),
        className: "min-w-0",
        render: (row) => (
          <span className="font-semibold pbp-text-primary">
            {row.roleId
              ? t(`memberManagement.roles.${row.roleId}.label`, row.roleId)
              : t("memberManagement.memberDirectory.none", "없음")}
          </span>
        ),
      },
      {
        key: "status",
        label: t("memberManagement.tables.memberDirectory.columns.status", "상태"),
        className: "whitespace-nowrap",
        render: (row) => (
          <AdminStatusBadge
            tone={
              row.status === "approved"
                ? "success"
                : row.status === "suspended" || row.status === "withdrawn" || row.status === "rejected"
                  ? "danger"
                  : "warning"
            }
          >
            {t(`memberManagement.memberDirectory.statuses.${row.status}`, row.status)}
          </AdminStatusBadge>
        ),
      },
      {
        key: "requestedAt",
        label: t("memberManagement.tables.memberDirectory.columns.requestedAt", "신청일"),
        className: "whitespace-nowrap",
        render: (row) => <span className="pbp-text-muted">{row.requestedAt}</span>,
      },
      {
        key: "approvedAt",
        label: t("memberManagement.tables.memberDirectory.columns.approvedAt", "승인일"),
        className: "whitespace-nowrap",
        render: (row) => <span className="pbp-text-muted">{row.approvedAt}</span>,
      },
      {
        key: "lastActiveAt",
        label: t("memberManagement.tables.memberDirectory.columns.lastActiveAt", "마지막 접속"),
        className: "whitespace-nowrap",
        render: (row) => <span className="pbp-text-muted">{row.lastActiveAt}</span>,
      },
      {
        key: "actions",
        label: t("memberManagement.tables.memberDirectory.columns.actions", "액션"),
        headerClassName: "text-center",
        className: "flex justify-center",
        render: (row) =>
          row.source === "joinRequest" && row.joinRequest ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              <AdminButton
                onClick={() => void handleReviewJoinRequest(row.joinRequest!, "approve")}
                disabled={reviewingJoinRequestId !== null}
                variant="primary"
                size="sm"
                className="px-2.5 py-1 text-[11px]"
              >
                {reviewingJoinRequestId === row.joinRequest.id
                  ? t("memberManagement.reviewActions.processing", "처리 중")
                  : t("memberManagement.reviewActions.approve", "승인")}
              </AdminButton>
              <AdminButton
                onClick={() => void handleReviewJoinRequest(row.joinRequest!, "reject")}
                disabled={reviewingJoinRequestId !== null}
                variant="secondary"
                size="sm"
                className="px-2.5 py-1 text-[11px]"
              >
                {t("memberManagement.reviewActions.reject", "거절")}
              </AdminButton>
            </div>
          ) : (
            <AdminButton
              onClick={() => setActiveTab("permissions")}
              variant="secondary"
              size="sm"
              className="px-2.5 py-1 text-[11px]"
            >
              {t("memberManagement.memberActions.managePermissions", "권한 관리")}
            </AdminButton>
          ),
      },
    ],
    [reviewingJoinRequestId, t],
  );
  const summaryCards = useMemo(
    () =>
      baseSummaryCards.map((card) =>
        card.id === "members"
          ? {
              ...card,
              value: String(members.length),
              status: memberListLoadStatus === "loaded" ? "ready" : card.status,
            }
          : card.id === "invitations"
            ? {
                ...card,
                value: String(invitations.length),
                status: invitations.length > 0 ? "pending" : card.status,
              }
            : card.id === "joinRequests"
              ? {
                  ...card,
                  value: String(joinRequests.length),
                  status:
                    joinRequestLoadStatus === "loaded" ? "ready" : card.status,
                }
              : card,
      ),
    [
      baseSummaryCards,
      invitations.length,
      joinRequestLoadStatus,
      joinRequests.length,
      memberListLoadStatus,
      members.length,
    ],
  );
  const canSubmitInvite =
    canCreateInvite && !invitationValidationError && !isCreatingInvite;
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
    {
      id: "permissions",
      labelKey: "memberManagement.tabs.permissions.label",
      fallbackLabel: "권한 관리",
      descriptionKey: "memberManagement.tabs.permissions.description",
      fallbackDescription: "권한 코드와 홈 카드 노출 기준을 관리합니다.",
      countLabel: t(
        "memberManagement.tabs.permissions.count",
        "권한 {count}개",
      ).replace("{count}", String(editableMemberPermissionCodes.length)),
    },
  ];

  async function loadCompanyMembers() {
    setMemberListLoadStatus("loading");
    setMemberListLoadError(null);

    try {
      const response = await fetch(
        `/api/admin/members?companyId=${encodeURIComponent(WORKSPACE_COMPANY_ID)}&status=all&limit=50`,
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
    void loadCompanyMembers();
    void loadMemberJoinRequests();
  }, []);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = window.setTimeout(() => setFeedbackMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  async function handleReviewJoinRequest(
    request: (typeof joinRequests)[number],
    action: JoinRequestReviewAction,
  ) {
    if (reviewingJoinRequestId) return;

    setReviewingJoinRequestId(request.id);
    setJoinRequestReviewError(null);
    setJoinRequestReviewMessage(null);

    try {
      const response = await fetch(
        `/api/invitations/join-requests/${encodeURIComponent(request.id)}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorUserId: "user-sample-admin",
            roleTemplateCode: request.requestedRoleId,
            permissionCodes: getMemberRoleTemplatePermissions(
              request.requestedRoleId,
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

      setJoinRequestReviewMessage(
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
    } catch (error) {
      setJoinRequestReviewError(
        error instanceof Error ? error.message : "JOIN_REQUEST_REVIEW_FAILED",
      );
    } finally {
      setReviewingJoinRequestId(null);
    }
  }

  async function handleCreateInvite() {
    if (!canSubmitInvite || !selectedRole) return;

    const target =
      inviteMethod === "phone"
        ? normalizePhoneNumber(targetContact)
        : targetContact.trim();
    const expiresAt = resolveExpiresAt(expiresInDays);

    setIsCreatingInvite(true);
    setInviteError(null);

    try {
      if (inviteMethod === "phone") {
        setPendingInvitations((previous) => [
          {
            id: `local-sms-${Date.now()}`,
            target: formatPhoneNumber(target),
            method: "phone",
            inviteUrl: getAbsoluteInviteUrl(
              `/invite/member/sms-delivery-pending-${Date.now()}`,
            ),
            expiresAt,
            status: "pending",
          },
          ...previous,
        ]);
        setTargetContact("");
        setFeedbackMessage(
          t(
            "memberManagement.inviteBuilder.feedback.created",
            "초대 링크가 생성되었습니다.",
          ),
        );
        return;
      }

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "company_to_member",
          companyId: WORKSPACE_COMPANY_ID,
          inviterCompanyId: WORKSPACE_COMPANY_ID,
          recipientEmail: target,
          recipientRole: selectedRole.id as
            | "designer"
            | "inspector"
            | "inventory_manager"
            | "viewer",
          permissionPreset: selectedRole.id,
          expiresAt,
          createdByUserId: "user-sample-admin",
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "INVITATION_CREATE_FAILED");
      }

      setPendingInvitations((previous) => [
        {
          id: payload.invitation?.id ?? `local-${Date.now()}`,
          target,
          method: "email",
          inviteUrl: getAbsoluteInviteUrl(
            payload.inviteUrl ??
              `/invite/member/${payload.rawToken ?? "pending"}`,
          ),
          expiresAt: payload.invitation?.expiresAt ?? expiresAt,
          status: "pending",
        },
        ...previous,
      ]);
      setTargetContact("");
      setFeedbackMessage(
        t(
          "memberManagement.inviteBuilder.feedback.created",
          "초대 링크가 생성되었습니다.",
        ),
      );
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "INVITATION_CREATE_FAILED",
      );
    } finally {
      setIsCreatingInvite(false);
    }
  }

  function handleCancelPendingInvitation(invitationId: string) {
    setPendingInvitations((previous) =>
      previous.filter((invitation) => invitation.id !== invitationId),
    );
    setFeedbackMessage(
      t(
        "memberManagement.inviteBuilder.feedback.cancelled",
        "초대를 취소했습니다.",
      ),
    );
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
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

      <section className="rounded-3xl border p-4 shadow-sm pbp-admin-card">
        <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] pbp-text-subtle">
              {t("memberManagement.eyebrow", "멤버 권한")}
            </p>
            <h2 className="mt-1 text-lg font-semibold pbp-text-primary">
              {t(
                tabPreviews.find((tab) => tab.id === activeTab)?.labelKey ??
                  "memberManagement.title",
                tabPreviews.find((tab) => tab.id === activeTab)
                  ?.fallbackLabel ?? "멤버 관리",
              )}
            </h2>
          </div>
          <AdminSegmentedTabs
            items={tabPreviews.map((tab) => ({
              id: tab.id,
              label: t(tab.labelKey, tab.fallbackLabel),
              title: t(tab.descriptionKey, tab.fallbackDescription),
            }))}
            activeId={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="mt-4">
          {activeTab === "invite" ? (
            <section
              id="member-invite-builder"
              className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_520px]"
            >
              <AdminPanelSection
                className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
                eyebrow={t("memberManagement.inviteBuilder.eyebrow", "멤버 초대")}
                title={t("memberManagement.inviteBuilder.title", "직원 초대 생성")}
                description={t(
                  "memberManagement.inviteBuilder.description",
                  "이메일 또는 휴대폰으로 초대 링크를 발송할 대상을 입력하고 기본 권한 묶음과 만료 기간을 지정합니다.",
                )}
                contentClassName={MEMBER_INVITE_PANEL_CONTENT_CLASS}
                footer={
                  <div className="pt-3">
                    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold pbp-text-primary">
                          {t(
                            "memberManagement.inviteBuilder.sendPolicyTitle",
                            "발송 기준",
                          )}
                        </p>
                        <p className="mt-1 text-xs leading-5 pbp-text-muted">
                          {inviteMethod === "email"
                            ? t(
                                "memberManagement.inviteBuilder.sendPolicy.email",
                                "초대 링크를 이메일로 발송합니다.",
                              )
                            : t(
                                "memberManagement.inviteBuilder.sendPolicy.phone",
                                "초대 링크를 문자/SMS로 발송합니다.",
                              )}
                        </p>
                        {targetContact.trim() && invitationValidationError ? (
                          <p className="mt-2 text-xs font-semibold text-[var(--pbp-danger)]">
                            {invitationValidationError}
                          </p>
                        ) : null}
                        {inviteError ? (
                          <p className="mt-2 text-xs font-semibold text-[var(--pbp-danger)]">
                            {inviteError}
                          </p>
                        ) : null}
                      </div>
                      <AdminButton
                        onClick={handleCreateInvite}
                        variant="primary"
                        disabled={!canSubmitInvite}
                        className="min-w-[120px]"
                      >
                        {isCreatingInvite
                          ? t(
                              "memberManagement.inviteBuilder.actions.creating",
                              "생성 중",
                            )
                          : t(
                              "memberManagement.inviteBuilder.actions.create",
                              "초대 생성",
                            )}
                      </AdminButton>
                    </div>
                  </div>
                }
              >
                <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                  <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                    <span className="text-xs font-semibold pbp-text-muted">
                      {t(
                        "memberManagement.inviteBuilder.fields.method",
                        "초대 방식",
                      )}
                    </span>
                    <select
                      value={inviteMethod}
                      onChange={(event) => {
                        setInviteMethod(
                          event.target.value as MemberInviteMethod,
                        );
                        setTargetContact("");
                        setInviteError(null);
                      }}
                      className={ADMIN_INPUT_CLASS}
                    >
                      <option value="email">
                        {t(
                          "memberManagement.invitationMethods.email",
                          "이메일",
                        )}
                      </option>
                      <option value="phone">
                        {t("memberManagement.invitationMethods.phone", "문자")}
                      </option>
                    </select>
                  </label>

                  <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                    <span className="text-xs font-semibold pbp-text-muted">
                      {inviteMethod === "email"
                        ? t(
                            "memberManagement.inviteBuilder.fields.email",
                            "이메일 주소",
                          )
                        : t(
                            "memberManagement.inviteBuilder.fields.phone",
                            "휴대폰 번호",
                          )}
                    </span>
                    <input
                      type={inviteMethod === "email" ? "email" : "tel"}
                      inputMode={inviteMethod === "email" ? "email" : "numeric"}
                      pattern={inviteMethod === "email" ? undefined : "[0-9]*"}
                      value={targetContact}
                      onChange={(event) =>
                        setTargetContact(
                          inviteMethod === "email"
                            ? event.target.value
                            : formatPhoneNumber(event.target.value),
                        )
                      }
                      className={ADMIN_INPUT_CLASS}
                      placeholder={
                        inviteMethod === "email"
                          ? t(
                              "memberManagement.inviteBuilder.placeholders.email",
                              "member@example.com",
                            )
                          : t(
                              "memberManagement.inviteBuilder.placeholders.phone",
                              "010-1234-5678",
                            )
                      }
                    />
                  </label>

                  <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                    <span className="text-xs font-semibold pbp-text-muted">
                      {t(
                        "memberManagement.inviteBuilder.fields.roleTemplate",
                        "기본 권한 묶음",
                      )}
                    </span>
                    <select
                      value={selectedRoleId}
                      onChange={(event) =>
                        setSelectedRoleId(event.target.value)
                      }
                      className={ADMIN_INPUT_CLASS}
                    >
                      {inviteRoleOptions.map((role) => (
                        <option key={role.id} value={role.id}>
                          {t(
                            `memberManagement.roles.${role.id}.label`,
                            role.id,
                          )}{" "}
                          ·{" "}
                          {t(
                            "memberManagement.permissionCount",
                            "권한 {count}개",
                          ).replace("{count}", String(role.permissionCount))}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                    <span className="text-xs font-semibold pbp-text-muted">
                      {t(
                        "memberManagement.inviteBuilder.fields.expires",
                        "초대 만료",
                      )}
                    </span>
                    <select
                      value={expiresInDays}
                      onChange={(event) => setExpiresInDays(event.target.value)}
                      className={ADMIN_INPUT_CLASS}
                    >
                      <option value="3d">
                        {t("memberManagement.inviteBuilder.expires.3d", "3일")}
                      </option>
                      <option value="7d">
                        {t("memberManagement.inviteBuilder.expires.7d", "7일")}
                      </option>
                      <option value="14d">
                        {t(
                          "memberManagement.inviteBuilder.expires.14d",
                          "14일",
                        )}
                      </option>
                    </select>
                  </label>
                </div>

              </AdminPanelSection>

              <AdminPanelSection
                className={MEMBER_INVITE_PANEL_HEIGHT_CLASS}
                title={t(
                  "memberManagement.sections.invitations",
                  "초대 대기 목록",
                )}
                description={t(
                  "memberManagement.sections.invitationsDescription",
                  "발송한 초대의 대상, 링크, 만료일, 상태를 확인합니다.",
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
                  gridTemplateColumns="minmax(96px,1.2fr) 44px 72px 78px 70px 30px"
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
              <div className="mb-3 grid shrink-0 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_190px]">
                <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                  <span className="text-xs font-semibold pbp-text-muted">
                    {t("memberManagement.memberDirectory.filters.search", "검색")}
                  </span>
                  <input
                    value={memberSearchQuery}
                    onChange={(event) => setMemberSearchQuery(event.target.value)}
                    className={ADMIN_INPUT_CLASS}
                    placeholder={t(
                      "memberManagement.memberDirectory.filters.searchPlaceholder",
                      "이름, 이메일, 연락처 검색",
                    )}
                  />
                </label>
                <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                  <span className="text-xs font-semibold pbp-text-muted">
                    {t("memberManagement.memberDirectory.filters.status", "상태")}
                  </span>
                  <select
                    value={memberStatusFilter}
                    onChange={(event) =>
                      setMemberStatusFilter(
                        event.target.value as MemberDirectoryStatusFilter,
                      )
                    }
                    className={ADMIN_INPUT_CLASS}
                  >
                    {[
                      "all",
                      "pending",
                      "approved",
                      "suspended",
                      "withdrawalRequested",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {t(
                          `memberManagement.memberDirectory.statusFilters.${status}`,
                          status,
                        )}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={ADMIN_FIELD_CONTAINER_CLASS}>
                  <span className="text-xs font-semibold pbp-text-muted">
                    {t("memberManagement.memberDirectory.filters.role", "권한")}
                  </span>
                  <select
                    value={memberRoleFilter}
                    onChange={(event) => setMemberRoleFilter(event.target.value)}
                    className={ADMIN_INPUT_CLASS}
                  >
                    <option value="all">
                      {t("memberManagement.memberDirectory.roleFilters.all", "전체")}
                    </option>
                    <option value="none">
                      {t("memberManagement.memberDirectory.none", "없음")}
                    </option>
                    {inviteRoleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {t(`memberManagement.roles.${role.id}.label`, role.id)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

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
              {joinRequestReviewMessage ? (
                <p className="mb-3 rounded-2xl border border-[var(--pbp-accent-border)] bg-[var(--pbp-accent-soft)] px-4 py-3 text-xs font-semibold text-[var(--pbp-accent)]">
                  {joinRequestReviewMessage}
                </p>
              ) : null}
              {joinRequestReviewError ? (
                <p className="mb-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                  {t(
                    "memberManagement.reviewActions.error",
                    "가입 신청 처리에 실패했습니다.",
                  )}{" "}
                  {joinRequestReviewError}
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
              />
            </AdminPanelSection>
          ) : null}

          {activeTab === "permissions" ? (
            <>
              <article className={ADMIN_SURFACE_PANEL_CLASS}>
                <h3 className="text-base font-semibold pbp-text-primary">
                  {t("memberManagement.sections.roles", "역할 기본값")}
                </h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">
                  {t(
                    "memberManagement.sections.rolesDescription",
                    "역할은 기본 권한 묶음으로 사용하고, 실제 화면 노출은 권한 코드 기준으로 확장합니다.",
                  )}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-stone-900">
                          {t(
                            `memberManagement.roles.${role.id}.label`,
                            role.id,
                          )}
                        </p>
                        <AdminStatusBadge tone={getStatusTone(role.status)}>
                          {t(
                            `memberManagement.statuses.${role.status}`,
                            role.status,
                          )}
                        </AdminStatusBadge>
                      </div>
                      <p className="mt-2 text-xs leading-5 pbp-text-muted">
                        {t(
                          `memberManagement.roles.${role.id}.description`,
                          "역할 설명",
                        )}
                      </p>
                      <p className="mt-3 text-xs font-semibold pbp-text-muted">
                        {t(
                          "memberManagement.permissionCount",
                          "권한 {count}개",
                        ).replace("{count}", String(role.permissionCount))}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <section
                id="member-permission-guard"
                className={ADMIN_SURFACE_PANEL_CLASS}
              >
                <h3 className="text-base font-semibold pbp-text-primary">
                  {t(
                    "memberManagement.sections.workspaceCards",
                    "메인화면 카드 권한",
                  )}
                </h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">
                  {t(
                    "memberManagement.sections.workspaceCardsDescription",
                    "관리자가 권한을 부여하면 해당 멤버의 메인화면에 표시될 카드 후보입니다.",
                  )}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {permissionCards.map((item) => {
                    const visibleForCurrentPermissions =
                      hasEveryMemberPermission(
                        { permissionCodes: currentPermissionCodes },
                        item.requiredPermissions,
                      );
                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-stone-950">
                            {t(
                              `memberManagement.permissionCards.${item.id}.label`,
                              item.id,
                            )}
                          </h4>
                          <AdminStatusBadge tone={getStatusTone(item.status)}>
                            {visibleForCurrentPermissions
                              ? t(
                                  "memberManagement.permissionGuards.visible",
                                  "노출",
                                )
                              : t(
                                  "memberManagement.permissionGuards.hidden",
                                  "숨김",
                                )}
                          </AdminStatusBadge>
                        </div>
                        <p className="mt-2 text-xs leading-5 pbp-text-muted">
                          {t(
                            `memberManagement.permissionCards.${item.id}.description`,
                            "",
                          )}
                        </p>
                        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-[11px] font-semibold text-stone-500">
                          {t(
                            "memberManagement.permissionGuards.requiredPermissions",
                            "필요 권한: {permissions}",
                          ).replace(
                            "{permissions}",
                            item.requiredPermissions.join(", "),
                          )}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className={ADMIN_SURFACE_PANEL_CLASS}>
                <h3 className="text-base font-semibold pbp-text-primary">
                  {t(
                    "memberManagement.sections.permissionCatalog",
                    "권한 카탈로그",
                  )}
                </h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">
                  {t(
                    "memberManagement.sections.permissionCatalogDescription",
                    "DB permission_catalog와 role template에 넣을 permission_code 기준입니다.",
                  )}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-stone-900">
                          {t(
                            `memberManagement.permissionGroups.${group.id}.label`,
                            group.id,
                          )}
                        </p>
                        <AdminStatusBadge tone="neutral">
                          {t(
                            "memberManagement.permissionCount",
                            "권한 {count}개",
                          ).replace("{count}", String(group.permissionCount))}
                        </AdminStatusBadge>
                      </div>
                      {group.systemOnlyCount > 0 ? (
                        <p className="mt-2 text-xs font-semibold text-amber-700">
                          {t(
                            "memberManagement.systemOnlyCount",
                            "시스템 전용 {count}개",
                          ).replace("{count}", String(group.systemOnlyCount))}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
                  <div className="grid grid-cols-[minmax(180px,1.2fr)_120px_90px] bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500">
                    <span>
                      {t(
                        "memberManagement.permissionCatalogColumns.code",
                        "권한 코드",
                      )}
                    </span>
                    <span>
                      {t(
                        "memberManagement.permissionCatalogColumns.group",
                        "그룹",
                      )}
                    </span>
                    <span>
                      {t(
                        "memberManagement.permissionCatalogColumns.scope",
                        "범위",
                      )}
                    </span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {catalogItems.map((item) => (
                      <div
                        key={item.code}
                        className="grid grid-cols-[minmax(180px,1.2fr)_120px_90px] border-t border-stone-100 px-3 py-2 text-xs text-stone-600"
                      >
                        <code className="truncate font-semibold text-stone-800">
                          {item.code}
                        </code>
                        <span>
                          {t(
                            `memberManagement.permissionGroups.${item.group}.label`,
                            item.group,
                          )}
                        </span>
                        <span>
                          {item.systemOnly
                            ? t("memberManagement.scope.system", "시스템")
                            : t("memberManagement.scope.company", "고객사")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className={ADMIN_SURFACE_PANEL_CLASS}>
                <h3 className="text-base font-semibold pbp-text-primary">
                  {t(
                    "memberManagement.sections.permissionMatrix",
                    "권한 매트릭스",
                  )}
                </h3>
                <p className="mt-1 text-xs leading-5 pbp-text-muted">
                  {t(
                    "memberManagement.sections.permissionMatrixDescription",
                    "role은 기본 체크값이고 실제 저장과 접근 제어는 permission_code 직접 부여 기준입니다.",
                  )}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  {roles.map((role) => {
                    const enabledCount = matrixItems.filter(
                      (item) => item.roleId === role.id && item.enabled,
                    ).length;
                    return (
                      <article
                        key={role.id}
                        className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                      >
                        <p className="text-sm font-semibold text-stone-900">
                          {t(
                            `memberManagement.roles.${role.id}.label`,
                            role.id,
                          )}
                        </p>
                        <p className="mt-2 text-xs leading-5 pbp-text-muted">
                          {t(
                            "memberManagement.matrixEnabledCount",
                            "기본 체크 {count}개",
                          ).replace("{count}", String(enabledCount))}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </section>
      <ToastMessage message={feedbackMessage} />
    </div>
  );
}
