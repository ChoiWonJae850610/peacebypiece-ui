"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMemberInviteRoleOptions,
  toMemberJoinRequestPreviews,
  toMemberListPreviews,
  getMemberManagementSummaryCards,
  getMemberRolePreviews,
  type MemberJoinRequestLoadStatus,
  type MemberListLoadStatus,
  type MemberManagementStatus,
} from "@/lib/admin/members/memberManagementPresentation";
import type { JoinRequestRecord } from "@/lib/invitations/joinRequestTypes";
import type { InvitationRecord } from "@/lib/invitations/invitationTypes";
import type { AdminCompanyMemberRecord } from "@/lib/admin/members/memberTypes";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  getMemberRoleTemplatePermissions,
  hasEveryMemberPermission,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";
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
  AdminModal,
  AdminModalFooterActions,
  AdminModalSection,
  adminModalInputClassName,
} from "@/components/admin/layout/AdminModal";
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

type MemberUpdateResponse = {
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


type MemberInviteMethod = "email" | "phone";

type PendingMemberInvitationRow = {
  id: string;
  target: string;
  method: MemberInviteMethod;
  inviteUrl: string;
  expiresAt: string;
  status: InvitationRecord["status"];
};

type MemberInvitationListResponse = {
  ok?: boolean;
  invitations?: InvitationRecord[];
  error?: string;
  message?: string;
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
  memberRecord?: AdminCompanyMemberRecord;
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

type SimplePermissionControl = {
  id:
    | "workorderAccess"
    | "workorderWrite"
    | "workorderOrderDirect"
    | "partnerAccess"
    | "partnerWrite"
    | "statsAccess"
    | "standardsAccess"
    | "standardsWrite";
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
  permissionCodes: readonly MemberPermissionCode[];
};

const SIMPLE_PERMISSION_CONTROLS: readonly SimplePermissionControl[] = [
  {
    id: "workorderAccess",
    labelKey: "memberManagement.detailModal.simplePermissions.workorderAccess.label",
    fallbackLabel: "작업지시서",
    descriptionKey: "memberManagement.detailModal.simplePermissions.workorderAccess.description",
    fallbackDescription: "업무홈에 작업지시서 카드를 표시하고 본인 담당 작업지시서를 조회합니다.",
    permissionCodes: ["workorder.read"],
  },
  {
    id: "workorderWrite",
    labelKey: "memberManagement.detailModal.simplePermissions.workorderWrite.label",
    fallbackLabel: "작업지시서 작성 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.workorderWrite.description",
    fallbackDescription: "작업지시서 생성, 수정, 삭제 요청과 검토 요청을 허용합니다.",
    permissionCodes: ["workorder.read", "workorder.create", "workorder.update", "workorder.delete", "workorder.status.review"],
  },
  {
    id: "workorderOrderDirect",
    labelKey: "memberManagement.detailModal.simplePermissions.workorderOrderDirect.label",
    fallbackLabel: "발주 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.workorderOrderDirect.description",
    fallbackDescription: "검토 절차 없이 바로 발주 요청까지 진행할 수 있습니다.",
    permissionCodes: ["workorder.status.order"],
  },
  {
    id: "partnerAccess",
    labelKey: "memberManagement.detailModal.simplePermissions.partnerAccess.label",
    fallbackLabel: "협력업체관리",
    descriptionKey: "memberManagement.detailModal.simplePermissions.partnerAccess.description",
    fallbackDescription: "업무홈에 협력업체관리 카드를 표시하고 협력업체를 조회합니다.",
    permissionCodes: ["partner.read"],
  },
  {
    id: "partnerWrite",
    labelKey: "memberManagement.detailModal.simplePermissions.partnerWrite.label",
    fallbackLabel: "협력업체 작성 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.partnerWrite.description",
    fallbackDescription: "협력업체 등록, 수정, 비활성 또는 삭제 요청을 허용합니다.",
    permissionCodes: ["partner.read", "partner.create", "partner.update", "partner.delete", "partner.manage"],
  },
  {
    id: "statsAccess",
    labelKey: "memberManagement.detailModal.simplePermissions.statsAccess.label",
    fallbackLabel: "통계",
    descriptionKey: "memberManagement.detailModal.simplePermissions.statsAccess.description",
    fallbackDescription: "업무홈에 통계 카드를 표시하고 통계정보를 조회합니다.",
    permissionCodes: ["stats.read"],
  },
  {
    id: "standardsAccess",
    labelKey: "memberManagement.detailModal.simplePermissions.standardsAccess.label",
    fallbackLabel: "기준정보",
    descriptionKey: "memberManagement.detailModal.simplePermissions.standardsAccess.description",
    fallbackDescription: "업무홈에 기준정보 카드를 표시하고 기준정보를 조회합니다.",
    permissionCodes: ["standards.read"],
  },
  {
    id: "standardsWrite",
    labelKey: "memberManagement.detailModal.simplePermissions.standardsWrite.label",
    fallbackLabel: "기준정보 작성 가능",
    descriptionKey: "memberManagement.detailModal.simplePermissions.standardsWrite.description",
    fallbackDescription: "기준정보 등록, 수정, 비활성 또는 삭제 요청을 허용합니다.",
    permissionCodes: ["standards.read", "standards.create", "standards.update", "standards.delete", "standards.manage"],
  },
] as const;

function hasEverySimplePermissionCode(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): boolean {
  return nextPermissionCodes.every((code) => permissionCodes.includes(code));
}

function mergeSimplePermissionCodes(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): MemberPermissionCode[] {
  return Array.from(new Set([...permissionCodes, ...nextPermissionCodes])).sort();
}

function removeSimplePermissionCodes(
  permissionCodes: readonly MemberPermissionCode[],
  nextPermissionCodes: readonly MemberPermissionCode[],
): MemberPermissionCode[] {
  const removalSet = new Set(nextPermissionCodes);
  return permissionCodes.filter((code) => !removalSet.has(code));
}

function toggleSimplePermissionControl(
  permissionCodes: readonly MemberPermissionCode[],
  control: SimplePermissionControl,
): MemberPermissionCode[] {
  return hasEverySimplePermissionCode(permissionCodes, control.permissionCodes)
    ? removeSimplePermissionCodes(permissionCodes, control.permissionCodes)
    : mergeSimplePermissionCodes(permissionCodes, control.permissionCodes);
}

function countVisibleSimplePermissionControls(
  permissionCodes: readonly MemberPermissionCode[],
): number {
  return SIMPLE_PERMISSION_CONTROLS.filter((control) =>
    hasEverySimplePermissionCode(permissionCodes, control.permissionCodes),
  ).length;
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


function buildMemberDetailDraft(member: AdminCompanyMemberRecord): MemberDetailDraft {
  return {
    displayName: member.displayName?.trim() || member.name,
    phone: member.phone?.trim() || "",
    status: member.status,
    roleTemplateCode: member.roleTemplateCode,
    permissionCodes: [...member.permissionCodes],
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

function getMemberInvitationTargetLabel(invitation: InvitationRecord): string {
  return (
    invitation.recipientEmail?.trim() ||
    invitation.companyName?.trim() ||
    "링크 직접 전달"
  );
}

function getMemberInviteMethod(invitation: InvitationRecord): MemberInviteMethod {
  return invitation.recipientEmail?.trim() ? "email" : "phone";
}

function toPendingMemberInvitationRow(
  invitation: InvitationRecord,
): PendingMemberInvitationRow {
  return {
    id: invitation.id,
    target: getMemberInvitationTargetLabel(invitation),
    method: getMemberInviteMethod(invitation),
    inviteUrl: getAbsoluteInviteUrl(
      invitation.inviteUrlPath ?? `/invite/member/${invitation.id}`,
    ),
    expiresAt: invitation.expiresAt,
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
  const roles = getMemberRolePreviews();
  const manageableRoles = roles.filter((role) => role.id !== "company_admin");
  const currentPermissionCodes =
    getMemberRoleTemplatePermissions("company_admin");
  const inviteRoleOptions = getMemberInviteRoleOptions();
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
            tone={
              invitation.status === "revoked" ||
              invitation.status === "cancelled"
                ? "danger"
                : invitation.status === "expired"
                  ? "warning"
                  : invitation.status === "accepted"
                    ? "neutral"
                    : "success"
            }
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
            onClick={() => void handleCancelPendingInvitation(invitation)}
            disabled={
              revokingInviteId !== null ||
              invitation.status === "accepted" ||
              invitation.status === "revoked" ||
              invitation.status === "cancelled"
            }
            className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-sm font-semibold pbp-text-muted transition hover:border-[var(--pbp-danger-border)] hover:text-[var(--pbp-danger)] disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={t(
              "memberManagement.inviteBuilder.actions.cancel",
              "초대 취소",
            )}
          >
            {revokingInviteId === invitation.id ? "…" : "×"}
          </button>
        ),
      },
    ],
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
    () => roles.find((role) => role.id === memberDetailDraft?.roleTemplateCode) ?? null,
    [memberDetailDraft?.roleTemplateCode, roles],
  );
  const selectedMemberStatusOptions = useMemo(
    () => getMemberDetailStatusOptions(selectedMemberRecord?.status),
    [selectedMemberRecord?.status],
  );
  const selectedMemberPermissionCount = memberDetailDraft
    ? countVisibleSimplePermissionControls(memberDetailDraft.permissionCodes)
    : 0;

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
        label: t("memberManagement.tables.memberDirectory.columns.role", "역할"),
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
        label: t("memberManagement.tables.memberDirectory.columns.actions", "액션관리"),
        headerClassName: "text-center",
        className: "flex justify-center",
        render: (row) =>
          row.source === "joinRequest" && row.joinRequest ? (
            <div
              className="flex flex-wrap items-center justify-center gap-1.5"
              onClick={(event) => event.stopPropagation()}
            >
              <select
                value={getJoinRequestReviewRoleId(row.joinRequest)}
                onChange={(event) =>
                  setJoinRequestRoleDrafts((previous) => ({
                    ...previous,
                    [row.joinRequest!.id]: event.target.value as MemberPermissionRoleTemplateCode,
                  }))
                }
                className="h-8 rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2 text-[11px] font-semibold pbp-text-primary"
                aria-label={t("memberManagement.reviewActions.roleTemplate", "승인 역할")}
                disabled={reviewingJoinRequestId !== null}
              >
                {inviteRoleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {t(`memberManagement.roles.${role.id}.label`, role.id)}
                  </option>
                ))}
              </select>
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
            <span className="block h-8" aria-hidden="true" />
          ),
      },
    ],
    [inviteRoleOptions, joinRequestRoleDrafts, reviewingJoinRequestId, t],
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
        error instanceof Error ? error.message : "INVITATIONS_LOAD_FAILED",
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
            roleTemplateCode,
            permissionCodes: [...getMemberRoleTemplatePermissions(roleTemplateCode)],
          }
        : previous,
    );
  }

  function handleApplyRoleTemplatePermissions() {
    setMemberDetailDraft((previous) =>
      previous
        ? {
            ...previous,
            permissionCodes: [
              ...getMemberRoleTemplatePermissions(previous.roleTemplateCode),
            ],
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
          body: JSON.stringify(memberDetailDraft),
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
    return joinRequestRoleDrafts[request.id] ?? request.requestedRoleId;
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
    if (!canSubmitInvite || !selectedRole) return;

    const target =
      inviteMethod === "phone"
        ? normalizePhoneNumber(targetContact)
        : targetContact.trim();
    const expiresAt = resolveExpiresAt(expiresInDays);

    setIsCreatingInvite(true);
    setInviteError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "company_to_member",
          recipientEmail: inviteMethod === "email" ? target : null,
          recipientRole: selectedRole.id as
            | "designer"
            | "inspector"
            | "inventory_manager"
            | "viewer",
          permissionPreset: selectedRole.id,
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
          target: inviteMethod === "phone" ? formatPhoneNumber(target) : target,
          method: inviteMethod,
          inviteUrl: getAbsoluteInviteUrl(
            payload.inviteUrl ??
              `/invite/member/${payload.rawToken ?? "pending"}`,
          ),
          expiresAt: payload.invitation?.expiresAt ?? expiresAt,
          status: payload.invitation?.status ?? "pending",
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
      await loadMemberInvitations();
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "INVITATION_CREATE_FAILED",
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
        error instanceof Error ? error.message : "INVITATION_REVOKE_FAILED",
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
      </section>

      <AdminModal
        open={Boolean(selectedMemberId && memberDetailDraft)}
        title={t(
          "memberManagement.detailModal.title",
          "멤버 권한 관리",
        )}
        description={t(
          "memberManagement.detailModal.description",
          "멤버 로우를 클릭해 업무홈 카드와 작성 가능 범위를 관리합니다.",
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
          <div className="space-y-4">
            <div className="grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4 md:grid-cols-[minmax(0,1.1fr)_160px_160px]">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">
                  {t("memberManagement.detailModal.summary.title", "선택 멤버")}
                </p>
                <p className="mt-1 truncate text-base font-semibold pbp-text-primary">
                  {selectedMemberRecord?.name ?? memberDetailDraft.displayName}
                </p>
                <p className="mt-1 truncate text-xs pbp-text-muted">
                  {selectedMemberRecord?.email ?? "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2">
                <p className="text-[11px] font-semibold pbp-text-muted">
                  {t("memberManagement.detailModal.summary.role", "역할")}
                </p>
                <p className="mt-1 text-sm font-semibold pbp-text-primary">
                  {selectedMemberRolePreview
                    ? t(
                        `memberManagement.roles.${selectedMemberRolePreview.id}.label`,
                        selectedMemberRolePreview.id,
                      )
                    : "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2">
                <p className="text-[11px] font-semibold pbp-text-muted">
                  {t("memberManagement.detailModal.summary.permissions", "선택 항목")}
                </p>
                <p className="mt-1 text-sm font-semibold pbp-text-primary">
                  {t(
                    "memberManagement.detailModal.selectedPermissionCount",
                    "{count}개 선택",
                  ).replace(
                    "{count}",
                    String(selectedMemberPermissionCount),
                  )}
                </p>
              </div>
            </div>

            <AdminModalSection
              title={t(
                "memberManagement.detailModal.sections.permissions",
                "업무 권한",
              )}
              description={t(
                "memberManagement.detailModal.sections.permissionsDescription",
                "업무홈에 보일 카드와 각 카드에서 작성할 수 있는 범위를 선택합니다.",
              )}
            >
              <div className="grid gap-4">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-muted">
                    {t("memberManagement.detailModal.fields.role", "역할")}
                  </span>
                  <select
                    value={memberDetailDraft.roleTemplateCode}
                    onChange={(event) =>
                      handleRoleTemplateChange(
                        event.target.value as MemberPermissionRoleTemplateCode,
                      )
                    }
                    className={adminModalInputClassName}
                  >
                    {manageableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {t(`memberManagement.roles.${role.id}.label`, role.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-col gap-2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 pbp-text-muted">
                    {t(
                      "memberManagement.detailModal.roleTemplateHelper",
                      "역할은 기본 권한 묶음입니다. 아래 업무 화면 권한은 필요할 때만 조정합니다.",
                    )}
                  </p>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyRoleTemplatePermissions}
                  >
                    {t(
                      "memberManagement.detailModal.actions.resetRoleTemplate",
                      "역할 기본값 적용",
                    )}
                  </AdminButton>
                </div>

                <p className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3 py-2 text-[11px] leading-5 pbp-text-muted">
                  {t(
                    "memberManagement.detailModal.policyNotice",
                    "개인설정은 별도 권한 없이 모든 로그인 사용자가 접근할 수 있습니다.",
                  )}
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  {SIMPLE_PERMISSION_CONTROLS.map((control) => {
                    const checked = hasEverySimplePermissionCode(
                      memberDetailDraft.permissionCodes,
                      control.permissionCodes,
                    );

                    return (
                      <label
                        key={control.id}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 text-left transition",
                          checked
                            ? "border-[var(--pbp-accent-border)] bg-[var(--pbp-accent-soft)]"
                            : "border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] hover:border-[var(--pbp-accent-border)]",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleSimplePermissionControl(control)}
                          className="mt-1 size-4 rounded border-[var(--pbp-border)]"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold pbp-text-primary">
                            {t(control.labelKey, control.fallbackLabel)}
                          </span>
                          <span className="mt-1 block text-xs leading-5 pbp-text-muted">
                            {t(control.descriptionKey, control.fallbackDescription)}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </AdminModalSection>
          </div>
        ) : null}
      </AdminModal>

      <ToastMessage message={feedbackMessage} />
    </div>
  );
}
