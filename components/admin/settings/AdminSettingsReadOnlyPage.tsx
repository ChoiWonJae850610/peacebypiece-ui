import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { formatRoles } from "@/lib/constants/roles";
import { buildDefaultCompanySettings } from "@/lib/admin/settings/companyDefaults";
import {
  getCompanySettings,
  getCurrentAdminCompany,
} from "@/lib/admin/settings/companyRepository";
import {
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_RETENTION_DAY_OPTIONS,
  ADMIN_THEME_OPTIONS,
  buildAdminStorageStatusPreview,
  getAdminSettingsUpdatedAtLabel,
} from "@/lib/admin/settings/presentation";
import { listCompanyUserAccessProfiles } from "@/lib/admin/settings/userAccessRepository";
import type { AdminCompanySummary, CompanySettings } from "@/lib/admin/settings/companyTypes";
import type { UserProfile } from "@/types/user";

type SettingsSourceState = "db-connected" | "fallback";

interface AdminSettingsReadOnlyModel {
  company: AdminCompanySummary;
  settings: CompanySettings;
  users: UserProfile[];
  sourceState: SettingsSourceState;
  message: string;
}

async function loadReadOnlyModel(): Promise<AdminSettingsReadOnlyModel> {
  try {
    const company = await getCurrentAdminCompany();
    const [settings, users] = await Promise.all([
      getCompanySettings(company.id),
      listCompanyUserAccessProfiles(company.id).catch(() => []),
    ]);

    return {
      company,
      settings,
      users,
      sourceState: "db-connected",
      message: "DB 기준 환경설정 데이터를 불러왔습니다.",
    };
  } catch (error) {
    return {
      company: {
        id: WORKSPACE_COMPANY_ID,
        name: WORKSPACE_COMPANY_NAME,
        memo: "fallback company",
        isActive: true,
      },
      settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID),
      users: [],
      sourceState: "fallback",
      message:
        error instanceof Error
          ? `DB 환경설정 조회 실패: ${error.message}`
          : "DB 환경설정 조회 실패: fallback 설정을 표시합니다.",
    };
  }
}

function BooleanBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"
      }`}
    >
      {label}
    </span>
  );
}

function ReadOnlyCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-stone-950">{value}</p>
      {description ? (
        <p className="mt-2 text-xs leading-5 text-stone-500">{description}</p>
      ) : null}
    </article>
  );
}

function UiSettingsSection({ settings }: { settings: CompanySettings }) {
  const selectedTheme =
    ADMIN_THEME_OPTIONS.find((item) => item.value === settings.ui.themeColor) ??
    ADMIN_THEME_OPTIONS[0];
  const selectedLanguage =
    ADMIN_LANGUAGE_OPTIONS.find((item) => item.value === settings.ui.language) ??
    ADMIN_LANGUAGE_OPTIONS[0];

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">화면 설정</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        고객사 관리자 화면의 theme, language, compact mode 설정입니다. 이번 버전에서는 저장 action 없이 read-only로 표시합니다.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <ReadOnlyCard
          label="테마"
          value={selectedTheme.label}
          description={selectedTheme.description}
        />
        <ReadOnlyCard
          label="언어"
          value={selectedLanguage.label}
          description="i18n 연결 기준 언어입니다."
        />
        <ReadOnlyCard
          label="Compact mode"
          value={settings.ui.compactMode ? "사용" : "미사용"}
          description="목록/카드 밀도 조정 설정입니다."
        />
      </div>
    </section>
  );
}

function FilePolicySection({ settings }: { settings: CompanySettings }) {
  const previews = buildAdminStorageStatusPreview(settings.filePolicy);
  const retentionOptions = ADMIN_RETENTION_DAY_OPTIONS.join(" / ");

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">파일 정책</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        첨부파일 휴지통, 보관일, 저장용량 warning 정책입니다. 첨부 업로드/삭제/R2 흐름은 변경하지 않습니다.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ReadOnlyCard
          label="Soft delete"
          value={settings.filePolicy.softDeleteEnabled ? "사용" : "미사용"}
          description="삭제 시 즉시 제거하지 않고 휴지통 상태로 보관합니다."
        />
        <ReadOnlyCard
          label="휴지통 용량 포함"
          value={settings.filePolicy.includeTrashInUsage ? "포함" : "제외"}
          description="저장공간 사용량 계산 기준입니다."
        />
        <ReadOnlyCard
          label="휴지통 보관일"
          value={`${settings.filePolicy.trashRetentionDays}일`}
          description={`허용 옵션: ${retentionOptions}일`}
        />
        <ReadOnlyCard
          label="저장용량 경고"
          value={`${settings.filePolicy.warningThresholdPercent}%`}
          description={`${settings.filePolicy.storageLimitGb}GB 기준 warning threshold`}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {previews.map((preview) => (
          <article
            key={preview.tone}
            className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
          >
            <p className="text-xs font-semibold uppercase text-stone-500">
              {preview.tone}
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {preview.label}
            </p>
            <p className="mt-2 text-xs leading-5 text-stone-500">
              {preview.description || "저장공간 상태 preview"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function NotificationPolicySection({ settings }: { settings: CompanySettings }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-950">알림 정책</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        고객사 단위 알림 정책의 현재 설정입니다. 실제 알림 발송/저장 action은 이번 버전에서 변경하지 않습니다.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <BooleanBadge
          active={settings.notificationPolicy.reviewRequestEnabled}
          label="검토요청"
        />
        <BooleanBadge
          active={settings.notificationPolicy.orderReadyEnabled}
          label="발주준비"
        />
        <BooleanBadge
          active={settings.notificationPolicy.storageWarningEnabled}
          label="저장공간 경고"
        />
        <BooleanBadge
          active={settings.notificationPolicy.purgeResultEnabled}
          label="파일 정리 결과"
        />
      </div>
    </section>
  );
}

function UserAccessSection({ users }: { users: UserProfile[] }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">사용자 접근 권한</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            고객사 사용자와 role/permission 상태를 read-only로 표시합니다. 역할 변경 modal과 저장 action은 연결하지 않습니다.
          </p>
        </div>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600">
          {users.length}명
        </span>
      </div>

      {users.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
          표시할 사용자 데이터가 없습니다.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {user.name}
                  </p>
                  <p className="mt-1 text-xs font-medium text-stone-500">
                    {formatRoles(user.roles, user.role)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <BooleanBadge
                    active={user.permissions.canAssignRoles}
                    label="권한관리"
                  />
                  <BooleanBadge
                    active={user.permissions.canEditInventory}
                    label="재고수정"
                  />
                  <BooleanBadge
                    active={user.permissions.canSeeCostSections}
                    label="원가조회"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminSettingsReadOnlyPage() {
  const model = await loadReadOnlyModel();
  const updatedAtLabel =
    getAdminSettingsUpdatedAtLabel(model.settings.updatedAt) ?? "저장 이력 없음";

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                ADMIN SETTINGS
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-stone-950">
                환경설정
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                고객사 화면, 파일 정책, 알림 정책, 사용자 접근 권한을 read-only로 확인하는 관리자 설정 화면입니다.
                저장 action과 권한 변경 modal은 이번 버전에서 연결하지 않습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                v{APP_VERSION}
              </span>
              <Link
                href="/admin"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                관리자 홈
              </Link>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                작업지시서 홈
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <ReadOnlyCard
            label="고객사"
            value={model.company.name}
            description={model.company.memo || model.company.id}
          />
          <ReadOnlyCard
            label="데이터 출처"
            value={model.sourceState === "db-connected" ? "DB" : "Fallback"}
            description={model.message}
          />
          <ReadOnlyCard label="최근 저장" value={updatedAtLabel} />
        </section>

        <UiSettingsSection settings={model.settings} />
        <FilePolicySection settings={model.settings} />
        <NotificationPolicySection settings={model.settings} />
        <UserAccessSection users={model.users} />
      </div>
    </main>
  );
}
