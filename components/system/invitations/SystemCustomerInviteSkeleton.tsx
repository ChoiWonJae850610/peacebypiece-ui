import SystemRegressionRoutePage from "@/components/system/regression/SystemRegressionRoutePage";

export default function SystemCustomerInviteSkeleton() {
  return (
    <SystemRegressionRoutePage
      eyebrow="SYSTEM INVITES"
      title="고객 초대"
      description="고객 초대 route의 무결성 점검 화면입니다. 본 초대 UI 재연결은 JSX 무결성 확인 후 별도 버전에서 진행합니다."
      currentRouteId="invites"
    />
  );
}
