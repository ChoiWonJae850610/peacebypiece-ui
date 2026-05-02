import SystemRegressionRoutePage from "@/components/system/regression/SystemRegressionRoutePage";

export default function SystemBillingPage() {
  return (
    <SystemRegressionRoutePage
      eyebrow="SYSTEM BILLING"
      title="요금제·용량"
      description="요금제·용량 route의 무결성 점검 화면입니다. DB 기반 billing API는 유지하며, 본 UI 재연결은 하위 컴포넌트 JSX 확인 후 진행합니다."
      currentRouteId="billing"
    />
  );
}
