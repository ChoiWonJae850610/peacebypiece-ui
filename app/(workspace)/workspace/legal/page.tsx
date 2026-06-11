import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import { AdminCard, AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { PolicyAgreementStatusPanel, PolicyReagreementStatusPanel } from "@/components/policies/PolicyAgreementStatusPanel";
import { CUSTOMER_POLICY_DOCUMENTS, getRequiredPolicyDocumentCount, type CustomerPolicyDocumentCategory } from "@/lib/policies/customerPolicyDocuments";
import { AppBadge, WaflSurface } from "@/components/common/ui";

const categoryTone: Record<CustomerPolicyDocumentCategory, AdminStatusBadgeTone> = {
  service: "brand",
  privacy: "info",
  billing: "success",
  data: "warning",
  operation: "neutral",
};

export default async function WorkspaceLegalPage() {
  const session = await requireWaflSessionForArea("workspace");
  const requiredPolicyCount = getRequiredPolicyDocumentCount();

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/legal"
      title="약관·정책"
      description="WAFL 이용에 필요한 고객 공개 약관과 운영정책을 확인합니다."
    >
      <AdminSection
        eyebrow="WAFL Policy"
        title="고객 공개 약관·정책"
        description="이 화면은 고객사 관리자와 일반 멤버가 함께 확인하는 정책 문서 열람 영역입니다. 현재는 서비스 초기 공개 문서 기준으로 제공하며, 정책 버전, 동의 이력, 중요 정책 재동의 상태를 함께 확인합니다."
        actions={
          <>
            <AdminStatusBadge tone="brand">고객 공개</AdminStatusBadge>
            <AdminStatusBadge tone="warning">필수 동의 {requiredPolicyCount}건</AdminStatusBadge>
          </>
        }
        className="p-5 sm:p-6"
        bodyClassName="mt-5 space-y-5"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <AdminCard as="article" className="p-5">
            <p className="text-xs font-semibold pbp-text-subtle">문서 수</p>
            <p className="mt-2 text-2xl font-semibold pbp-text-primary">{CUSTOMER_POLICY_DOCUMENTS.length}건</p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">고객 공개 대상 약관·정책 문서입니다.</p>
          </AdminCard>
          <AdminCard as="article" className="p-5">
            <p className="text-xs font-semibold pbp-text-subtle">필수 동의</p>
            <p className="mt-2 text-2xl font-semibold pbp-text-primary">{requiredPolicyCount}건</p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">고객사 승인 요청과 연결할 필수 동의 문서입니다.</p>
          </AdminCard>
          <AdminCard as="article" className="p-5">
            <p className="text-xs font-semibold pbp-text-subtle">버전 상태</p>
            <p className="mt-2 text-2xl font-semibold pbp-text-primary">v1.0</p>
            <p className="mt-2 text-sm leading-6 pbp-text-muted">초기 공개 문서 기준입니다. 시행일 확정 후 동의 이력과 연결합니다.</p>
          </AdminCard>
        </div>

        <PolicyReagreementStatusPanel />

        <PolicyAgreementStatusPanel />

        <div className="grid gap-4 xl:grid-cols-2">
          {CUSTOMER_POLICY_DOCUMENTS.map((document) => (
            <AdminCard key={document.id} as="article" className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminStatusBadge tone={categoryTone[document.category]}>{document.categoryLabel}</AdminStatusBadge>
                    <AdminStatusBadge tone="neutral">{document.versionLabel}</AdminStatusBadge>
                    {document.requiredForApproval ? <AdminStatusBadge tone="warning">필수 동의</AdminStatusBadge> : null}
                  </div>
                  <h2 className="mt-3 text-lg font-semibold pbp-text-primary">{document.title}</h2>
                  <p className="mt-1 text-sm font-semibold pbp-text-muted">{document.subtitle}</p>
                  <p className="mt-3 text-sm leading-6 pbp-text-muted">{document.summary}</p>
                </div>
                <AppBadge tone="neutral" size="sm" className="shrink-0">
                  {document.effectiveDateLabel}
                </AppBadge>
              </div>

              <div className="mt-4 grid gap-3">
                {document.sections.map((section) => (
                  <WaflSurface key={section.title} as="section" shape="control" tone="muted" component="policy-document-section" className="p-4">
                    <h3 className="text-sm font-semibold pbp-text-primary">{section.title}</h3>
                    <p className="mt-2 text-sm leading-6 pbp-text-muted">{section.body}</p>
                  </WaflSurface>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>

        <AdminCard as="section" className="p-5">
          <h2 className="text-base font-semibold pbp-text-primary">운영 기준</h2>
          <div className="mt-3 grid gap-2 text-sm leading-6 pbp-text-muted md:grid-cols-2">
            <p>• 고객 공개 문서와 내부 운영 문서는 분리해 관리합니다.</p>
            <p>• 필수 동의 여부와 동의 이력은 현재 사용자 기준으로 저장합니다.</p>
            <p>• 고객사 승인 요청 전 필수 동의 확인은 후속 단계에서 연결합니다.</p>
            <p>• 중요 정책 변경 시 재동의 필요 상태를 먼저 표시하고 후속 버전에서 업무 접근 차단과 연결합니다.</p>
          </div>
        </AdminCard>
      </AdminSection>
    </WorkspacePageShell>
  );
}
