import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import { AdminCard, AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { APP_VERSION } from "@/lib/constants/app";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";

const POLICY_ITEMS = [
  {
    id: "terms",
    title: "이용약관",
    status: "조회용",
    description: "WAFL 서비스 이용 조건, 계정 이용 기준, 고객사와 멤버의 기본 책임 범위를 확인합니다.",
  },
  {
    id: "privacy",
    title: "개인정보처리방침",
    status: "조회용",
    description: "로그인 계정, 업무 프로필, 첨부파일 처리 과정에서 적용되는 개인정보 처리 기준을 확인합니다.",
  },
  {
    id: "operation",
    title: "서비스 운영정책",
    status: "조회용",
    description: "초대, 승인, 권한, 파일 보관, 휴지통, 삭제 요청 등 업무 운영 기준을 확인합니다.",
  },
  {
    id: "data-retention",
    title: "데이터 보관·삭제정책",
    status: "조회용",
    description: "작업지시서, 문서, 디자인, 메모, 휴지통 항목의 보관과 삭제 요청 기준을 확인합니다.",
  },
] as const;

export default async function WorkspaceLegalPage() {
  const session = await requireWaflSessionForArea("workspace");

  return (
    <WorkspaceShell
      companyName={session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/legal", { role: session.role })}
      title="약관·정책"
      description="일반멤버도 확인할 수 있는 서비스 약관과 운영정책 조회 화면입니다."
    >
      <AdminSection
        eyebrow="Policy"
        title="약관·정책"
        description="현재는 조회용 정책 허브로 제공하며, 실제 공개 문서 연결과 시스템관리자 편집 기능은 후속 운영 화면에서 분리합니다."
        actions={<AdminStatusBadge tone="info">조회 전용</AdminStatusBadge>}
        className="p-5 sm:p-6"
        bodyClassName="mt-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {POLICY_ITEMS.map((item) => (
            <AdminCard key={item.id} as="article" className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold pbp-text-primary">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 pbp-text-muted">{item.description}</p>
                </div>
                <AdminStatusBadge tone="neutral">{item.status}</AdminStatusBadge>
              </div>
            </AdminCard>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-4">
          <p className="text-sm font-semibold pbp-text-primary">운영 메모</p>
          <p className="mt-2 text-sm leading-6 pbp-text-muted">
            이 화면은 일반멤버용 조회 진입점입니다. 정책 원문 파일, 버전 이력, 동의 이력, 시스템관리자 편집 화면은 별도 버전에서 연결합니다.
          </p>
        </div>
      </AdminSection>
    </WorkspaceShell>
  );
}
