"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getJoinRequestTableColumns,
  getMemberInviteRoleOptions,
  toMemberJoinRequestPreviews,
  toMemberListPreviews,
  getMemberManagementPermissionCards,
  getMemberManagementSummaryCards,
  getMemberPermissionCatalogPreviews,
  getMemberPermissionGroupPreviews,
  getMemberPermissionMatrixPreviews,
  getMemberRolePreviews,
  getMemberTableColumns,
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
  type MemberPermissionCode,
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

type MemberPermissionUpdateResponse = {
  ok?: boolean;
  member?: AdminCompanyMemberRecord;
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

function getMemberStatusTone(
  status: "approved" | "pending" | "suspended",
): AdminStatusBadgeTone {
  if (status === "approved") return "success";
  if (status === "suspended") return "danger";
  return "warning";
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

const MEMBER_INVITE_PANEL_HEIGHT_CLASS = "h-[500px] min-h-[500px]";

type MemberManagementTab = "invite" | "approval" | "members" | "permissions";

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
  const memberColumns = getMemberTableColumns();
  const joinRequestColumns = getJoinRequestTableColumns();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    inviteRoleOptions[1]?.id ?? inviteRoleOptions[0]?.id ?? "viewer",
  );
  const [activeTab, setActiveTab] = useState<MemberManagementTab>("invite");
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
  const [memberPermissionDrafts, setMemberPermissionDrafts] = useState<
    Record<string, MemberPermissionCode[]>
  >({});
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [memberPermissionUpdateMessage, setMemberPermissionUpdateMessage] =
    useState<string | null>(null);
  const [memberPermissionUpdateError, setMemberPermissionUpdateError] =
    useState<string | null>(null);
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
      id: "approval",
      labelKey: "memberManagement.tabs.approval.label",
      fallbackLabel: "승인",
      descriptionKey: "memberManagement.tabs.approval.description",
      fallbackDescription: "가입 신청을 승인하거나 거절합니다.",
      countLabel: t(
        "memberManagement.tabs.approval.count",
        "승인 대기 {count}건",
      ).replace("{count}", String(joinRequests.length)),
    },
    {
      id: "members",
      labelKey: "memberManagement.tabs.members.label",
      fallbackLabel: "전체 멤버",
      descriptionKey: "memberManagement.tabs.members.description",
      fallbackDescription: "멤버 목록과 역할 기본값을 확인합니다.",
      countLabel: t(
        "memberManagement.tabs.members.count",
        "멤버 {count}명",
      ).replace("{count}", String(members.length)),
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
        `/api/admin/members?companyId=${encodeURIComponent(WORKSPACE_COMPANY_ID)}&status=approved&limit=50`,
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
      setMemberPermissionDrafts((previous) => {
        const nextDrafts: Record<string, MemberPermissionCode[]> = {};
        for (const member of nextMembers) {
          nextDrafts[member.id] = previous[member.id] ?? [
            ...member.permissionCodes,
          ];
        }
        return nextDrafts;
      });
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

  function handleToggleMemberPermission(
    memberId: string,
    permissionCode: MemberPermissionCode,
  ) {
    setMemberPermissionDrafts((previous) => {
      const current = previous[memberId] ?? [];
      const next = current.includes(permissionCode)
        ? current.filter((code) => code !== permissionCode)
        : [...current, permissionCode];
      return { ...previous, [memberId]: next };
    });
  }

  async function handleUpdateMemberPermissions(memberId: string) {
    if (updatingMemberId) return;

    setUpdatingMemberId(memberId);
    setMemberPermissionUpdateError(null);
    setMemberPermissionUpdateMessage(null);

    try {
      const response = await fetch(
        `/api/admin/members/${encodeURIComponent(memberId)}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-peacebypiece-permissions": "member.permission.update",
          },
          body: JSON.stringify({
            actorUserId: "user-sample-admin",
            permissionCodes: memberPermissionDrafts[memberId] ?? [],
          }),
        },
      );
      const payload = (await response.json()) as MemberPermissionUpdateResponse;

      if (!response.ok || !payload.ok || !payload.member) {
        throw new Error(payload.error ?? "MEMBER_PERMISSION_UPDATE_FAILED");
      }

      setMemberPermissionUpdateMessage(
        t(
          "memberManagement.memberActions.permissionUpdateSuccess",
          "멤버 권한을 저장했습니다.",
        ),
      );
      await loadCompanyMembers();
    } catch (error) {
      setMemberPermissionUpdateError(
        error instanceof Error
          ? error.message
          : "MEMBER_PERMISSION_UPDATE_FAILED",
      );
    } finally {
      setUpdatingMemberId(null);
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
                contentClassName="flex flex-1 flex-col pt-5"
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

                <div className="mt-auto pt-5">
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
                contentClassName="flex flex-1 flex-col overflow-hidden pt-4"
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
                  className="h-full min-h-0 flex-1"
                />
              </AdminPanelSection>
            </section>
          ) : null}

          {activeTab === "approval" ? (
            <>
              <section className="rounded-3xl border p-4 shadow-sm pbp-card-muted">
                <p className="text-sm font-semibold pbp-text-primary">
                  {t(
                    "memberManagement.approvalWorkbench.guardTitle",
                    "저장 전제",
                  )}
                </p>
                <p className="mt-2 text-xs leading-5 pbp-text-muted">
                  {t(
                    "memberManagement.approvalWorkbench.guardDescription",
                    "승인 시 company_members를 approved로 만들고 member_permissions에 선택 권한을 저장해야 합니다. 거절 시 join_requests만 rejected 처리합니다.",
                  )}
                </p>
              </section>

              <section className="grid gap-4 xl:grid-cols-1">
                <article className={ADMIN_SURFACE_PANEL_CLASS}>
                  <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold pbp-text-primary">
                        {t(
                          "memberManagement.sections.joinRequests",
                          "가입 신청/승인 대기",
                        )}
                      </h3>
                      <p className="mt-1 text-xs leading-5 pbp-text-muted">
                        {t(
                          "memberManagement.sections.joinRequestsDescription",
                          "초대 링크로 가입 신청한 사용자를 승인하거나 거절하는 영역입니다.",
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-semibold pbp-text-subtle">
                      {t(
                        `memberManagement.sourceState.${getLoadStatusLabelKey(joinRequestLoadStatus)}`,
                        "DB 연결 상태 확인",
                      )}
                    </span>
                  </div>
                  {joinRequestLoadError ? (
                    <p className="mt-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                      {t(
                        "memberManagement.loadErrors.joinRequests",
                        "승인 대기 신청 목록을 불러오지 못했습니다.",
                      )}{" "}
                      {joinRequestLoadError}
                    </p>
                  ) : null}
                  {joinRequestReviewMessage ? (
                    <p className="mt-3 rounded-2xl border border-[var(--pbp-accent-border)] bg-[var(--pbp-accent-soft)] px-4 py-3 text-xs font-semibold text-[var(--pbp-accent)]">
                      {joinRequestReviewMessage}
                    </p>
                  ) : null}
                  {joinRequestReviewError ? (
                    <p className="mt-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                      {t(
                        "memberManagement.reviewActions.error",
                        "가입 신청 처리에 실패했습니다.",
                      )}{" "}
                      {joinRequestReviewError}
                    </p>
                  ) : null}
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--pbp-border)]">
                    <div className="min-w-[980px]">
                      <div
                        className={`grid grid-cols-[minmax(150px,1.2fr)_130px_170px_100px_minmax(130px,1fr)_110px_90px_110px_150px] ${ADMIN_TABLE_HEADER_CLASS}`}
                      >
                        {joinRequestColumns.map((column) => (
                          <div key={column.id} className="px-3 py-2">
                            {t(
                              `memberManagement.tables.joinRequests.columns.${column.id}`,
                              column.id,
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="divide-y divide-[var(--pbp-border)]">
                        {joinRequestLoadStatus === "loading" ? (
                          <div className="p-3">
                            <AdminEmptyState
                              title={t(
                                "memberManagement.loading.joinRequests.title",
                                "승인 대기 신청을 불러오는 중입니다",
                              )}
                              description={t(
                                "memberManagement.loading.joinRequests.description",
                                "join_requests.pending 목록을 실제 DB 기준으로 조회하고 있습니다.",
                              )}
                            />
                          </div>
                        ) : joinRequests.length ? (
                          joinRequests.map((request) => (
                            <div
                              key={request.id}
                              className={`grid grid-cols-[minmax(150px,1.2fr)_130px_170px_100px_minmax(130px,1fr)_110px_90px_110px_150px] px-3 py-3 ${ADMIN_TABLE_ROW_CLASS}`}
                            >
                              <div className="min-w-0">
                                <p className="truncate font-semibold pbp-text-primary">
                                  {request.applicantName}
                                </p>
                                <p className="mt-1 truncate pbp-text-muted">
                                  {request.applicantEmail}
                                </p>
                              </div>
                              <span className="truncate pbp-text-muted">
                                {request.applicantPhoneLabel}
                              </span>
                              <span className="truncate pbp-text-muted">
                                {request.invitationEmailLabel}
                              </span>
                              <AdminStatusBadge
                                tone={getEmailMatchTone(
                                  request.emailMatchStatus,
                                )}
                              >
                                {t(
                                  `memberManagement.emailMatchStatuses.${request.emailMatchStatus}`,
                                  request.emailMatchStatus,
                                )}
                              </AdminStatusBadge>
                              <span
                                className="truncate pbp-text-muted"
                                title={request.requestMemoLabel}
                              >
                                {request.requestMemoLabel}
                              </span>
                              <span className="font-semibold pbp-text-primary">
                                {t(
                                  `memberManagement.roles.${request.requestedRoleId}.label`,
                                  request.requestedRoleId,
                                )}
                              </span>
                              <AdminStatusBadge tone="warning">
                                {t(
                                  `memberManagement.joinRequestStatuses.${request.status}`,
                                  request.status,
                                )}
                              </AdminStatusBadge>
                              <span className="pbp-text-muted">
                                {request.requestedAtLabel}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                <AdminButton
                                  onClick={() =>
                                    void handleReviewJoinRequest(
                                      request,
                                      "approve",
                                    )
                                  }
                                  disabled={reviewingJoinRequestId !== null}
                                  variant="primary"
                                  className="px-2.5 py-1 text-[11px]"
                                >
                                  {reviewingJoinRequestId === request.id
                                    ? t(
                                        "memberManagement.reviewActions.processing",
                                        "처리 중",
                                      )
                                    : t(
                                        "memberManagement.reviewActions.approve",
                                        "승인",
                                      )}
                                </AdminButton>
                                <AdminButton
                                  onClick={() =>
                                    void handleReviewJoinRequest(
                                      request,
                                      "reject",
                                    )
                                  }
                                  disabled={reviewingJoinRequestId !== null}
                                  variant="secondary"
                                  className="px-2.5 py-1 text-[11px]"
                                >
                                  {t(
                                    "memberManagement.reviewActions.reject",
                                    "거절",
                                  )}
                                </AdminButton>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3">
                            <AdminEmptyState
                              title={t(
                                "memberManagement.empty.joinRequests.title",
                                "승인 대기 신청이 없습니다",
                              )}
                              description={t(
                                "memberManagement.empty.joinRequests.description",
                                "초대 링크 가입 신청이 생성되면 승인/거절/권한 부여 대상이 이 영역에 표시됩니다.",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            </>
          ) : null}

          {activeTab === "members" ? (
            <>
              <section className="grid gap-4">
                <article className={ADMIN_SURFACE_PANEL_CLASS}>
                  <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h3 className="text-base font-semibold pbp-text-primary">
                        {t("memberManagement.sections.members", "멤버 목록")}
                      </h3>
                      <p className="mt-1 text-xs leading-5 pbp-text-muted">
                        {t(
                          "memberManagement.sections.membersDescription",
                          "승인된 멤버와 정지된 멤버를 한 목록에서 관리합니다.",
                        )}
                      </p>
                    </div>
                    <span className="text-xs font-semibold pbp-text-subtle">
                      {t(
                        `memberManagement.sourceState.${getLoadStatusLabelKey(memberListLoadStatus)}`,
                        "DB 연결 상태 확인",
                      )}
                    </span>
                  </div>
                  {memberListLoadError ? (
                    <p className="mt-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                      {t(
                        "memberManagement.loadErrors.members",
                        "멤버 목록을 불러오지 못했습니다.",
                      )}{" "}
                      {memberListLoadError}
                    </p>
                  ) : null}
                  {memberPermissionUpdateMessage ? (
                    <p className="mt-3 rounded-2xl border border-[var(--pbp-accent-border)] bg-[var(--pbp-accent-soft)] px-4 py-3 text-xs font-semibold text-[var(--pbp-accent)]">
                      {memberPermissionUpdateMessage}
                    </p>
                  ) : null}
                  {memberPermissionUpdateError ? (
                    <p className="mt-3 rounded-2xl border px-4 py-3 text-xs font-semibold pbp-action-danger-soft">
                      {t(
                        "memberManagement.memberActions.permissionUpdateError",
                        "멤버 권한 저장에 실패했습니다.",
                      )}{" "}
                      {memberPermissionUpdateError}
                    </p>
                  ) : null}
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--pbp-border)]">
                    <div className="min-w-[1080px]">
                      <div className="grid grid-cols-[minmax(150px,1fr)_110px_90px_100px_110px_140px] bg-stone-50 text-xs font-semibold text-stone-500">
                        {memberColumns.map((column) => (
                          <div key={column.id} className="px-3 py-2">
                            {t(
                              `memberManagement.tables.members.columns.${column.id}`,
                              column.id,
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="divide-y divide-[var(--pbp-border)]">
                        {memberListLoadStatus === "loading" ? (
                          <div className="p-3">
                            <AdminEmptyState
                              title={t(
                                "memberManagement.loading.members.title",
                                "멤버 목록을 불러오는 중입니다",
                              )}
                              description={t(
                                "memberManagement.loading.members.description",
                                "승인된 company_members와 member_permissions를 실제 DB 기준으로 조회하고 있습니다.",
                              )}
                            />
                          </div>
                        ) : members.length ? (
                          members.map((member) => {
                            const draftPermissionCodes = memberPermissionDrafts[
                              member.id
                            ] ?? [...member.permissionCodes];
                            const hasPermissionChanged =
                              draftPermissionCodes.slice().sort().join("|") !==
                              member.permissionCodes.slice().sort().join("|");
                            return (
                              <div
                                key={member.id}
                                className="grid grid-cols-[minmax(150px,1fr)_110px_90px_100px_110px_140px] px-3 py-3 text-xs text-stone-600"
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-semibold pbp-text-primary">
                                    {member.name}
                                  </p>
                                  <p className="mt-1 truncate pbp-text-muted">
                                    {member.email}
                                  </p>
                                </div>
                                <span className="font-semibold pbp-text-primary">
                                  {t(
                                    `memberManagement.roles.${member.roleId}.label`,
                                    member.roleId,
                                  )}
                                </span>
                                <AdminStatusBadge
                                  tone={getMemberStatusTone(member.status)}
                                >
                                  {t(
                                    `memberManagement.memberStatuses.${member.status}`,
                                    member.status,
                                  )}
                                </AdminStatusBadge>
                                <span className="font-semibold pbp-text-primary">
                                  {t(
                                    "memberManagement.permissionCount",
                                    "권한 {count}개",
                                  ).replace(
                                    "{count}",
                                    String(draftPermissionCodes.length),
                                  )}
                                </span>
                                <span className="pbp-text-muted">
                                  {member.lastActiveLabel}
                                </span>
                                <AdminButton
                                  onClick={() =>
                                    void handleUpdateMemberPermissions(
                                      member.id,
                                    )
                                  }
                                  disabled={
                                    !hasPermissionChanged ||
                                    updatingMemberId !== null ||
                                    draftPermissionCodes.length === 0
                                  }
                                  variant="primary"
                                  size="sm"
                                  className="px-3 py-1 text-[11px]"
                                >
                                  {updatingMemberId === member.id
                                    ? t(
                                        "memberManagement.memberActions.saving",
                                        "저장 중",
                                      )
                                    : t(
                                        "memberManagement.memberActions.savePermissions",
                                        "권한 저장",
                                      )}
                                </AdminButton>
                                <div className="col-span-6 mt-3 grid gap-2 rounded-2xl border border-stone-100 bg-stone-50 p-3 md:grid-cols-2 xl:grid-cols-3">
                                  {editableMemberPermissionCodes.map(
                                    (permissionCode) => (
                                      <label
                                        key={`${member.id}-${permissionCode}`}
                                        className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] text-stone-700"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={draftPermissionCodes.includes(
                                            permissionCode,
                                          )}
                                          onChange={() =>
                                            handleToggleMemberPermission(
                                              member.id,
                                              permissionCode,
                                            )
                                          }
                                          className="size-4 rounded border-stone-300"
                                        />
                                        <span className="min-w-0 flex-1 truncate font-semibold">
                                          {permissionCode}
                                        </span>
                                      </label>
                                    ),
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3">
                            <AdminEmptyState
                              title={t(
                                "memberManagement.empty.members.title",
                                "등록된 멤버가 없습니다",
                              )}
                              description={t(
                                "memberManagement.empty.members.description",
                                "초대/가입 승인 API를 연결하면 승인된 멤버가 이 영역에 표시됩니다.",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            </>
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
