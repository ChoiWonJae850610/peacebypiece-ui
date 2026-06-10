import { AdminButton } from "@/components/admin/common/AdminButton";
import { AppSelect } from "@/components/common/ui";
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

export type MemberDirectorySortKey =
  | "name"
  | "email"
  | "phone"
  | "role"
  | "status"
  | "requestedAt"
  | "approvedAt"
  | "lastActiveAt";

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

type MemberQuickStatusAction = {
  status: AdminCompanyMemberRecord["status"];
  labelKey: string;
  fallbackLabel: string;
  titleKey: string;
  fallbackTitle: string;
  variant: "primary" | "secondary" | "danger";
};

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
  quickUpdatingMemberId: string | null;
  onQuickUpdateMemberStatus: (
    member: AdminCompanyMemberRecord,
    status: AdminCompanyMemberRecord["status"],
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


function getMemberQuickStatusActions(
  status: MemberDirectoryStatus,
): readonly MemberQuickStatusAction[] {
  if (status === "approved") {
    return [
      {
        status: "suspended",
        labelKey: "memberManagement.memberDirectory.actions.suspendShort",
        fallbackLabel: "비활성",
        titleKey: "memberManagement.memberDirectory.actions.suspendTitle",
        fallbackTitle: "이 멤버를 비활성 상태로 변경합니다.",
        variant: "secondary",
      },
    ];
  }

  if (status === "suspended") {
    return [
      {
        status: "approved",
        labelKey: "memberManagement.memberDirectory.actions.restoreShort",
        fallbackLabel: "재직중",
        titleKey: "memberManagement.memberDirectory.actions.restoreTitle",
        fallbackTitle: "이 멤버를 재직중 상태로 복구합니다.",
        variant: "primary",
      },
    ];
  }

  if (status === "withdrawalRequested") {
    return [
      {
        status: "withdrawn",
        labelKey: "memberManagement.memberDirectory.actions.completeWithdrawalShort",
        fallbackLabel: "탈퇴 완료",
        titleKey: "memberManagement.memberDirectory.actions.completeWithdrawalTitle",
        fallbackTitle: "이 멤버의 탈퇴 요청을 탈퇴 완료로 처리합니다.",
        variant: "danger",
      },
      {
        status: "approved",
        labelKey: "memberManagement.memberDirectory.actions.restoreShort",
        fallbackLabel: "재직중",
        titleKey: "memberManagement.memberDirectory.actions.cancelWithdrawalTitle",
        fallbackTitle: "탈퇴 요청을 취소하고 재직중 상태로 되돌립니다.",
        variant: "secondary",
      },
    ];
  }

  if (status === "withdrawn") {
    return [
      {
        status: "approved",
        labelKey: "memberManagement.memberDirectory.actions.restoreShort",
        fallbackLabel: "재직중",
        titleKey: "memberManagement.memberDirectory.actions.restoreTitle",
        fallbackTitle: "이 멤버를 재직중 상태로 복구합니다.",
        variant: "secondary",
      },
    ];
  }

  return [];
}

export function buildMemberDirectoryColumns({
  t,
  inviteRoleOptions,
  reviewingJoinRequestId,
  getJoinRequestReviewRoleId,
  onRoleDraftChange,
  onReviewJoinRequest,
  quickUpdatingMemberId,
  onQuickUpdateMemberStatus,
}: BuildMemberDirectoryColumnsOptions): AdminTableColumn<MemberDirectoryRow, MemberDirectorySortKey>[] {
  return [
    {
      key: "name",
      sortKey: "name",
      sortAlign: "left",
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
      sortKey: "email",
      sortAlign: "left",
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
      sortKey: "phone",
      label: t("memberManagement.tables.memberDirectory.columns.phone", "연락처"),
      className: "min-w-0",
      render: (row) => <span className="pbp-text-muted">{row.phone || "-"}</span>,
    },
    {
      key: "role",
      sortKey: "role",
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
      sortKey: "status",
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
      sortKey: "requestedAt",
      label: t("memberManagement.tables.memberDirectory.columns.requestedAt", "신청일"),
      className: "whitespace-nowrap",
      render: (row) => <span className="pbp-text-muted">{row.requestedAt}</span>,
    },
    {
      key: "approvedAt",
      sortKey: "approvedAt",
      label: t("memberManagement.tables.memberDirectory.columns.approvedAt", "승인일"),
      className: "whitespace-nowrap",
      render: (row) => <span className="pbp-text-muted">{row.approvedAt}</span>,
    },
    {
      key: "lastActiveAt",
      sortKey: "lastActiveAt",
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
            <AppSelect
              value={getJoinRequestReviewRoleId(row.joinRequest)}
              onValueChange={(value) =>
                onRoleDraftChange(
                  row.joinRequest!.id,
                  value as MemberPermissionRoleTemplateCode,
                )
              }
              options={inviteRoleOptions.map((role) => ({
                value: role.id,
                label: t(`memberManagement.roles.${role.id}.label`, role.id),
              }))}
              size="sm"
              width="auto"
              ariaLabel={t("memberManagement.reviewActions.roleTemplate", "승인 역할")}
              disabled={reviewingJoinRequestId !== null}
              triggerClassName="h-8 min-h-8 wafl-shape-control px-2 text-[11px]"
            />
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
        ) : row.memberRecord ? (
          <div
            className="flex flex-wrap items-center justify-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            {getMemberQuickStatusActions(row.status).map((action) => {
              const isUpdating = quickUpdatingMemberId === row.memberRecord!.id;
              return (
                <AdminButton
                  key={action.status}
                  type="button"
                  variant={action.variant}
                  size="sm"
                  className="px-2.5 py-1 text-[11px]"
                  title={t(action.titleKey, action.fallbackTitle)}
                  aria-label={t(action.titleKey, action.fallbackTitle)}
                  disabled={quickUpdatingMemberId !== null}
                  onClick={() =>
                    onQuickUpdateMemberStatus(row.memberRecord!, action.status)
                  }
                >
                  {isUpdating
                    ? t("memberManagement.memberDirectory.actions.updating", "처리 중")
                    : t(action.labelKey, action.fallbackLabel)}
                </AdminButton>
              );
            })}
          </div>
        ) : (
          <span className="block h-8" aria-hidden="true" />
        ),
    },
  ];
}
