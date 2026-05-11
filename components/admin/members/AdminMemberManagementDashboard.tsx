"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  getMemberJoinRequestPreviews,
  getMemberListPreviews,
  getMemberManagementPermissionCards,
  getMemberManagementSummaryCards,
  getMemberPermissionCatalogPreviews,
  getMemberPermissionGroupPreviews,
  getMemberPermissionMatrixPreviews,
  getMemberRolePreviews,
  getMemberTableColumns,
  type MemberManagementStatus,
} from "@/lib/admin/members/memberManagementPresentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { getMemberRoleTemplatePermissions, hasEveryMemberPermission } from "@/lib/permissions";

function getStatusClassName(status: MemberManagementStatus) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-stone-200 bg-stone-100 text-stone-500";
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-5 text-center">
      <p className="text-sm font-semibold text-stone-800">{title}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{description}</p>
    </div>
  );
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
  const summaryCards = getMemberManagementSummaryCards();
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
  const previewInviteLink = `/invite/member/preview-${selectedRole?.id ?? "viewer"}`;
  const canCreateInvite = hasEveryMemberPermission(
    { permissionCodes: currentPermissionCodes },
    ["member.invite"],
  );

  const members = getMemberListPreviews();
  const invitations = getMemberInvitationPreviews();
  const joinRequests = getMemberJoinRequestPreviews();

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
            <a
              href={canCreateInvite ? "#member-invite-builder" : "#member-permission-guard"}
              aria-disabled={!canCreateInvite}
              className={
                canCreateInvite
                  ? "inline-flex w-fit items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
                  : "inline-flex w-fit items-center justify-center rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-400"
              }
            >
              {t("memberManagement.actions.createInvite", "초대 링크 생성")}
            </a>
            <Link
              href="/admin/settings"
              className="inline-flex w-fit items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              {t("memberManagement.actions.openOrganizationSettings", "조직 설정 보기")}
            </Link>
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
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusClassName(card.status)}`}>
                    {t(`memberManagement.statuses.${card.status}`, card.status)}
                  </span>
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
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
                placeholder={t("memberManagement.inviteBuilder.placeholders.targetName", "예: 디자이너 김00")}
              />
            </label>
            <label className="block rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <span className="text-xs font-semibold text-stone-500">
                {t("memberManagement.inviteBuilder.fields.targetContact", "이메일 또는 휴대폰")}
              </span>
              <input
                type="text"
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400"
                placeholder={t("memberManagement.inviteBuilder.placeholders.targetContact", "선택 입력") }
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
              <select className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400" defaultValue="7d">
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
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-500"
                    disabled
                  >
                    {t("memberManagement.inviteBuilder.actions.copy", "링크 복사")}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-500"
                    disabled
                  >
                    {t("memberManagement.inviteBuilder.actions.create", "초대 생성")}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                {t("memberManagement.inviteBuilder.disabledNotice", "실제 token 생성, 저장, 복사 기능은 invitations API 연결 후 활성화합니다.")}
              </p>
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
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(card.status)}`}>
                {t(`memberManagement.statuses.${card.status}`, card.status)}
              </span>
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
              <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                {t("memberManagement.joinRequestStatuses.pending", "승인 대기")}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {approvalSteps.map((step) => (
                <div key={step.id} className="rounded-2xl border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-900">
                      {t(`memberManagement.approvalWorkbench.steps.${step.id}.label`, step.id)}
                    </p>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusClassName(step.status)}`}>
                      {t(`memberManagement.statuses.${step.status}`, step.status)}
                    </span>
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
                  <button
                    key={action.id}
                    type="button"
                    disabled
                    className="flex flex-col gap-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-left text-xs font-semibold text-stone-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span>{t(`memberManagement.approvalWorkbench.actions.${action.id}.label`, action.id)}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${getStatusClassName(action.status)}`}>
                        {t(`memberManagement.statuses.${action.status}`, action.status)}
                      </span>
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">
                      {hasRequiredPermission
                        ? t("memberManagement.permissionGuards.allowedButDbPending", "권한 충족 · DB 연결 예정")
                        : t("memberManagement.permissionGuards.blocked", "권한 부족")}
                    </span>
                  </button>
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
              {t("memberManagement.sourceState.dbPending", "DB 연결 예정")}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
            <div className="grid grid-cols-[minmax(150px,1.2fr)_110px_90px_100px_110px] bg-stone-50 text-xs font-semibold text-stone-500">
              {memberColumns.map((column) => (
                <div key={column.id} className="px-3 py-2">
                  {t(`memberManagement.tables.members.columns.${column.id}`, column.id)}
                </div>
              ))}
            </div>
            <div className="p-3">
              {members.length ? null : (
                <EmptyState
                  title={t("memberManagement.empty.members.title", "등록된 멤버가 없습니다")}
                  description={t("memberManagement.empty.members.description", "초대/가입 승인 API를 연결하면 승인된 멤버가 이 영역에 표시됩니다.")}
                />
              )}
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
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(role.status)}`}>
                    {t(`memberManagement.statuses.${role.status}`, role.status)}
                  </span>
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
          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
            <div className="grid grid-cols-[minmax(150px,1.2fr)_90px_90px_110px] bg-stone-50 text-xs font-semibold text-stone-500">
              {invitationColumns.map((column) => (
                <div key={column.id} className="px-3 py-2">
                  {t(`memberManagement.tables.invitations.columns.${column.id}`, column.id)}
                </div>
              ))}
            </div>
            <div className="p-3">
              {invitations.length ? null : (
                <EmptyState
                  title={t("memberManagement.empty.invitations.title", "생성된 초대가 없습니다")}
                  description={t("memberManagement.empty.invitations.description", "초대 링크 생성 기능을 연결하면 활성/만료/취소 초대가 표시됩니다.")}
                />
              )}
            </div>
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
              {t("memberManagement.sourceState.dbPending", "DB 연결 예정")}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
            <div className="grid grid-cols-[minmax(150px,1.2fr)_110px_90px_110px] bg-stone-50 text-xs font-semibold text-stone-500">
              {joinRequestColumns.map((column) => (
                <div key={column.id} className="px-3 py-2">
                  {t(`memberManagement.tables.joinRequests.columns.${column.id}`, column.id)}
                </div>
              ))}
            </div>
            <div className="divide-y divide-stone-100">
              {joinRequests.length ? (
                joinRequests.map((request) => (
                  <div key={request.id} className="grid grid-cols-[minmax(150px,1.2fr)_110px_90px_110px] px-3 py-3 text-xs text-stone-600">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-900">{request.applicantName}</p>
                      <p className="mt-1 truncate text-stone-500">{request.applicantEmail}</p>
                    </div>
                    <span className="font-semibold text-stone-700">
                      {t(`memberManagement.roles.${request.requestedRoleId}.label`, request.requestedRoleId)}
                    </span>
                    <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {t(`memberManagement.joinRequestStatuses.${request.status}`, request.status)}
                    </span>
                    <span className="text-stone-500">{request.requestedAtLabel}</span>
                  </div>
                ))
              ) : (
                <div className="p-3">
                  <EmptyState
                    title={t("memberManagement.empty.joinRequests.title", "승인 대기 신청이 없습니다")}
                    description={t("memberManagement.empty.joinRequests.description", "초대 링크 가입 신청이 생성되면 승인/거절/권한 부여 대상이 이 영역에 표시됩니다.")}
                  />
                </div>
              )}
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
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
                    {visibleForCurrentPermissions
                      ? t("memberManagement.permissionGuards.visible", "노출")
                      : t("memberManagement.permissionGuards.hidden", "숨김")}
                  </span>
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
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-500">
                  {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(group.permissionCount))}
                </span>
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
