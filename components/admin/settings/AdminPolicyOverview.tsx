"use client";

import { AdminCard } from "@/components/admin/layout/AdminCard";
import AppBadge, { type AppBadgeTone } from "@/components/common/ui/AppBadge";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import {
  buildAdminPolicyOverviewViewModel,
  type AdminPolicyStatus,
} from "@/lib/admin/settings/adminPolicyPresentation";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";

type AdminPolicyOverviewProps = {
  settings: CompanySettings;
};

function getStatusTone(status: AdminPolicyStatus): AppBadgeTone {
  if (status === "active") return "success";
  if (status === "fixed") return "info";
  return "neutral";
}

function PolicyCard({
  item,
}: {
  item: ReturnType<
    typeof buildAdminPolicyOverviewViewModel
  >["filePolicies"][number];
}) {
  return (
    <WaflSurface as="article" shape="control" tone="surface" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[var(--pbp-text-muted)]">
            {item.title}
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--pbp-text-primary)]">
            {item.value}
          </p>
        </div>
        <AppBadge tone={getStatusTone(item.status)} size="xs">
          {item.statusLabel}
        </AppBadge>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--pbp-text-muted)]">
        {item.description}
      </p>
    </WaflSurface>
  );
}

export default function AdminPolicyOverview({
  settings,
}: AdminPolicyOverviewProps) {
  const t = useAdminTranslation();
  const viewModel = buildAdminPolicyOverviewViewModel(settings);

  return (
    <AdminCard className="shrink-0 p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--pbp-text-primary)]">
            {t("settings.policyOverview.title", "고객사 관리자 정책")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]">
            {t(
              "settings.policyOverview.description",
              "삭제방식, 용량 한도, 휴지통 포함 여부와 조직 운영 기준을 환경설정 메인에서 먼저 확인합니다.",
            )}
          </p>
        </div>
      </div>

      <section className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
            {t("settings.policyOverview.filePolicyTitle", "파일/용량 정책")}
          </h3>
          <span className="text-xs font-semibold text-[var(--pbp-text-subtle)]">
            {t(
              "settings.policyOverview.mainExposureLabel",
              "환경설정 메인 노출",
            )}
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {viewModel.filePolicies.map((item) => (
            <PolicyCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <WaflSurface shape="control" tone="muted" className="p-4">
          <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
            {t(
              "settings.policyOverview.operationPolicyTitle",
              "운영 정책 정리",
            )}
          </h3>
          <div className="mt-3 grid gap-2">
            {viewModel.workspacePolicies.map((item) => (
              <WaflSurface
                key={item.id}
                shape="control"
                tone="surface"
                className="p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--pbp-text-muted)]">
                      {item.value}
                    </p>
                  </div>
                  <AppBadge tone={getStatusTone(item.status)} size="xs">
                    {item.statusLabel}
                  </AppBadge>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                  {item.description}
                </p>
              </WaflSurface>
            ))}
          </div>
        </WaflSurface>

        <WaflSurface shape="control" tone="muted" className="p-4">
          <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
            {t(
              "settings.policyOverview.serviceFeatureTitle",
              "서비스 운영 항목",
            )}
          </h3>
          <div className="mt-3 grid gap-2">
            {viewModel.developmentFeatures.map((item) => (
              <WaflSurface
                key={item.id}
                shape="control"
                tone="warning"
                className="p-3"
              >
                <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--pbp-text-muted)]">
                  {item.description}
                </p>
              </WaflSurface>
            ))}
          </div>
        </WaflSurface>
      </section>

      <section className="mt-4 wafl-shape-surface border border-[var(--pbp-brand-muted)] bg-[var(--pbp-brand-primary)] p-4 text-[var(--pbp-text-inverse)]">
        <h3 className="text-sm font-semibold">
          {t("settings.policyOverview.nextStepTitle", "운영 적용 기준")}
        </h3>
        <ul className="mt-3 grid gap-2 lg:grid-cols-3">
          {viewModel.nextSteps.map((item) => (
            <li
              key={item}
              className="wafl-shape-control bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-3 text-xs leading-5 text-[var(--pbp-text-inverse)] opacity-75"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </AdminCard>
  );
}
