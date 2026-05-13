"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getInvitationTableColumns,
  getJoinRequestTableColumns,
  getMemberApprovalActionPreviews,
  getMemberApprovalPermissionPreviews,
  getMemberApprovalStepPreviews,
  getMemberInvitationPreviews,
  getMemberInvitationSetupCards,
  getMemberInviteQrPreviewRows,
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
  type MemberInvitationPreview,
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
import { AdminButton, AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import AdminTable from "@/components/admin/common/AdminTable";
import type { AdminTableColumn } from "@/lib/admin/common/types";

function getStatusTone(status: MemberManagementStatus): AdminStatusBadgeTone {
  if (status === "ready") return "success";
  if (status === "pending") return "warning";
  return "neutral";
}

type CreatedInvitationResult = {
  inviteUrl: string;
  rawToken: string;
  invitation?: {
    id: string;
    expiresAt: string;
  };
};

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

function getEmailMatchTone(status: "matched" | "mismatched" | "unknown"): AdminStatusBadgeTone {
  if (status === "matched") return "success";
  if (status === "mismatched") return "warning";
  return "neutral";
}

function getMemberStatusTone(status: "approved" | "pending" | "suspended"): AdminStatusBadgeTone {
  if (status === "approved") return "success";
  if (status === "suspended") return "danger";
  return "warning";
}

const invitationStatusToneMap: Record<MemberInvitationPreview["status"], AdminStatusBadgeTone> = {
  draft: "neutral",
  active: "success",
  expired: "warning",
};

function getInvitationStatusTone(status: MemberInvitationPreview["status"]): AdminStatusBadgeTone {
  return invitationStatusToneMap[status];
}

const editableMemberPermissionCodes = MEMBER_PERMISSION_CATALOG.filter((permission) => !permission.systemOnly).map((permission) => permission.code);

function getLoadStatusLabelKey(status: MemberJoinRequestLoadStatus | MemberListLoadStatus): string {
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

function QrPreview({ rows }: { rows: readonly (readonly boolean[])[] }) {
  return (
    <div className="grid size-36 grid-cols-9 rounded-2xl border border-stone-200 bg-white p-2 shadow-inner" aria-hidden="true">
      {rows.flatMap((row, rowIndex) =>
        row.map((enabled, columnIndex) => (
          <span
            key={`${rowIndex}-${columnIndex}`}
            className={enabled ? "m-0.5 rounded-sm bg-stone-900" : "m-0.5 rounded-sm bg-stone-100"}
          />
        )),
      )}
    </div>
  );
}

export default function AdminMemberManagementDashboard() {
  const t = useAdminTranslation();
  const baseSummaryCards = getMemberManagementSummaryCards();
  const roles = getMemberRolePreviews();
  const permissionCards = getMemberManagementPermissionCards();
  const currentPermissionCodes = getMemberRoleTemplatePermissions("company_admin");
  const invitationSetupCards = getMemberInvitationSetupCards();
  const inviteRoleOptions = getMemberInviteRoleOptions();
  const inviteQrPreviewRows = getMemberInviteQrPreviewRows();
  const approvalSteps = getMemberApprovalStepPreviews();
  const approvalActions = getMemberApprovalActionPreviews();
  const approvalPermissions = getMemberApprovalPermissionPreviews();
  const groups = getMemberPermissionGroupPreviews();
  const catalogItems = getMemberPermissionCatalogPreviews();
  const matrixItems = getMemberPermissionMatrixPreviews();
  const memberColumns = getMemberTableColumns();
  const invitationColumns = getInvitationTableColumns();
  const joinRequestColumns = getJoinRequestTableColumns();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(inviteRoleOptions[1]?.id ?? inviteRoleOptions[0]?.id ?? "viewer");
  const selectedRole = useMemo(
    () => inviteRoleOptions.find((role) => role.id === selectedRoleId) ?? inviteRoleOptions[0],
    [inviteRoleOptions, selectedRoleId],
  );
  const [targetName, setTargetName] = useState("");
  const [targetContact, setTargetContact] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7d");
  const [createdInvitation, setCreatedInvitation] = useState<CreatedInvitationResult | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [memberRecords, setMemberRecords] = useState<AdminCompanyMemberRecord[]>([]);
  const [memberListLoadStatus, setMemberListLoadStatus] = useState<MemberListLoadStatus>("idle");
  const [memberListLoadError, setMemberListLoadError] = useState<string | null>(null);
  const [memberPermissionDrafts, setMemberPermissionDrafts] = useState<Record<string, MemberPermissionCode[]>>({});
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [memberPermissionUpdateMessage, setMemberPermissionUpdateMessage] = useState<string | null>(null);
  const [memberPermissionUpdateError, setMemberPermissionUpdateError] = useState<string | null>(null);
  const [joinRequestRecords, setJoinRequestRecords] = useState<JoinRequestRecord[]>([]);
  const [joinRequestLoadStatus, setJoinRequestLoadStatus] = useState<MemberJoinRequestLoadStatus>("idle");
  const [joinRequestLoadError, setJoinRequestLoadError] = useState<string | null>(null);
  const [reviewingJoinRequestId, setReviewingJoinRequestId] = useState<string | null>(null);
  const [joinRequestReviewMessage, setJoinRequestReviewMessage] = useState<string | null>(null);
  const [joinRequestReviewError, setJoinRequestReviewError] = useState<string | null>(null);
  const previewInviteLink = createdInvitation?.inviteUrl
    ? getAbsoluteInviteUrl(createdInvitation.inviteUrl)
    : `/invite/member/preview-${selectedRole?.id ?? "viewer"}`;
  const canCreateInvite = hasEveryMemberPermission(
    { permissionCodes: currentPermissionCodes },
    ["member.invite"],
  );

  const members = useMemo(() => toMemberListPreviews(memberRecords), [memberRecords]);
  const invitations = getMemberInvitationPreviews();
  const invitationTableColumns = useMemo<AdminTableColumn<MemberInvitationPreview>[]>(
    () =>
      invitationColumns.map((column) => ({
        key: column.id,
        label: t(`memberManagement.tables.invitations.columns.${column.id}`, column.id),
        render: (invitation) => {
          if (column.id === "target") {
            return <span className="truncate font-semibold text-stone-900">{invitation.targetLabel}</span>;
          }

          if (column.id === "type") {
            return (
              <span className="font-semibold text-stone-700">
                {t(`memberManagement.invitationTypes.${invitation.inviteType}`, invitation.inviteType)}
              </span>
            );
          }

          if (column.id === "status") {
            return (
              <AdminStatusBadge tone={getInvitationStatusTone(invitation.status)}>
                {t(`memberManagement.invitationStatuses.${invitation.status}`, invitation.status)}
              </AdminStatusBadge>
            );
          }

          return <span className="text-stone-500">{invitation.expiresLabel}</span>;
        },
      })),
    [invitationColumns, t],
  );
  const joinRequests = useMemo(() => toMemberJoinRequestPreviews(joinRequestRecords), [joinRequestRecords]);
  const summaryCards = useMemo(
    () =>
      baseSummaryCards.map((card) =>
        card.id === "members"
          ? { ...card, value: String(members.length), status: memberListLoadStatus === "loaded" ? "ready" : card.status }
          : card.id === "joinRequests"
            ? { ...card, value: String(joinRequests.length), status: joinRequestLoadStatus === "loaded" ? "ready" : card.status }
            : card,
      ),
    [baseSummaryCards, joinRequestLoadStatus, joinRequests.length, memberListLoadStatus, members.length],
  );
  const canSubmitInvite = canCreateInvite && targetContact.trim().length > 0 && !isCreatingInvite;

  async function loadCompanyMembers() {
    setMemberListLoadStatus("loading");
    setMemberListLoadError(null);

    try {
      const response = await fetch(`/api/admin/members?companyId=${encodeURIComponent(WORKSPACE_COMPANY_ID)}&status=approved&limit=50`, {
        cache: "no-store",
        headers: { "x-peacebypiece-permissions": "member.read,member.permission.update" },
      });
      const payload = (await response.json()) as MemberListResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "MEMBERS_LOAD_FAILED");
      }

      const nextMembers = payload.members ?? [];
      setMemberRecords(nextMembers);
      setMemberPermissionDrafts((previous) => {
        const nextDrafts: Record<string, MemberPermissionCode[]> = {};
        for (const member of nextMembers) {
          nextDrafts[member.id] = previous[member.id] ?? [...member.permissionCodes];
        }
        return nextDrafts;
      });
      setMemberListLoadStatus("loaded");
    } catch (error) {
      setMemberRecords([]);
      setMemberListLoadStatus("failed");
      setMemberListLoadError(error instanceof Error ? error.message : "MEMBERS_LOAD_FAILED");
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
      setJoinRequestLoadError(error instanceof Error ? error.message : "JOIN_REQUESTS_LOAD_FAILED");
    }
  }

  useEffect(() => {
    void loadCompanyMembers();
    void loadMemberJoinRequests();
  }, []);

  async function handleReviewJoinRequest(request: (typeof joinRequests)[number], action: JoinRequestReviewAction) {
    if (reviewingJoinRequestId) return;

    setReviewingJoinRequestId(request.id);
    setJoinRequestReviewError(null);
    setJoinRequestReviewMessage(null);

    try {
      const response = await fetch(`/api/invitations/join-requests/${encodeURIComponent(request.id)}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorUserId: "user-sample-admin",
          roleTemplateCode: request.requestedRoleId,
          permissionCodes: getMemberRoleTemplatePermissions(request.requestedRoleId),
          reasonCode: action === "reject" ? "customer_admin_rejected" : undefined,
        }),
      });
      const payload = (await response.json()) as JoinRequestReviewResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "JOIN_REQUEST_REVIEW_FAILED");
      }

      setJoinRequestReviewMessage(
        action === "approve"
          ? t("memberManagement.reviewActions.approveSuccess", "가입 신청을 승인했습니다.")
          : t("memberManagement.reviewActions.rejectSuccess", "가입 신청을 거절했습니다."),
      );
      await loadMemberJoinRequests();
      await loadCompanyMembers();
    } catch (error) {
      setJoinRequestReviewError(error instanceof Error ? error.message : "JOIN_REQUEST_REVIEW_FAILED");
    } finally {
      setReviewingJoinRequestId(null);
    }
  }

  function handleToggleMemberPermission(memberId: string, permissionCode: MemberPermissionCode) {
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
      const response = await fetch(`/api/admin/members/${encodeURIComponent(memberId)}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-peacebypiece-permissions": "member.permission.update",
        },
        body: JSON.stringify({
          actorUserId: "user-sample-admin",
          permissionCodes: memberPermissionDrafts[memberId] ?? [],
        }),
      });
      const payload = (await response.json()) as MemberPermissionUpdateResponse;

      if (!response.ok || !payload.ok || !payload.member) {
        throw new Error(payload.error ?? "MEMBER_PERMISSION_UPDATE_FAILED");
      }

      setMemberPermissionUpdateMessage(t("memberManagement.memberActions.permissionUpdateSuccess", "멤버 권한을 저장했습니다."));
      await loadCompanyMembers();
    } catch (error) {
      setMemberPermissionUpdateError(error instanceof Error ? error.message : "MEMBER_PERMISSION_UPDATE_FAILED");
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleCreateInvite() {
    if (!canSubmitInvite || !selectedRole) return;

    setIsCreatingInvite(true);
    setInviteError(null);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "company_to_member",
          companyId: WORKSPACE_COMPANY_ID,
          inviterCompanyId: WORKSPACE_COMPANY_ID,
          recipientEmail: targetContact.trim(),
          recipientRole: selectedRole.id as "designer" | "inspector" | "inventory_manager" | "viewer",
          permissionPreset: selectedRole.id,
          expiresAt: resolveExpiresAt(expiresInDays),
          createdByUserId: "user-sample-admin",
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "INVITATION_CREATE_FAILED");
      }

      setCreatedInvitation({
        inviteUrl: payload.inviteUrl,
        rawToken: payload.rawToken,
        invitation: payload.invitation,
      });
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "INVITATION_CREATE_FAILED");
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function handleCopyInviteLink() {
    if (!createdInvitation?.inviteUrl || typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(getAbsoluteInviteUrl(createdInvitation.inviteUrl));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              {t("memberManagement.eyebrow", "Member permissions")}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              {t("memberManagement.title", "멤버 관리")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              {t(
                "memberManagement.description",
                "고객사 멤버 초대, 가입 신청 승인, 권한 부여를 한 화면에서 처리하는 멤버관리 IA입니다.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminLinkButton
              href={canCreateInvite ? "#member-invite-builder" : "#member-permission-guard"}
              aria-disabled={!canCreateInvite}
              variant={canCreateInvite ? "primary" : "secondary"}
              className={canCreateInvite ? "" : "pointer-events-none text-stone-400"}
            >
              {t("memberManagement.actions.createInvite", "초대 링크 생성")}
            </AdminLinkButton>
            <AdminLinkButton href="/admin/settings" variant="secondary">
              {t("memberManagement.actions.openOrganizationSettings", "조직 설정 보기")}
            </AdminLinkButton>
          </div>
        </div>
      </section>

      <section id="member-invite-builder" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              {t("memberManagement.inviteBuilder.eyebrow", "Invitation link and QR")}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-950">
              {t("memberManagement.inviteBuilder.title", "초대 링크/QR 생성 화면")}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              {t(
                "memberManagement.inviteBuilder.description",
                "고객관리자가 내부 멤버에게 전달할 링크와 QR을 생성하기 전 입력값, 기본 권한 묶음, 승인 대기 흐름을 한 화면에서 확인합니다.",
              )}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
            {invitationSetupCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-stone-900">
                    {t(`memberManagement.inviteBuilder.cards.${card.id}.label`, card.id)}
                  </p>
                  <AdminStatusBadge tone={getStatusTone(card.status)} size="xs">
                    {t(`memberManagement.statuses.${card.status}`, card.status)}
                  </AdminStatusBadge>
                </div>
                <p className="mt-2 text-[11px] leading-4 text-stone-500">
                  {t(`memberManagement.inviteBuilder.cards.${card.id}.description`, "")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <span className="text-xs font-semibold text-stone-500">
                {t("memberManagement.inviteBuilder.fields.targetName", "초대 대상 이름")}
              </span>
              <input
                type="text"
                value={targetName}
                onChange={(event) => setTargetName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
                placeholder={t("memberManagement.inviteBuilder.placeholders.targetName", "예: 디자이너 김00")}
              />
            </label>
            <label className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <span className="text-xs font-semibold text-stone-500">
                {t("memberManagement.inviteBuilder.fields.targetContact", "이메일 또는 휴대폰")}
              </span>
              <input
                type="email"
                value={targetContact}
                onChange={(event) => setTargetContact(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
                placeholder={t("memberManagement.inviteBuilder.placeholders.targetContact", "designer@example.com") }
              />
            </label>
            <label className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <span className="text-xs font-semibold text-stone-500">
                {t("memberManagement.inviteBuilder.fields.roleTemplate", "기본 권한 묶음")}
              </span>
              <select
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
              >
                {inviteRoleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {t(`memberManagement.roles.${role.id}.label`, role.id)} · {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(role.permissionCount))}
                  </option>
                ))}
              </select>
            </label>
            <label className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <span className="text-xs font-semibold text-stone-500">
                {t("memberManagement.inviteBuilder.fields.expires", "초대 만료") }
              </span>
              <select
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
              >
                <option value="3d">{t("memberManagement.inviteBuilder.expires.3d", "3일")}</option>
                <option value="7d">{t("memberManagement.inviteBuilder.expires.7d", "7일")}</option>
                <option value="14d">{t("memberManagement.inviteBuilder.expires.14d", "14일")}</option>
              </select>
            </label>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 md:col-span-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-500">
                    {t("memberManagement.inviteBuilder.previewLinkLabel", "초대 링크 미리보기")}
                  </p>
                  <code className="mt-2 block truncate rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700">
                    {previewInviteLink}
                  </code>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminButton
                    onClick={handleCopyInviteLink}
                    variant="secondary"
                    disabled={!createdInvitation}
                  >
                    {t("memberManagement.inviteBuilder.actions.copy", "링크 복사")}
                  </AdminButton>
                  <AdminButton
                    onClick={handleCreateInvite}
                    variant="primary"
                    disabled={!canSubmitInvite}
                  >
                    {isCreatingInvite
                      ? t("memberManagement.inviteBuilder.actions.creating", "생성 중")
                      : t("memberManagement.inviteBuilder.actions.create", "초대 생성")}
                  </AdminButton>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                {createdInvitation
                  ? t("memberManagement.inviteBuilder.createdNotice", "초대가 생성되었습니다. raw token은 이 응답에서만 확인되며 DB에는 token_hash만 저장됩니다.")
                  : t("memberManagement.inviteBuilder.disabledNotice", "이메일을 입력하면 invitations API로 실제 초대 링크를 생성합니다.")}
              </p>
              {targetName.trim() ? (
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {t("memberManagement.inviteBuilder.targetNameNotice", "초대 대상")}: {targetName.trim()}
                </p>
              ) : null}
              {inviteError ? (
                <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  {inviteError}
                </p>
              ) : null}
              {createdInvitation?.invitation ? (
                <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  ID {createdInvitation.invitation.id} · expires {new Date(createdInvitation.invitation.expiresAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="flex flex-col items-center justify-center rounded-3xl border border-stone-200 bg-stone-50 p-5 text-center">
            <QrPreview rows={inviteQrPreviewRows} />
            <p className="mt-4 text-sm font-semibold text-stone-950">
              {t("memberManagement.inviteBuilder.qrTitle", "QR 미리보기")}
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              {t("memberManagement.inviteBuilder.qrDescription", "QR은 초대 링크 token 생성 API와 연결한 뒤 실제 값으로 렌더링합니다.")}
            </p>
            <p className="mt-3 text-xs font-semibold text-stone-500">
              {t("memberManagement.inviteBuilder.selectedRole", "선택 권한 {role} · {count}개")
                .replace("{role}", t(`memberManagement.roles.${selectedRole?.id ?? "viewer"}.label`, selectedRole?.id ?? "viewer"))
                .replace("{count}", String(selectedRole?.permissionCount ?? 0))}
            </p>
          </aside>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.id} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  {t(`memberManagement.summary.${card.id}.label`, card.id)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">{card.value}</p>
              </div>
              <AdminStatusBadge tone={getStatusTone(card.status)}>
                {t(`memberManagement.statuses.${card.status}`, card.status)}
              </AdminStatusBadge>
            </div>
            <p className="mt-3 text-xs leading-5 text-stone-500">
              {t(`memberManagement.summary.${card.id}.description`, "")}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              {t("memberManagement.approvalWorkbench.eyebrow", "Join request approval")}
            </p>
            <h3 className="mt-2 text-base font-semibold text-stone-950">
              {t("memberManagement.approvalWorkbench.title", "멤버 승인/권한 부여 화면")}
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-stone-500">
              {t(
                "memberManagement.approvalWorkbench.description",
                "가입 신청자를 확인하고 승인 또는 거절하기 전에 role template 기준 권한을 직접 조정하는 1차 화면입니다.",
              )}
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-400">
            {t("memberManagement.sourceState.dbPending", "DB 연결 예정")}
          </span>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-stone-950">
                  {t("memberManagement.approvalWorkbench.previewApplicant.name", "김디자이너")}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {t("memberManagement.approvalWorkbench.previewApplicant.email", "designer@example.com")}
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {t("memberManagement.approvalWorkbench.previewApplicant.description", "초대 링크로 가입 신청한 멤버를 승인하기 전 상태 예시입니다.")}
                </p>
              </div>
              <AdminStatusBadge tone="warning">
                {t("memberManagement.joinRequestStatuses.pending", "승인 대기")}
              </AdminStatusBadge>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {approvalSteps.map((step) => (
                <div key={step.id} className="rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-900">
                      {t(`memberManagement.approvalWorkbench.steps.${step.id}.label`, step.id)}
                    </p>
                    <AdminStatusBadge tone={getStatusTone(step.status)} size="xs">
                      {t(`memberManagement.statuses.${step.status}`, step.status)}
                    </AdminStatusBadge>
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-stone-500">
                    {t(`memberManagement.approvalWorkbench.steps.${step.id}.description`, "")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-500">
                    {t("memberManagement.approvalWorkbench.permissionChecklistTitle", "권한 체크리스트")}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    {t("memberManagement.approvalWorkbench.permissionChecklistDescription", "기본 권한 묶음은 시작값이고 승인 저장 시 permission_code 목록을 직접 저장합니다.")}
                  </p>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(approvalPermissions.length))}
                </span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {approvalPermissions.map((permission) => (
                  <label key={permission.code} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700">
                    <input type="checkbox" checked={permission.checked} readOnly className="size-4 rounded border-stone-300" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{permission.code}</span>
                    <span className="text-[11px] text-stone-400">
                      {t(`memberManagement.permissionGroups.${permission.group}.label`, permission.group)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-stone-200 bg-white p-4">
            <h4 className="text-sm font-semibold text-stone-950">
              {t("memberManagement.approvalWorkbench.actionsTitle", "승인 처리 액션")}
            </h4>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              {t("memberManagement.approvalWorkbench.actionsDescription", "실제 저장은 join_requests, company_members, member_permissions API 연결 후 활성화합니다.")}
            </p>
            <div className="mt-4 grid gap-2">
              {approvalActions.map((action) => {
                const hasRequiredPermission = hasEveryMemberPermission(
                  { permissionCodes: currentPermissionCodes },
                  action.requiredPermissions,
                );
                return (
                  <AdminButton
                    key={action.id}
                    disabled
                    variant="secondary"
                    className="flex-col items-stretch justify-start gap-1 rounded-xl bg-stone-50 px-3 py-2 text-left text-xs text-stone-500"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{t(`memberManagement.approvalWorkbench.actions.${action.id}.label`, action.id)}</span>
                      <AdminStatusBadge tone={getStatusTone(action.status)} size="xs">
                        {t(`memberManagement.statuses.${action.status}`, action.status)}
                      </AdminStatusBadge>
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">
                      {hasRequiredPermission
                        ? t("memberManagement.permissionGuards.allowedButDbPending", "권한 충족 · DB 연결 예정")
                        : t("memberManagement.permissionGuards.blocked", "권한 부족")}
                    </span>
                  </AdminButton>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">
                {t("memberManagement.approvalWorkbench.guardTitle", "저장 전제")}
              </p>
              <p className="mt-2 text-xs leading-5 text-amber-700">
                {t("memberManagement.approvalWorkbench.guardDescription", "승인 시 company_members를 approved로 만들고 member_permissions에 선택 권한을 저장해야 합니다. 거절 시 join_requests만 rejected 처리합니다.")}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-stone-950">
                {t("memberManagement.sections.members", "멤버 목록")}
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {t("memberManagement.sections.membersDescription", "승인된 멤버와 정지된 멤버를 한 목록에서 관리합니다.")}
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">
              {t(`memberManagement.sourceState.${getLoadStatusLabelKey(memberListLoadStatus)}`, "DB 연결 상태 확인")}
            </span>
          </div>
          {memberListLoadError ? (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {t("memberManagement.loadErrors.members", "멤버 목록을 불러오지 못했습니다.")} {memberListLoadError}
            </p>
          ) : null}
          {memberPermissionUpdateMessage ? (
            <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              {memberPermissionUpdateMessage}
            </p>
          ) : null}
          {memberPermissionUpdateError ? (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {t("memberManagement.memberActions.permissionUpdateError", "멤버 권한 저장에 실패했습니다.")} {memberPermissionUpdateError}
            </p>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[minmax(150px,1fr)_110px_90px_100px_110px_140px] bg-stone-50 text-xs font-semibold text-stone-500">
                {memberColumns.map((column) => (
                  <div key={column.id} className="px-3 py-2">
                    {t(`memberManagement.tables.members.columns.${column.id}`, column.id)}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-stone-100">
                {memberListLoadStatus === "loading" ? (
                  <div className="p-3">
                    <AdminEmptyState
                      title={t("memberManagement.loading.members.title", "멤버 목록을 불러오는 중입니다")}
                      description={t("memberManagement.loading.members.description", "승인된 company_members와 member_permissions를 실제 DB 기준으로 조회하고 있습니다.")}
                    />
                  </div>
                ) : members.length ? (
                  members.map((member) => {
                    const draftPermissionCodes = memberPermissionDrafts[member.id] ?? [...member.permissionCodes];
                    const hasPermissionChanged = draftPermissionCodes.slice().sort().join("|") !== member.permissionCodes.slice().sort().join("|");
                    return (
                      <div key={member.id} className="grid grid-cols-[minmax(150px,1fr)_110px_90px_100px_110px_140px] px-3 py-3 text-xs text-stone-600">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-stone-900">{member.name}</p>
                          <p className="mt-1 truncate text-stone-500">{member.email}</p>
                        </div>
                        <span className="font-semibold text-stone-700">
                          {t(`memberManagement.roles.${member.roleId}.label`, member.roleId)}
                        </span>
                        <AdminStatusBadge tone={getMemberStatusTone(member.status)}>
                          {t(`memberManagement.memberStatuses.${member.status}`, member.status)}
                        </AdminStatusBadge>
                        <span className="font-semibold text-stone-700">
                          {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(draftPermissionCodes.length))}
                        </span>
                        <span className="text-stone-500">{member.lastActiveLabel}</span>
                        <AdminButton
                          onClick={() => void handleUpdateMemberPermissions(member.id)}
                          disabled={!hasPermissionChanged || updatingMemberId !== null || draftPermissionCodes.length === 0}
                          variant="primary"
                          size="sm"
                          className="px-3 py-1 text-[11px]"
                        >
                          {updatingMemberId === member.id
                            ? t("memberManagement.memberActions.saving", "저장 중")
                            : t("memberManagement.memberActions.savePermissions", "권한 저장")}
                        </AdminButton>
                        <div className="col-span-6 mt-3 grid gap-2 rounded-2xl border border-stone-100 bg-stone-50 p-3 md:grid-cols-2 xl:grid-cols-3">
                          {editableMemberPermissionCodes.map((permissionCode) => (
                            <label key={`${member.id}-${permissionCode}`} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-[11px] text-stone-700">
                              <input
                                type="checkbox"
                                checked={draftPermissionCodes.includes(permissionCode)}
                                onChange={() => handleToggleMemberPermission(member.id, permissionCode)}
                                className="size-4 rounded border-stone-300"
                              />
                              <span className="min-w-0 flex-1 truncate font-semibold">{permissionCode}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3">
                    <AdminEmptyState
                      title={t("memberManagement.empty.members.title", "등록된 멤버가 없습니다")}
                      description={t("memberManagement.empty.members.description", "초대/가입 승인 API를 연결하면 승인된 멤버가 이 영역에 표시됩니다.")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-stone-950">
            {t("memberManagement.sections.roles", "역할 기본값")}
          </h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {t("memberManagement.sections.rolesDescription", "역할은 기본 권한 묶음으로 사용하고, 실제 화면 노출은 권한 코드 기준으로 확장합니다.")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {roles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-900">
                    {t(`memberManagement.roles.${role.id}.label`, role.id)}
                  </p>
                  <AdminStatusBadge tone={getStatusTone(role.status)}>
                    {t(`memberManagement.statuses.${role.status}`, role.status)}
                  </AdminStatusBadge>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {t(`memberManagement.roles.${role.id}.description`, "역할 설명")}
                </p>
                <p className="mt-3 text-xs font-semibold text-stone-500">
                  {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(role.permissionCount))}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-stone-950">
                {t("memberManagement.sections.invitations", "초대 대기 목록")}
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {t("memberManagement.sections.invitationsDescription", "생성된 초대 링크와 QR의 만료, 취소 상태를 관리합니다.")}
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">
              {t("memberManagement.sourceState.dbPending", "DB 연결 예정")}
            </span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <AdminTable
              items={invitations}
              columns={invitationTableColumns}
              getRowKey={(invitation) => invitation.id}
              emptyLabel={t("memberManagement.empty.invitations.title", "생성된 초대가 없습니다")}
              emptyDescription={t("memberManagement.empty.invitations.description", "초대 링크 생성 기능을 연결하면 활성/만료/취소 초대가 표시됩니다.")}
              gridTemplateColumns="minmax(150px,1.2fr) 90px 90px 110px"
              rowBaseClassName="grid w-full gap-3 px-4 py-3 text-left text-xs text-stone-600 md:items-center"
              className="min-w-[520px]"
            />
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-stone-950">
                {t("memberManagement.sections.joinRequests", "가입 신청/승인 대기")}
              </h3>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {t("memberManagement.sections.joinRequestsDescription", "초대 링크로 가입 신청한 사용자를 승인하거나 거절하는 영역입니다.")}
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">
              {t(`memberManagement.sourceState.${getLoadStatusLabelKey(joinRequestLoadStatus)}`, "DB 연결 상태 확인")}
            </span>
          </div>
          {joinRequestLoadError ? (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {t("memberManagement.loadErrors.joinRequests", "승인 대기 신청 목록을 불러오지 못했습니다.")} {joinRequestLoadError}
            </p>
          ) : null}
          {joinRequestReviewMessage ? (
            <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
              {joinRequestReviewMessage}
            </p>
          ) : null}
          {joinRequestReviewError ? (
            <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {t("memberManagement.reviewActions.error", "가입 신청 처리에 실패했습니다.")} {joinRequestReviewError}
            </p>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200">
            <div className="min-w-[980px]">
            <div className="grid grid-cols-[minmax(150px,1.2fr)_130px_170px_100px_minmax(130px,1fr)_110px_90px_110px_150px] bg-stone-50 text-xs font-semibold text-stone-500">
              {joinRequestColumns.map((column) => (
                <div key={column.id} className="px-3 py-2">
                  {t(`memberManagement.tables.joinRequests.columns.${column.id}`, column.id)}
                </div>
              ))}
            </div>
            <div className="divide-y divide-stone-100">
              {joinRequestLoadStatus === "loading" ? (
                <div className="p-3">
                  <AdminEmptyState
                    title={t("memberManagement.loading.joinRequests.title", "승인 대기 신청을 불러오는 중입니다")}
                    description={t("memberManagement.loading.joinRequests.description", "join_requests.pending 목록을 실제 DB 기준으로 조회하고 있습니다.")}
                  />
                </div>
              ) : joinRequests.length ? (
                joinRequests.map((request) => (
                  <div key={request.id} className="grid grid-cols-[minmax(150px,1.2fr)_130px_170px_100px_minmax(130px,1fr)_110px_90px_110px_150px] px-3 py-3 text-xs text-stone-600">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-900">{request.applicantName}</p>
                      <p className="mt-1 truncate text-stone-500">{request.applicantEmail}</p>
                    </div>
                    <span className="truncate text-stone-500">{request.applicantPhoneLabel}</span>
                    <span className="truncate text-stone-500">{request.invitationEmailLabel}</span>
                    <AdminStatusBadge tone={getEmailMatchTone(request.emailMatchStatus)}>
                      {t(`memberManagement.emailMatchStatuses.${request.emailMatchStatus}`, request.emailMatchStatus)}
                    </AdminStatusBadge>
                    <span className="truncate text-stone-500" title={request.requestMemoLabel}>
                      {request.requestMemoLabel}
                    </span>
                    <span className="font-semibold text-stone-700">
                      {t(`memberManagement.roles.${request.requestedRoleId}.label`, request.requestedRoleId)}
                    </span>
                    <AdminStatusBadge tone="warning">
                      {t(`memberManagement.joinRequestStatuses.${request.status}`, request.status)}
                    </AdminStatusBadge>
                    <span className="text-stone-500">{request.requestedAtLabel}</span>
                    <div className="flex flex-wrap gap-1.5">
                      <AdminButton
                        onClick={() => void handleReviewJoinRequest(request, "approve")}
                        disabled={reviewingJoinRequestId !== null}
                        variant="primary"
                        className="px-2.5 py-1 text-[11px]"
                      >
                        {reviewingJoinRequestId === request.id
                          ? t("memberManagement.reviewActions.processing", "처리 중")
                          : t("memberManagement.reviewActions.approve", "승인")}
                      </AdminButton>
                      <AdminButton
                        onClick={() => void handleReviewJoinRequest(request, "reject")}
                        disabled={reviewingJoinRequestId !== null}
                        variant="secondary"
                        className="px-2.5 py-1 text-[11px]"
                      >
                        {t("memberManagement.reviewActions.reject", "거절")}
                      </AdminButton>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3">
                  <AdminEmptyState
                    title={t("memberManagement.empty.joinRequests.title", "승인 대기 신청이 없습니다")}
                    description={t("memberManagement.empty.joinRequests.description", "초대 링크 가입 신청이 생성되면 승인/거절/권한 부여 대상이 이 영역에 표시됩니다.")}
                  />
                </div>
              )}
            </div>
            </div>
          </div>
        </article>
      </section>

      <section id="member-permission-guard" className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-950">
          {t("memberManagement.sections.workspaceCards", "메인화면 카드 권한")}
        </h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("memberManagement.sections.workspaceCardsDescription", "관리자가 권한을 부여하면 해당 멤버의 메인화면에 표시될 카드 후보입니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {permissionCards.map((item) => {
            const visibleForCurrentPermissions = hasEveryMemberPermission(
              { permissionCodes: currentPermissionCodes },
              item.requiredPermissions,
            );
            return (
              <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-semibold text-stone-950">
                    {t(`memberManagement.permissionCards.${item.id}.label`, item.id)}
                  </h4>
                  <AdminStatusBadge tone={getStatusTone(item.status)}>
                    {visibleForCurrentPermissions
                      ? t("memberManagement.permissionGuards.visible", "노출")
                      : t("memberManagement.permissionGuards.hidden", "숨김")}
                  </AdminStatusBadge>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {t(`memberManagement.permissionCards.${item.id}.description`, "")}
                </p>
                <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-[11px] font-semibold text-stone-500">
                  {t("memberManagement.permissionGuards.requiredPermissions", "필요 권한: {permissions}").replace(
                    "{permissions}",
                    item.requiredPermissions.join(", "),
                  )}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-950">
          {t("memberManagement.sections.permissionCatalog", "권한 카탈로그")}
        </h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("memberManagement.sections.permissionCatalogDescription", "DB permission_catalog와 role template에 넣을 permission_code 기준입니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-stone-900">
                  {t(`memberManagement.permissionGroups.${group.id}.label`, group.id)}
                </p>
                <AdminStatusBadge tone="neutral">
                  {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(group.permissionCount))}
                </AdminStatusBadge>
              </div>
              {group.systemOnlyCount > 0 ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  {t("memberManagement.systemOnlyCount", "시스템 전용 {count}개").replace("{count}", String(group.systemOnlyCount))}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
          <div className="grid grid-cols-[minmax(180px,1.2fr)_120px_90px] bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500">
            <span>{t("memberManagement.permissionCatalogColumns.code", "권한 코드")}</span>
            <span>{t("memberManagement.permissionCatalogColumns.group", "그룹")}</span>
            <span>{t("memberManagement.permissionCatalogColumns.scope", "범위")}</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {catalogItems.map((item) => (
              <div key={item.code} className="grid grid-cols-[minmax(180px,1.2fr)_120px_90px] border-t border-stone-100 px-3 py-2 text-xs text-stone-600">
                <code className="truncate font-semibold text-stone-800">{item.code}</code>
                <span>{t(`memberManagement.permissionGroups.${item.group}.label`, item.group)}</span>
                <span>{item.systemOnly ? t("memberManagement.scope.system", "시스템") : t("memberManagement.scope.company", "고객사")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-950">
          {t("memberManagement.sections.permissionMatrix", "권한 매트릭스")}
        </h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("memberManagement.sections.permissionMatrixDescription", "role은 기본 체크값이고 실제 저장과 접근 제어는 permission_code 직접 부여 기준입니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {roles.map((role) => {
            const enabledCount = matrixItems.filter((item) => item.roleId === role.id && item.enabled).length;
            return (
              <article key={role.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-900">
                  {t(`memberManagement.roles.${role.id}.label`, role.id)}
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  {t("memberManagement.matrixEnabledCount", "기본 체크 {count}개").replace("{count}", String(enabledCount))}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
