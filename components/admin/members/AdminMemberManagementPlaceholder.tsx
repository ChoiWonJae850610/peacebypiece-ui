"use client";

import Link from "next/link";
import {
  getMemberManagementPermissionCards,
  getMemberPermissionGroupPreviews,
  getMemberRolePreviews,
  type MemberManagementStatus,
} from "@/lib/admin/members/memberManagementPresentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

function getStatusClassName(status: MemberManagementStatus) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-stone-200 bg-stone-100 text-stone-500";
}

export default function AdminMemberManagementPlaceholder() {
  const t = useAdminTranslation();
  const roles = getMemberRolePreviews();
  const cards = getMemberManagementPermissionCards();
  const groups = getMemberPermissionGroupPreviews();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <section className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
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
                "멤버 초대, 역할 지정, 권한 기반 카드 노출을 연결하기 전의 1차 설계 화면입니다.",
              )}
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="inline-flex w-fit items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            {t("memberManagement.actions.openOrganizationSettings", "조직 설정 보기")}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-stone-950">{t("memberManagement.sections.roles", "역할 기본값")}</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            {t("memberManagement.sections.rolesDescription", "역할은 기본 권한 묶음으로 사용하고, 실제 화면 노출은 권한 코드 기준으로 확장합니다.")}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {roles.map((role) => (
              <div key={role.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-900">{t(`memberManagement.roles.${role.id}.label`, role.id)}</p>
                  <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-500">
                    {t("memberManagement.statuses.planned", "설계 중")}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">{t(`memberManagement.roles.${role.id}.description`, "역할 설명")}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-stone-950">{t("memberManagement.sections.nextSteps", "다음 구현 범위")}</h3>
          <div className="mt-4 space-y-3">
            {["invite", "role", "permission", "workspace"].map((step) => (
              <div key={step} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-semibold text-stone-900">{t(`memberManagement.nextSteps.${step}.title`, step)}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{t(`memberManagement.nextSteps.${step}.description`, "")}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-950">{t("memberManagement.sections.workspaceCards", "메인화면 카드 권한")}</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("memberManagement.sections.workspaceCardsDescription", "관리자가 권한을 부여하면 해당 멤버의 메인화면에 표시될 카드 후보입니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((item) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-stone-950">{t(`memberManagement.permissionCards.${item.id}.label`, item.id)}</h4>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
                  {t(`memberManagement.statuses.${item.status}`, item.status)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">{t(`memberManagement.permissionCards.${item.id}.description`, "")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-stone-950">{t("memberManagement.sections.permissionGroups", "권한 그룹")}</h3>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {t("memberManagement.sections.permissionGroupsDescription", "실제 DB 권한 테이블을 만들 때 사용할 권한 그룹 기준입니다.")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => (
            <div key={group.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-900">{t(`memberManagement.permissionGroups.${group.id}.label`, group.id)}</p>
              <p className="mt-2 text-xs font-semibold text-stone-500">
                {t("memberManagement.permissionCount", "권한 {count}개").replace("{count}", String(group.permissionCount))}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
