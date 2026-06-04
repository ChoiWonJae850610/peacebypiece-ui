"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AppSelect } from "@/components/common/ui";
import {
  AdminModalSection,
  adminModalInputClassName,
} from "@/components/admin/layout/AdminModal";
import type { AdminCompanyMemberRecord } from "@/lib/admin/members/memberTypes";
import {
  SIMPLE_PERMISSION_CONTROLS,
  hasSomeSimplePermissionCode,
  type SimplePermissionControl,
} from "@/lib/admin/members/memberSimplePermissionControls";
import type {
  MemberPermissionCode,
  MemberPermissionRoleTemplateCode,
} from "@/lib/permissions";

type AdminMemberRolePreview = {
  id: MemberPermissionRoleTemplateCode;
};

export type MemberPermissionDetailDraft = {
  displayName: string;
  phone: string;
  status: AdminCompanyMemberRecord["status"];
  roleTemplateCode: MemberPermissionRoleTemplateCode;
  permissionCodes: MemberPermissionCode[];
};

type AdminTranslate = (
  path: string,
  fallback?: string,
  params?: Record<string, string | number>,
) => string;

type MemberStatusOption = {
  value: AdminCompanyMemberRecord["status"];
  labelKey: string;
  fallbackLabel: string;
};

type AdminMemberPermissionDetailBodyProps = {
  t: AdminTranslate;
  draft: MemberPermissionDetailDraft;
  selectedMember: AdminCompanyMemberRecord | null;
  selectedRolePreview: AdminMemberRolePreview | null;
  selectedPermissionCount: number;
  manageableRoles: readonly AdminMemberRolePreview[];
  statusOptions: readonly MemberStatusOption[];
  onStatusChange: (status: AdminCompanyMemberRecord["status"]) => void;
  onRoleTemplateChange: (roleTemplateCode: MemberPermissionRoleTemplateCode) => void;
  onApplyRoleTemplatePermissions: () => void;
  onToggleSimplePermissionControl: (control: SimplePermissionControl) => void;
};

export default function AdminMemberPermissionDetailBody({
  t,
  draft,
  selectedMember,
  selectedRolePreview,
  selectedPermissionCount,
  manageableRoles,
  statusOptions,
  onStatusChange,
  onRoleTemplateChange,
  onApplyRoleTemplatePermissions,
  onToggleSimplePermissionControl,
}: AdminMemberPermissionDetailBodyProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4 md:grid-cols-[minmax(0,1.1fr)_160px_160px]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">
            {t("memberManagement.detailModal.summary.title", "선택 멤버")}
          </p>
          <p className="mt-1 truncate text-base font-semibold pbp-text-primary">
            {selectedMember?.name ?? draft.displayName}
          </p>
          <p className="mt-1 truncate text-xs pbp-text-muted">
            {selectedMember?.email ?? "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2">
          <p className="text-[11px] font-semibold pbp-text-muted">
            {t("memberManagement.detailModal.summary.role", "역할")}
          </p>
          <p className="mt-1 text-sm font-semibold pbp-text-primary">
            {selectedRolePreview
              ? t(
                  `memberManagement.roles.${selectedRolePreview.id}.label`,
                  selectedRolePreview.id,
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
            ).replace("{count}", String(selectedPermissionCount))}
          </p>
        </div>
      </div>


      <AdminModalSection
        title={t(
          "memberManagement.detailModal.sections.lifecycle",
          "멤버 상태",
        )}
        description={t(
          "memberManagement.detailModal.sections.lifecycleDescription",
          "재직, 비활성, 탈퇴 요청, 탈퇴 완료 상태를 관리합니다. 비활성 또는 탈퇴 완료 멤버는 업무 담당자 후보와 일반 업무 접근에서 제외됩니다.",
        )}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-muted">
              {t("memberManagement.detailModal.fields.status", "상태")}
            </span>
            <AppSelect
              value={draft.status}
              onValueChange={(value) =>
                onStatusChange(value as AdminCompanyMemberRecord["status"])
              }
              options={statusOptions.map((option) => ({
                value: option.value,
                label: t(option.labelKey, option.fallbackLabel),
              }))}
              ariaLabel={t("memberManagement.detailModal.fields.status", "상태")}
              triggerClassName={adminModalInputClassName}
            />
          </label>

          <div className="rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs leading-5 pbp-text-muted">
            <p className="font-semibold pbp-text-primary">
              {t(
                "memberManagement.detailModal.lifecycle.statusTitle",
                "상태 변경 기준",
              )}
            </p>
            <p className="mt-1">
              {t(
                "memberManagement.detailModal.lifecycle.statusHelper",
                "탈퇴 요청은 멤버가 탈퇴 의사를 표시한 상태이고, 탈퇴 완료는 관리자가 처리를 확정한 상태입니다. 실제 저장은 하단 저장 버튼을 눌렀을 때 반영됩니다.",
              )}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <AdminButton
              key={option.value}
              type="button"
              variant={draft.status === option.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => onStatusChange(option.value)}
            >
              {t(option.labelKey, option.fallbackLabel)}
            </AdminButton>
          ))}
        </div>
      </AdminModalSection>

      <AdminModalSection
        title={t(
          "memberManagement.detailModal.sections.permissions",
          "업무 권한",
        )}
        description={t(
          "memberManagement.detailModal.sections.permissionsDescription",
          "체크 해제 시 조회만 가능하고, 체크 시 해당 업무의 작성과 관리 작업을 허용합니다. 통계는 기본 조회 권한으로 제공합니다.",
        )}
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-muted">
              {t("memberManagement.detailModal.fields.role", "역할")}
            </span>
            <AppSelect
              value={draft.roleTemplateCode}
              onValueChange={(value) =>
                onRoleTemplateChange(value as MemberPermissionRoleTemplateCode)
              }
              options={manageableRoles.map((role) => ({
                value: role.id,
                label: t(`memberManagement.roles.${role.id}.label`, role.id),
              }))}
              ariaLabel={t("memberManagement.detailModal.fields.role", "역할")}
              triggerClassName={adminModalInputClassName}
            />
          </label>

          <div className="flex flex-col gap-2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 pbp-text-muted">
              {t(
                "memberManagement.detailModal.roleTemplateHelper",
                "역할은 담당자 표시와 업무 구분에 사용합니다. 실제 권한은 아래 체크 항목으로 결정되며, 필요할 때만 역할 기본값을 적용합니다.",
              )}
            </p>
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onApplyRoleTemplatePermissions}
            >
              {t(
                "memberManagement.detailModal.actions.resetRoleTemplate",
                "선택 역할의 권한 기본값 적용",
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
              const checked = hasSomeSimplePermissionCode(
                draft.permissionCodes,
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
                    onChange={() => onToggleSimplePermissionControl(control)}
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
  );
}
