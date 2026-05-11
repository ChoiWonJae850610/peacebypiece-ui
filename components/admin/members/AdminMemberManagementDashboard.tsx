"use client";

import Link from "next/link";
import {
  getInvitationTableColumns,
  getJoinRequestTableColumns,
  getMemberInvitationPreviews,
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

export default function AdminMemberManagementDashboard() {
  const t = useAdminTranslation();
  const summaryCards = getMemberManagementSummaryCards();
  const roles = getMemberRolePreviews();
  const permissionCards = getMemberManagementPermissionCards();
  const groups = getMemberPermissionGroupPreviews();
  const catalogItems = getMemberPermissionCatalogPreviews();
  const matrixItems = getMemberPermissionMatrixPreviews();
  const memberColumns = getMemberTableColumns();
  const invitationColumns = getInvitationTableColumns();
  const joinRequestColumns = getJoinRequestTableColumns();
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
            <button
              type="button"
              className="inline-flex w-fit items-center justify-center rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-500"
              disabled
            >
              {t("memberManagement.actions.createInvite", "초대 링크 생성")}
            </button>
            <Link
              href="/admin/settings"
              className="inline-flex w-fit items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              {t("memberManagement.actions.openOrganizationSettings", "조직 설정 보기")}
            </Link>
          </div>
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
            <div className="p-3">
              {joinRequests.length ? null : (
                <EmptyState
                  title={t("memberManagement.empty.joinRequests.title", "승인 대기 신청이 없습니다")}
                  description={t("memberManagement.empty.joinRequests.description", "초대 링크 가입 신청이 생성되면 승인/거절/권한 부여 대상이 이 영역에 표시됩니다.")}
                />
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-950">
          {t("memberManagement.sections.workspaceCards", "메인화면 카드 권한")}
        </h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("memberManagement.sections.workspaceCardsDescription", "관리자가 권한을 부여하면 해당 멤버의 메인화면에 표시될 카드 후보입니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {permissionCards.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-stone-950">
                  {t(`memberManagement.permissionCards.${item.id}.label`, item.id)}
                </h4>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
                  {t(`memberManagement.statuses.${item.status}`, item.status)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                {t(`memberManagement.permissionCards.${item.id}.description`, "")}
              </p>
            </article>
          ))}
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
