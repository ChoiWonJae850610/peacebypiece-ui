import { AdminButton } from "@/components/admin/common/AdminButton";
import {
  AdminStatusBadge,
  type AdminStatusBadgeTone,
} from "@/components/admin/common/AdminStatusBadge";
import type { AdminTableColumn } from "@/lib/admin/common/types";
import type { AdminCompanyMemberRecord } from "@/lib/admin/members/memberTypes";
import {
  toMemberJoinRequestPreviews,
  toMemberListPreviews,
} from "@/lib/admin/members/memberManagementPresentation";
import type { MemberPermissionRoleTemplateCode } from "@/lib/permissions";

export type MemberDirectoryStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "suspended"
  | "withdrawalRequested";

export type MemberDirectoryStatus =
  | "pending"
  | "approved"
  | "suspended"
  | "withdrawalRequested"
  | "withdrawn"
  | "rejected";

export type MemberDirectoryJoinRequestPreview = ReturnType<
  typeof toMemberJoinRequestPreviews
>[number];

export type MemberDirectoryRow = {
  id: string;
  source: "joinRequest" | "member";
  name: string;
  email: string;
  phone: string;
  roleId: string | null;
  status: MemberDirectoryStatus;
  requestedAt: string;
  approvedAt: string;
  lastActiveAt: string;
  joinRequest?: MemberDirectoryJoinRequestPreview;
  member?: ReturnType<typeof toMemberListPreviews>[number];
  memberRecord?: AdminCompanyMemberRecord;
};

export type JoinRequestReviewAction = "approve" | "reject";

type MemberDirectoryRoleOption = {
  id: MemberPermissionRoleTemplateCode;
};

type TranslationFn = (key: string, fallback: string) => string;

type BuildMemberDirectoryColumnsOptions = {
  t: TranslationFn;
  inviteRoleOptions: readonly MemberDirectoryRoleOption[];
  reviewingJoinRequestId: string | null;
  getJoinRequestReviewRoleId: (
    request: MemberDirectoryJoinRequestPreview,
  ) => MemberPermissionRoleTemplateCode;
  onRoleDraftChange: (
    requestId: string,
    roleTemplateCode: MemberPermissionRoleTemplateCode,
  ) => void;
  onReviewJoinRequest: (
    request: MemberDirectoryJoinRequestPreview,
    action: JoinRequestReviewAction,
  ) => void;
};

function getMemberDirectoryStatusTone(
  status: MemberDirectoryStatus,
): AdminStatusBadgeTone {
  if (status === "approved") return "success";
  if (status === "suspended" || status === "withdrawn" || status === "rejected") {
    return "danger";
  }
  return "warning";
}

export function buildMemberDirectoryColumns({
  t,
  inviteRoleOptions,
  reviewingJoinRequestId,
  getJoinRequestReviewRoleId,
  onRoleDraftChange,
  onReviewJoinRequest,
}: BuildMemberDirectoryColumnsOptions): AdminTableColumn<MemberDirectoryRow>[] {
  return [
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
        <AdminStatusBadge tone={getMemberDirectoryStatusTone(row.status)}>
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
                onRoleDraftChange(
                  row.joinRequest!.id,
                  event.target.value as MemberPermissionRoleTemplateCode,
                )
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
              onClick={() => onReviewJoinRequest(row.joinRequest!, "approve")}
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
              onClick={() => onReviewJoinRequest(row.joinRequest!, "reject")}
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
  ];
}
