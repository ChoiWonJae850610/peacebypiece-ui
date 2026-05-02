import SystemRegressionRoutePage from "@/components/system/regression/SystemRegressionRoutePage";

export default function SystemInvitesPage() {
  return (
    <SystemRegressionRoutePage
      eyebrow="SYSTEM INVITES"
      title="고객 초대"
      description="고객 초대 route의 무결성 점검 화면입니다. 초대 API와 DB 저장 흐름은 유지하며, 본 UI 재연결은 하위 컴포넌트 JSX 확인 후 진행합니다."
      currentRouteId="invites"
    />
  );
}
