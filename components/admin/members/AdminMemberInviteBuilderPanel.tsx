"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AppSelect } from "@/components/common/ui";
import AdminPanelSection from "@/components/admin/common/AdminPanelSection";
import {
  ADMIN_FIELD_CONTAINER_CLASS,
  ADMIN_INPUT_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminTranslate = ReturnType<typeof useAdminTranslation>;

type AdminMemberInviteBuilderPanelProps = {
  t: AdminTranslate;
  className: string;
  contentClassName: string;
  expiresInDays: string;
  inviteError: string | null;
  isCreatingInvite: boolean;
  canSubmitInvite: boolean;
  onExpiresInDaysChange: (value: string) => void;
  onCreateInvite: () => void;
};

export default function AdminMemberInviteBuilderPanel({
  t,
  className,
  contentClassName,
  expiresInDays,
  inviteError,
  isCreatingInvite,
  canSubmitInvite,
  onExpiresInDaysChange,
  onCreateInvite,
}: AdminMemberInviteBuilderPanelProps) {
  return (
    <AdminPanelSection
      className={className}
      eyebrow={t("memberManagement.inviteBuilder.eyebrow", "멤버 초대")}
      title={t("memberManagement.inviteBuilder.title", "직원 초대 생성")}
      description={t(
        "memberManagement.inviteBuilder.description",
        "초대 링크는 독립적으로 생성하고, 이메일과 휴대폰은 나중에 링크 전달 수단으로만 연결합니다.",
      )}
      contentClassName={contentClassName}
      footer={
        <div className="pt-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold pbp-text-primary">
                {t(
                  "memberManagement.inviteBuilder.sendPolicyTitle",
                  "링크 생성 기준",
                )}
              </p>
              <p className="mt-1 text-xs leading-5 pbp-text-muted">
                {t(
                  "memberManagement.inviteBuilder.sendPolicy.linkOnly",
                  "초대 링크를 생성해 복사할 수 있게 준비합니다. 실제 이메일/SMS 발송은 추후 기능에서 연결합니다.",
                )}
              </p>
              {inviteError ? (
                <p className="mt-2 text-xs font-semibold text-[var(--pbp-danger)]">
                  {inviteError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
        <label className={ADMIN_FIELD_CONTAINER_CLASS}>
          <span className="text-xs font-semibold pbp-text-muted">
            {t("memberManagement.inviteBuilder.fields.expires", "초대 만료")}
          </span>
          <AppSelect
            value={expiresInDays}
            onValueChange={onExpiresInDaysChange}
            options={[
              {
                value: "3d",
                label: t("memberManagement.inviteBuilder.expires.3d", "3일"),
              },
              {
                value: "7d",
                label: t("memberManagement.inviteBuilder.expires.7d", "7일"),
              },
              {
                value: "14d",
                label: t("memberManagement.inviteBuilder.expires.14d", "14일"),
              },
            ]}
            ariaLabel={t("memberManagement.inviteBuilder.fields.expires", "초대 만료")}
            triggerClassName={ADMIN_INPUT_CLASS}
          />
        </label>
        <div className="flex items-end">
          <AdminButton
            onClick={onCreateInvite}
            variant="primary"
            disabled={!canSubmitInvite}
            className="w-full"
          >
            {isCreatingInvite
              ? t("memberManagement.inviteBuilder.actions.creating", "생성 중")
              : t("memberManagement.inviteBuilder.actions.create", "링크 생성")}
          </AdminButton>
        </div>
      </div>
    </AdminPanelSection>
  );
}
