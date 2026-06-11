"use client";

import { AppSelect } from "@/components/common/ui";
import { WaflButton } from "@/components/common/ui/WaflButton";
import {
  WaflInfoBox,
  WaflSelectableCard,
} from "@/components/common/ui/WaflForm";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { AdminModalSection } from "@/components/admin/layout/AdminModal";
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

const MEMBER_DETAIL_SELECT_TRIGGER_CLASS = "h-11 wafl-shape-control";

type AdminMemberPermissionDetailBodyProps = {
  t: AdminTranslate;
  draft: MemberPermissionDetailDraft;
  selectedMember: AdminCompanyMemberRecord | null;
  selectedRolePreview: AdminMemberRolePreview | null;
  selectedPermissionCount: number;
  manageableRoles: readonly AdminMemberRolePreview[];
  statusOptions: readonly MemberStatusOption[];
  onStatusChange: (status: AdminCompanyMemberRecord["status"]) => void;
  onRoleTemplateChange: (
    roleTemplateCode: MemberPermissionRoleTemplateCode,
  ) => void;
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
      <WaflSurface
        component="member-permission-summary"
        shape="control"
        tone="muted"
        className="grid gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1.1fr)_160px_160px]"
      >
        <div className="min-w-0" data-wafl-component="member-summary-identity">
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
        <WaflInfoBox
          component="member-summary-role"
          tone="neutral"
          density="compact"
        >
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
        </WaflInfoBox>
        <WaflInfoBox
          component="member-summary-permissions"
          tone="neutral"
          density="compact"
        >
          <p className="text-[11px] font-semibold pbp-text-muted">
            {t("memberManagement.detailModal.summary.permissions", "선택 항목")}
          </p>
          <p className="mt-1 text-sm font-semibold pbp-text-primary">
            {t(
              "memberManagement.detailModal.selectedPermissionCount",
              "{count}개 선택",
            ).replace("{count}", String(selectedPermissionCount))}
          </p>
        </WaflInfoBox>
      </WaflSurface>

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
              ariaLabel={t(
                "memberManagement.detailModal.fields.status",
                "상태",
              )}
              triggerClassName={MEMBER_DETAIL_SELECT_TRIGGER_CLASS}
            />
          </label>

          <WaflInfoBox
            component="member-status-helper"
            tone="info"
            state="info"
            density="compact"
            className="text-xs leading-5 pbp-text-muted"
          >
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
          </WaflInfoBox>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <WaflButton
              key={option.value}
              type="button"
              variant={draft.status === option.value ? "primary" : "secondary"}
              size="sm"
              onClick={() => onStatusChange(option.value)}
            >
              {t(option.labelKey, option.fallbackLabel)}
            </WaflButton>
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
              triggerClassName={MEMBER_DETAIL_SELECT_TRIGGER_CLASS}
            />
          </label>

          <WaflInfoBox
            component="member-role-template-helper"
            tone="info"
            state="info"
            density="compact"
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-xs leading-5 pbp-text-muted">
              {t(
                "memberManagement.detailModal.roleTemplateHelper",
                "역할은 담당자 표시와 업무 구분에 사용합니다. 실제 권한은 아래 체크 항목으로 결정되며, 필요할 때만 역할 기본값을 적용합니다.",
              )}
            </p>
            <WaflButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onApplyRoleTemplatePermissions}
            >
              {t(
                "memberManagement.detailModal.actions.resetRoleTemplate",
                "선택 역할의 권한 기본값 적용",
              )}
            </WaflButton>
          </WaflInfoBox>

          <WaflInfoBox
            component="member-permission-policy-notice"
            tone="muted"
            density="compact"
            className="text-[11px] leading-5 pbp-text-muted"
          >
            {t(
              "memberManagement.detailModal.policyNotice",
              "개인설정은 별도 권한 없이 모든 로그인 사용자가 접근할 수 있습니다.",
            )}
          </WaflInfoBox>

          <div className="grid gap-3 md:grid-cols-2">
            {SIMPLE_PERMISSION_CONTROLS.map((control) => {
              const checked = hasSomeSimplePermissionCode(
                draft.permissionCodes,
                control.permissionCodes,
              );

              return (
                <WaflSelectableCard
                  key={control.id}
                  component="member-permission-card"
                  selected={checked}
                  onClick={() => onToggleSimplePermissionControl(control)}
                  className="items-start justify-start px-3 py-3"
                >
                  <span
                    data-wafl-component="permission-check-indicator"
                    className={[
                      "mt-1 inline-flex size-4 shrink-0 items-center justify-center wafl-shape-icon border text-[10px] font-bold",
                      checked
                        ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-border)] text-white"
                        : "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-transparent",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold pbp-text-primary">
                      {t(control.labelKey, control.fallbackLabel)}
                    </span>
                    <span className="mt-1 block text-xs leading-5 pbp-text-muted">
                      {t(control.descriptionKey, control.fallbackDescription)}
                    </span>
                  </span>
                </WaflSelectableCard>
              );
            })}
          </div>
        </div>
      </AdminModalSection>
    </div>
  );
}
